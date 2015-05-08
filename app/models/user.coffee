
mongoose = require 'mongoose'
_ = require 'lodash'
async = require 'async'
jobs = require 'app/config/kue.js'
please = require 'app/lib/please.js'
redis = require 'app/config/redis.js'
bcrypt = require 'bcrypt'
crypto = require 'crypto'

SALT_WORK_FACTOR = 10

UserSchema = new mongoose.Schema {
	name:					{ type: String, required: true }
	email:				{ type: String, required: true, unique: true, index: true }
	password:			{ type: String, required: true }

	location:		{ type: String, default: '' }
	home: 			{ type: String, default: '' }

	company: {
		id: 		{ type: String }
		name: 	{ type: String, default: 'DeltaThinkers' }
	}

	meta: {
		registered: { type: Boolean, default: false }
		session_count: Number
		last_signin_ip: String
		current_signin_ip: String
		last_signin: { type: Date, default: Date.now }
		created_at: { type: Date, default: Date.now }
		updated_at: { type: Date, default: Date.now }
		last_access: { type: Date, default: Date.now }
		last_seen_notifications: { type: Date, default: 0 }
		last_received_notifications: { type: Date, default: 0 }
	}

	flags: {
		admin: 	false
		seller:	false
	}

}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

UserSchema.statics.APISelect = '-password'


UserSchema.pre 'save', (next) ->
	return next() if not @isModified('password')
	bcrypt.genSalt SALT_WORK_FACTOR, (err, salt) =>
		return next(err) if err
		bcrypt.hash @password, salt, (err, hash) =>
			return next(err) if err
			@password = hash
			next()

UserSchema.virtual('picture').get ->
	hash = crypto.createHash('md5').update(@email).digest('hex')
	'http://www.gravatar.com/avatar/'+hash

UserSchema.virtual('path').get ->
	'/@'+@username

UserSchema.methods.usesPassword = (candidate, cb) ->
	console.log(@)
	bcrypt.compare candidate, @password, (err, isMatch) ->
		if err
			return cb(err)
		cb(null, isMatch)

UserSchema.methods.seeNotifications = (cb) ->
	User = mongoose.model('User')
	User.findOneAndUpdate { _id: @_id }, { 'meta.last_seen_notifications': Date.now() },
	(err, save) ->
		if err or not save
			console.log("EROOOOO")
			throw err
		cb(null)

UserSchema.methods.getNotifications = (limit, cb) ->
	self = @
	return cb(null, { items:[], last_seen: Date.now(), last_update: 0 })
	if @notification_chunks.length is 0
		return cb(null, { items: [], last_seen: Date.now() })
	# TODO: Use cache here if last_sent_notification < last_seen_notifications
	id = @notification_chunks[@notification_chunks.length-1]
	NotificationChunk = mongoose.model('NotificationChunk')
	NotificationChunk.findOne { _id: id }, (err, chunk) ->
		if err
			throw err # Programmer Error
		if not chunk
			return cb(null, {})
		itemsc = _.chain(chunk.toJSON().items)
							.filter (i) ->
								# Notification either doesn't accept instances or
								# has instances
								not i.instances or i.instances.length
							.sortBy((i) -> -i.updated_at)
							.map((i) ->
								if i.instances
									# Slice and sort by date created
									sorted = _.sortBy(i.instances.slice(0,limit), (i) -> -i.created_at)
									return _.extend(i, { instances: sorted })
								else
									return i
							)
							.value()
		cb(null, {
			items: itemsc
			last_seen: self.meta.last_seen_notifications
			last_update: chunk.updated_at
		})

UserSchema.statics.NestedSchema = {
		id: String
		username: String
		path: String
		avatarUrl: String
		name: String
	}

UserSchema.statics.toNestedSchema = (user) ->
	{
		id: user.id
		name: user.name
		picture: user.picture
	}

# Useful inside templates
UserSchema.methods.toSelfJSON = () ->
	@toJSON({
		virtuals: true
		select: UserSchema.statics.APISelectSelf
	})

validator = require 'validator'

UserSchema.statics.SingupParseRules = {
	name:
		$valid: (str) -> true
		$parse: validator.trim
	email:
		$valid: (str) ->
			validator.isEmail(str)
		$parse: validator.trim
	password1:
		$msg: "Entre uma senha com ao menos 5 caracteres."
		$valid: (str) ->
			validator.isLength(str, 5)
}

UserSchema.plugin(require('./lib/hookedModelPlugin'))
UserSchema.plugin(require('./lib/trashablePlugin'))
UserSchema.plugin(require('./lib/fromObjectPlugin'))
UserSchema.plugin(require('./lib/selectiveJSON'), UserSchema.statics.APISelect)

module.exports = UserSchema