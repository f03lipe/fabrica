
"use strict"

var React = require('react')
var selectize = require('selectize')

var Modal = require('../components/modal.jsx')
var Models = require('../components/models.js')
var PrettyCheck = require('../components/PrettyCheck.jsx')
var OrderView = require('../components/OrderView.jsx')

require('react.backbone')

window.formatOrderDate = function (date) {
	date = new Date(date);
	return ''+date.getDate()+' de '+['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio',
	'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro',
	'Dezembro'][date.getMonth()]+', '+date.getFullYear()+' '+(date.getHours()>12?
		''+(date.getHours()-12)+':'+date.getMinutes()+'pm':
		''+(date.getHours())+':'+date.getMinutes()+'am');
};

var OrderItem = React.createBackboneClass({
	getInitialState: function() {
		return {
			expanded: false,
		}
	},

	render: function() {
		var doc = this.getModel().attributes;

		var goto = () => {
			// app.navigate(i.path, { trigger: true });
			this.props.toggle();
		}

		var GenStatusIcon = () => {
			if (doc.status === "shipping") {
	      return (
	      	<div className="statusIcon shipping" title="Pronto">
	      		<i className="icon-send" />
	      	</div>
	      );
			} else if (doc.status === "requested") {
	      return (
	      	<div className="statusIcon requested" title="Esperando">
	      		<i className="icon-timer" />
	      	</div>
	      );
			} else if (doc.status === "processing") {
	      return (
	      	<div className="statusIcon processing" title="Processando">
	      		<i className="icon-details" />
	      	</div>
	      );
			} else if (doc.status === "cancelled") {
	      return (
	      	<div className="statusIcon cancelled" title="Cancelado">
	      		<i className="icon-close" />
	      	</div>
	      );
			} else if (doc.status === "late") {
	      return (
	      	<div className="statusIcon late" title="Atrasado">
	      		<i className="icon-timer" />
	      	</div>
	      );
			} else {
	      return (
	      	<div className="statusIcon done" title="Enviado">
	      		<i className="icon-done-all" />
	      	</div>
	      );
			}
		};

		return (
			<li className="order" onClick={goto}>
				<div className="left">
					<div className="selection">
						<PrettyCheck ref="check" model={this.getModel()} />
					</div>
					{GenStatusIcon()}
				</div>
				<div className="main">
					<div className="name">
						{doc.name}
						<div className="code" title="Código da peça.">
							({doc.code})
						</div>
					</div>
					<div className="type">
						Impressão 3D · {doc._cor[0].toUpperCase()+doc._cor.slice(1)}/{doc._tipo}
					</div>
					<div className="client">
						<strong>Cliente:</strong> <a href="#">Mauro Iezzi</a>, pela <a href="#">Gráfica do Catete</a>
					</div>
				</div>
				<div className="right">
					<div className="date">
						<span data-time-count={1*new Date(doc.created_at)} data-long="true" data-title={formatOrderDate(doc.created_at)}>
							{calcTimeFrom(doc.created_at)}
						</span>
					</div>
					<div className="buttons">
						<button>
							Editar
						</button>
					</div>
				</div>
			</li>
		);
	},
});

var Toolbar = React.createBackboneClass({

	getInitialState: function() {
		return {
			pendingSave: false,
		}
	},

  componentDidMount: function() {
    this.getCollection().on('selectChange', () => {
      this.forceUpdate(function () {});
    });
  },

	render: function() {
		var numSelected = this.getCollection().getNumSelected();
		var buttons = [];
		if (numSelected) {
			buttons.push((
				<li>
					<button>Excluir {numSelected} pedido{numSelected>1?"s":''}</button>
				</li>
			));

			var makeStatusSetter = (status) => {
				return (e) => {
					e.preventDefault();
					var selected = this.getCollection().getSelected();
					for (var i=0; i<selected.length; ++i) {
						var model = selected[i];
						model.set('status', status);
					}
					this.setState({ pendingSave: true });
				};
			};

			buttons.push((
				<li>
					<div className="btn-group">
						<button type="button" className="dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
							Mudar estado <span className="caret"></span>
						</button>
						<ul className="dropdown-menu" role="menu">
							<li className="requested">
								<a href="#" onClick={makeStatusSetter("waiting")}>Esperando</a>
							</li>
							<li className="processing">
								<a href="#" onClick={makeStatusSetter("processing")}>Processando</a>
							</li>
							<li className="cancelled">
								<a href="#" onClick={makeStatusSetter("cancelled")}>Cancelado</a>
							</li>
							<li className="late">
								<a href="#" onClick={makeStatusSetter("late")}>Atrasado</a>
							</li>
							<li className="shipping">
								<a href="#" onClick={makeStatusSetter("shipping")}>Pronto</a>
							</li>
							<li className="done">
								<a href="#" onClick={makeStatusSetter("done")}>Enviado</a>
							</li>
						</ul>
					</div>
				</li>
			));
		}

		if (this.state.pendingSave) {
			var save = () => {
				var collection = this.getCollection();
				// FIXME:
				// This is far from ideal. We shouldn't have to sync the whole
				// collection when only a known part of is updated.
				collection.sync("update", collection, {
					url: '/api/orders',
					success: () => {
						this.setState({ pendingSave: false });
					},
					error: (xhr, options) => {
						var data = xhr.responseJSON;
						if (data && data.message) {
							Utils.flash.alert(data.message);
						} else {
							Utils.flash.alert('Um erro inesperado aconteceu.');
						}
					}
				})
			};
			buttons.push((
				<li>
					<button className="save" onClick={save}>Save</button>
				</li>
			));
		}

		return (
			<div className="listToolbar">
				<ul>
					<li className="selection">
						<PrettyCheck model={this.getCollection()} />
					</li>
					{buttons}
				</ul>
				<ul className="right">
					<li>
					</li>
				</ul>
			</div>
		);
	},
});

var ListOrders = React.createBackboneClass({

	getInitialState: function () {
		return {
			expanded: null,
		}
	},


	render: function() {
		var GenerateOrderList = () => {
			var collection = this.getCollection();
			var rows = [];
			var i = 0;
			window.c = collection;
			while (i < collection.length) {
				!((i) => { // create context for 'i'
					var toggle = () => {
						return;
						if (this.state.expanded === i) {
							this.setState({ expanded: null });
						} else {
							this.setState({ expanded: i });
						}
					};

					// Hack: add expanded item as table row with a single colum
					rows.push((
						<OrderItem model={collection.at(i)} toggle={toggle} />
					));
					if (this.state.expanded === i) {
						rows.push((
							<li className="order expanded">
								<td colSpan="100">
									<OrderView model={collection.at(i)} />
								</td>
							</li>
						))
					}
				})(i);
				++i;
			}
			return rows;
		};

		return (
			<div className="ListOrders">
				<div className="pageHeader">
					<div className="left">
						<h1>
							Pedidos
						</h1>
					</div>
					<div className="right">
						<a className="button newOrder" href="/pedidos/novo">
							Novo Pedido
						</a>
					</div>
				</div>
				<Toolbar parent={this} collection={this.getCollection()}/>
				<div className="orderList">
					{GenerateOrderList()}
				</div>
			</div>
		);
	}
});

module.exports = function(app) {
	var collection = new Models.OrderList();

	collection.fetch();
	window.c = collection;

	app.pushPage(<ListOrders collection={collection} />, 'list-orders', {
		onClose: function() {
		},
		container: document.querySelector('#page-container'),
		pageRoot: 'list-orders',
	});
};
