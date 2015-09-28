var env = require('./env');
var Class = require('./Class');
var Router = require('./Router');

var isClient = env.isClient;

/**
 * @class Rift.BaseApp
 * @extends {Object}
 * @abstract
 */
var BaseApp = Class.extend({
	/**
	 * @type {Rift.BaseModel}
	 */
	model: null,

	/**
	 * @type {Rift.BaseView}
	 */
	view: null,

	/**
	 * @type {Rift.Router}
	 */
	router: null,

	/**
	 * @type {Object}
	 */
	request: null,

	/**
	 * @typesign (params: {
	 *     modelClass: Function,
	 *     viewClass: Function,
	 *     nodes: Array<{ name?: string, path: string, callback?: (path: string) }>,
	 *     request: string,
	 *     path: string
	 * });
	 *
	 * @typesign (params: {
	 *     modelClass: Function,
	 *     viewClass: Function,
	 *     viewBlock: HTMLElement,
	 *     nodes: Array<{ name?: string, path: string, callback?: (path: string) }>,
	 *     path: string
	 * });
	 */
	_init: function(params) {
		this.model = new params.modelClass();

		var router = this.router = new Router(this, params.nodes);

		router.route(params.path, false);

		var view = this.view = new params.viewClass({
			app: this,
			block: params.viewBlock || null
		});

		router.start();

		if (params.request) {
			this.request = params.request;
		}

		if (isClient) {
			view.initClient();
		}
	},

	dispose: function() {
		this.router.dispose();
		this.view.dispose();
		this.model.dispose();
	}
});

module.exports = BaseApp;
