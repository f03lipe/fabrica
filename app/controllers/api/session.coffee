
express = require 'express'
mongoose = require 'mongoose'
required = require '../lib/required'
async = require 'async'

User = mongoose.model 'User'
Notification = mongoose.model 'Notification'

module.exports = (app) ->
	router = express.Router()
	router.use required.login
	router.use required.admin
	router.get '/', (req, res) ->
		models = [
			User,
			Notification,
		]

		if req.query.session?
			return res.endJSON { ip: req.ip, session: req.session }

		for e in models
			if e instanceof Array
				if req.query[e[0].modelName.toLowerCase()]?
					e[0].find({})
						.populate(e[1])
						.exec (err, docs) ->
							res.endJSON { model: e[0].modelName, err: err, docs: docs }
					return
			else if req.query[e.modelName.toLowerCase()]?
				e.find {}, (err, _docs) ->
					if _docs.length is 0
						docs = []
					else if _docs[0] and _docs[0].fullJSON
						docs = (doc.fullJSON() for doc in _docs)
					else
						docs = (doc.toJSON() for doc in _docs)
					res.endJSON { model: e.modelName, err: err, docs: docs }
				return

		res.status(404).endJSON({ error: "Cadê?" })
	return router