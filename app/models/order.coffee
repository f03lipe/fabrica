
mongoose = require 'mongoose'
_ = require 'lodash'

Status = {
	Requested: 'requested'
	Processing: 'processing'
	Done: 'done'
}

OrderSchema = new mongoose.Schema {
	status:			{ type: String, enum: _.values(Status), default: Status.Requested }
	comments: 	{ type: String, required: false }

	created_at: { type: Date, default: Date.now }
	updated_at: { type: Date, default: Date.now }

	s3_path: 		{ type: String, required: false }

	client: 		{ type: mongoose.Schema.ObjectId, ref: 'User' }
	clerk:	 		{ type: mongoose.Schema.ObjectId, ref: 'User' }
	vendor: 		{ type: mongoose.Schema.ObjectId, ref: 'Company' }

	color: 			{ type: String }
	name: 			{ type: String }

}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

OrderSchema.statics.APISelect = '-password'


OrderSchema.statics.SingupParseRules = {
	color:
		$valid: (str) -> true
}

OrderSchema.plugin(require('./lib/hookedModelPlugin'))
OrderSchema.plugin(require('./lib/trashablePlugin'))
OrderSchema.plugin(require('./lib/fromObjectPlugin'))
OrderSchema.plugin(require('./lib/selectiveJSON'), OrderSchema.statics.APISelect)

module.exports = OrderSchema