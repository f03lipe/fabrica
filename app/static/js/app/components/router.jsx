
var $ = require('jquery')
var _ = require('lodash')
var Backbone = require('backbone')
var React = require('react')
require('react.backbone')

window._ = _;
Backbone.$ = $;

var Flasher = require('../components/flasher.jsx')
var Dialog = require('../components/modal.jsx')
var Models = require('../components/models.js')

var Pages = {
	Login_Register: require('../pages/login_register.jsx'),
	Login_Recover: require('../pages/login_recover.jsx'),
	Login_Newpass: require('../pages/login_newpass.jsx'),
	ClientsList: require('../pages/clientList.jsx'),
	OrdersList: require('../pages/orderList.jsx'),
	NewPartner: require('../pages/newPartner.jsx'),
	NewClient: require('../pages/newClient.jsx'),
	NewOrder: require('../pages/newOrder.jsx'),
	Login: require('../pages/login.jsx'),
	Home: require('../pages/home.jsx'),
};

var Views = {
	Order: require('../components/OrderView.jsx'),
}

$(function () {
  if (window.__flash_messages) {
  	var wrapper = document.getElementById('flash-messages');
  	if (!wrapper) {
  		console.warn('We had flash messages to show here...'+
  			'Too bad the wrapper for those messsages was not found.');
  		return;
  	}
    var messages = window.__flash_messages;
    for (var type in messages)
    if (messages.hasOwnProperty(type)) {
      for (var i=0; i<messages[type].length; ++i) {
        var m = messages[type][i];
        $(wrapper).append($("<li class='"+type+"'>"+m+
        	"<i class='close-btn' onClick='$(this.parentElement).slideUp()'></i></li>"))
      }
    }
  }


	if (window.user) {
		// require('../components/bell.jsx');
		// $('#nav-bell').bell();
	}
});

/*
 * Organizes the allocatin and disposal of pages on the screen.
 */
var ComponentStack = function (defaultOptions) {
	var pages = [];
	var chopCounter = 0;

	class Page {
		constructor(component, opts) {
			opts = _.extend({}, defaultOptions, opts);

			var makeContainer = (opts) => {
				var el = document.createElement('div');
				if (opts.defaultClass) {
					el.classList.add(opts.defaultClass);
				}
				if (opts.class) {
					el.classList.add(opts.class);
				}
				if (opts.pageTag) {
					el.dataset.page = opts.pageTag;
				}
				return el;
			}

			this.onClose = opts.onClose;

			this.el = makeContainer(opts);
			this.component = component;
			this.destroyed = false;
			this.component.props.page = this;
			this.el.style.opacity = '0%';

			// I don't like this
			if (opts.container) {
				opts.container.appendChild(this.el);
			} else {
				document.body.appendChild(this.el);
			}

			// Save page state values to restore later.
			this.old = {};

			if (opts.chop) { // Remove scrollbars?
				this.old.chopped = true;
				chop();
			}

			if (opts.pageRoot) { // Save body[data-root] and replace by new
				// Cacilds!
				var root = document.body.dataset.root;
				this.old.pageRoot = root;
				if (root) {
					$('[data-activate-root='+root+']').removeClass('active');
				}
				$('[data-activate-root='+opts.pageRoot+']').addClass('active');
				document.body.dataset.root = opts.pageRoot;
			}

			React.render(component, this.el, () => {
				$(this.el).show();
			});
		}

		destroy() {
			if (this.destroyed) {
				console.warn("Destroy for page "+this.opts.pageTag+" being called multiple times.");
				return;
			}
			this.destroyed = true;

			pages.splice(pages.indexOf(this), 1);
			React.unmountComponentAtNode(this.el);
			$(this.el).remove();

			this._cleanUp();

			if (this.onClose) {
				this.onClose(this, this.el);
			}
		}

		_cleanUp() {
			if (this.old.chopped) {
				unchop();
			}
			if (this.old.title) {
				document.title = this.old.title;
			}
			if (this.old.pageRoot) {
				$('[data-activate-root='+document.body.dataset.root+']').removeClass('active');
				$('[data-activate-root='+this.old.pageRoot+']').addClass('active');
				document.body.dataset.root = this.old.pageRoot;
			}
		}

		set title(str)  {
			this.old.title = document.title;
			document.title = str;
		}

		hide() {
			this.old.display = this.el.css.display;
			this.el.css.display = 'none';
		}

		show() {
			if (this.old.display) {
				this.el.css.display = this.old.display;
			}
		}
	}

	function chop() {
		// Remove body scrollbar.
		if (chopCounter === 0) {
			$('body').addClass('chop');
		}
		++chopCounter;
	}

	function unchop() {
		// Show body scrollbar?
		--chopCounter;
		if (chopCounter === 0) {
			$('body').removeClass('chop');
		}
	}

	return {
		push: function (component, dataPage, opts) {
			var opts = Object.assign({
				onClose: function () {}
			}, opts || {});
			opts.pageTag = dataPage;
			var page = new Page(component, opts);
			// Hide previous pages.
			for (var i=0; i<pages.length; ++i) {
				pages[i].hide();
			}
			pages.push(page);
		},

		getActive: function () {
			if (!pages.length) {
				return null;
			}
			return pages[pages.length-1];
		},

		pop: function () {
			pages.pop().destroy();
			if (pages.length) {
				pages[pages.length-1].show();
			}
		},

		closeAll: function () {
			pages.forEach(function (page) {
				page.destroy();
			});
			pages = [];
		},
	}
};

/**
 * Customized Backbone Router, supporting triggering of components.
 */
