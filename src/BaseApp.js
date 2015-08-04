var env = require('./env');
var object = require('./object');
var Class = require('./Class');
var dump = require('./dump');
var ViewState = require('./ViewState');
var Router = require('./Router');

var isServer = env.isServer;
var isClient = env.isClient;
var assign = object.assign;
var deserialize = dump.deserialize;

var hasOwn = Object.prototype.hasOwnProperty;

function collectViewStateProperties(viewState, routes) {
	var props = assign({}, viewState);

	for (var i = routes.length; i;) {
		var routeProps = routes[--i].properties;

		for (var j = routeProps.length; j;) {
			var name = routeProps[--j].name;

			if (!hasOwn.call(props, name)) {
				props[name] = undefined;
			}
		}
	}

	return props;
}

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
	 * @type {Rift.ViewState}
	 */
	viewState: null,

	/**
	 * @type {Rift.Router}
	 */
	router: null,

	/**
	 * @typesign (params: {
	 *     modelClass: Function,
	 *     viewClass: Function,
	 *     viewStateFields: Object,
	 *     routes: Array<{ name?: string, path: string, callback?: (path: string) }|string>,
	 *     path: string
	 * });
	 *
	 * @typesign (params: {
	 *     modelDataDump: Object,
	 *     viewClass: Function,
	 *     viewBlock: HTMLElement,
	 *     viewStateFields: Object,
	 *     viewStateDataDump: Object,
	 *     routes: Array<{ name?: string, path: string, callback?: (path: string) }|string>,
	 *     path: string
	 * });
	 */
	_init: function(params) {
		this.model = isServer ? new params.modelClass() : deserialize(params.modelDataDump);

		var router = this.router = new Router(this, params.routes);
		var viewState = this.viewState =
			new ViewState(collectViewStateProperties(params.viewStateFields, router.routes));

		router.route(params.path, false);

		var view;

		if (isClient) {
			var viewStateData = deserialize(params.viewStateDataDump);

			for (var name in viewStateData) {
				viewState[name](viewStateData[name]);
			}

			view = new params.viewClass({
				app: this,
				block: params.viewBlock
			});
		} else {
			view = new params.viewClass({
				app: this,
				block: null
			});
		}

		this.view = view;

		router.start();

		if (isClient) {
			view.initClient();
		}
	},

	dispose: function() {
		this.router.dispose();
		this.view.dispose();
		this.viewState.dispose();
		this.model.dispose();
	}
});

module.exports = BaseApp;
