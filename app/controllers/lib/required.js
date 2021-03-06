
// required.js
// Python-like decorators for controllers.

var nconf = require('nconf');

module.exports = required = {
	logout: function (req, res, next) {
		if (req.user) {
			next({permission:'logout'});
		} else {
			next();
		}
	},
	login: function (req, res, next) {
		if (req.user) {
			next();
		} else {
			next({permission:'login'});
		}
	},
	admin: function (req, res, next) {
		if (nconf.get('env') === "production" && (!req.user || !req.user.flags.admin)) {
			next({permission:'admin', args:[req.user && req.user.flags.admin]});
		} else {
			next();
		}
	},
	self: {
		dthinker: function (req, res, next) {
			if (req.user && req.user.flags.dthinker) {
				next();
			} else {
				next({permission:'self.dthinker', args:[]});
			}
		},
		seller: function (req, res, next) {
			if (req.user && req.user.flags.seller || req.user && req.user.dthinker) {
				next();
			} else {
				next({permission:'self.seller', args:[]});
			}
		},
		canEdit: function (param) {
			return function (req, res, next) {
				if (param in req) { // If object in request object.
					var object = req[param];
					if (req.user.flags.mystique || ''+object.author.id === ''+req.user.id) {
						next();
					} else {
						next({ permission: 'canEdit' });
					}
				} else
					throw new Error("Couldn't find param "+param+" in request object.");
			};
		},
	},
	selfOwns: function (param) {
		return function (req, res, next) {
			if (param in req) { // If object in request object.
				var object = req[param];
				if (req.user.flags.mystique || ''+object.author.id === ''+req.user.id) {
					next();
				} else {
					next({ permission: 'selfOwns' });
				}
			} else
				throw new Error("Couldn't find param "+param+" in request object.");
		};
	},
	selfDoesntOwn: function (param) {
		return function (req, res, next) {
			if (param in req) { // If object in request object.
				var object = req[param];
				if (req.user.facebook_id === nconf.get('facebook_me') ||
					''+object.author.id !== ''+req.user.id) {
					next();
				} else {
					next({ permission: 'selfDoesntOwn' });
				}
			} else
				throw new Error("Couldn't find param "+param+" in request object.");
		};
	},

}