var Router = Backbone.Router.extend({
	initialize: function () {
		this._bindComponentTriggers();
		this._bindComponentCalls();
		this._pages = new ComponentStack();
		this._components = new ComponentStack({
			defaultClass: 'component-container',
			chop: true,
		});
	},

	_bindComponentTriggers: function () {
		$('body').on('click', '[data-trigger=component]', function (e) {
			e.preventDefault();
			// Call router method
			var dataset = this.dataset;
			// Too coupled. This should be implemented as callback, or smthng. Perhaps triggered on navigation.
			$('body').removeClass('sidebarOpen');
			if (dataset.route) {
				var href = $(this).data('href') || $(this).attr('href');
				if (href)
					console.warn('Component href attribute is set to '+href+'.');
				app.navigate(href, { trigger: true, replace: false });
			} else {
				if (typeof app === 'undefined' || !app.components) {
					if (dataset.href)
						window.location.href = dataset.href;
					else
						console.error("Can't trigger component "+dataset.component+" in unexistent app object.");
					return;
				}
				if (dataset.component in app.components) {
					var data = {};
					if (dataset.args) {
						try {
							data = JSON.parse(dataset.args);
						} catch (e) {
							console.error('Failed to parse data-args '+dataset.args+' as JSON object.');
							console.error(e.stack);
							return;
						}
					}
					// Pass parsed data and element that triggered.
					app.components[dataset.component].call(app, data, this);
				} else {
					console.warn('Router doesn\'t contain component '+dataset.component+'.')
				}
			}
		});
	},

	_bindComponentCalls: function () {
		function bindComponentCall (name, fn) {
			this.on(name, function () {
				this.closeComponents();
				fn.apply(this, arguments);
			}, this);
		}

		for (var c in this.components) {
			if (this.components.hasOwnProperty(c)) {
				bindComponentCall.call(this, c, this.components[c]);
			}
		}
	},

	closeComponents: function () {
		this._components.closeAll();
	},

	pushComponent: function () {
		this._components.push.apply(this._components, arguments);
	},

	closePages: function () {
		this._pages.closeAll();
	},

	pushPage: function () {
		this._pages.push.apply(this._pages, arguments);
	},

	components: {},
});

window.Utils = {
	flash: new Flasher(),

	renderMarkdown: function (txt) {
		var marked = require('marked');
		var renderer = new marked.Renderer();
		renderer.codespan = function (html) { // Ignore codespans in md (they're actually 'latex')
			return '`'+html+'`';
		}
		marked.setOptions({
			renderer: renderer,
			gfm: false,
			tables: false,
			breaks: false,
			pedantic: false,
			sanitize: true,
			smartLists: true,
			smartypants: true,
		})
		return marked(txt);
	},

	pretty: {
		log: function (text) {
			var args = [].slice.apply(arguments);
			args.unshift('Log:');
			args.unshift('font-size: 13px;');
			args.unshift('%c %s');
			console.log.apply(console, args)
		},
		error: function (text) {
		},
	},
};


var BoxWrapper = React.createClass({

	changeOptions: "add reset remove change",

	propTypes: {
		rclass: React.PropTypes.any.isRequired,
	},

	componentWillMount: function () {
		if (this.props.model.getTitle) {
			this.props.page.title = this.props.model.getTitle();
		}
	},

	close: function () {
		this.props.page.destroy();
	},

	componentDidMount: function () {
		// Close when user clicks directly on element (meaning the faded black background)
		var self = this;
		$(this.getDOMNode().parentElement).on('click', function onClickOut (e) {
			if (e.target === this || e.target === self.getDOMNode()) {
				self.close();
				$(this).unbind('click', onClickOut);
			}
		});
	},

	render: function () {
		var Factory = React.createFactory(this.props.rclass);
		return (
			<div className='component-box' data-doc-id={this.props.model.get('id')}>
				<i className='close-btn icon-clear' data-action='close-page' onClick={this.close}></i>
				<Factory parent={this} {...this.props} />
			</div>
		);
	},
});

/**
 * Central client-side functionality.
 * Defines routes and components.
 */
var App = Router.extend({

	pageRoot: window.conf && window.conf.pageRoot || '/',

	initialize: function () {
		Router.prototype.initialize.apply(this);
	},

	routes: {
		'login':
			function() {
				Pages.Login(this);
			},
		'signup':
			function() {
				Pages.Login_Register(this);
			},
		'login/recover':
			function() {
				Pages.Login_Recover(this);
			},
		'login/recover/:hash':
			function() {
				Pages.Login_Newpass(this);
			},
		'pedidos/novo':
			function () {
				Pages.NewOrder(this);
			},
		'clientes/novo':
			function () {
				Pages.NewClient(this);
			},
		'parceiros/novo':
			function () {
				Pages.NewPartner(this);
			},
		'clientes':
			function () {
				Pages.ClientsList(this);
			},
		'pedidos':
			function () {
				Pages.OrdersList(this);
			},
		'':
			function () {
				Pages.Home(this);
			},
	},

	components: {
		viewOrder: function (data) {

			if (!data.id) {
				console.warn("No id supplied to viewOrder.", data);
				throw "WTF";
			}

			var model = new Models.Order({id: data.id});
			model.fetch({
				success: (model, response) => {
					this.pushComponent(<BoxWrapper rclass={Views.Order} model={model} />,
						'order', {
							// pageRoot: 'list-orders',
						});
				},
				error: (xhr) => {
					var json = xhr.responseJSON;
					if (json && json.error) {
						Utils.flash.alert(json.message || 'Erro! <i class="icon-sad"></i>');
					} else {
						Utils.flash.alert('Erro ao contactar servidor.');
					}
				},
			});
		},
	},
});

module.exports = {
	initialize: function () {
		window.app = new App;
		Backbone.history.start({ pushState:true, hashChange: false });
	},
};

