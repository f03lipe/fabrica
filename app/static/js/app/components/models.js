
var Backbone = require('backbone');

var PrintJob = Backbone.Model.extend({

});

var Client = Backbone.Model.extend({
  urlRoot: '/api/clients',
});

var Queue = Backbone.Collection.extend({
  model: PrintJob,
});

var ClientList = Backbone.Collection.extend({
  model: Client,
  url: '/api/clients',
})

module.exports = {
	Queue: Queue,
  PrintJob: PrintJob,
  Client: Client,
  ClientList: ClientList,
}