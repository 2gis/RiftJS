(function() {

	var deserialize = rt.dump.deserialize;
	var ViewState = rt.ViewState;
	var Router = rt.Router;

	/**
	 * @private
	 */
	function collectViewStateProperties(viewState, routes) {
		var props = Object.assign({}, viewState);

		for (var i = routes.length; i;) {
			var routeProps = routes[--i].properties;

			for (var j = routeProps.length; j;) {
				var id = routeProps[--j].id;

				if (!hasOwn.call(props, id)) {
					props[id] = undef;
				}
			}
		}

		return props;
	}

	/**
	 * @class Rift.BaseApp
	 * @extends {Object}
	 */
	function BaseApp() {}

	BaseApp.extend = rt.Class.extend;

	Object.assign(BaseApp.prototype, /** @lends Rift.BaseApp# */{
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
		 * @param {Function|Object} model
		 * @param {Function} viewClass
		 * @param {?HTMLElement} viewBlock
		 * @param {Object} viewState
		 * @param {?Object} viewStateData
		 * @param {Rift.Router} routes
		 * @param {string} path
		 */
		_init: function(model, viewClass, viewBlock, viewState, viewStateData, routes, path) {
			this.model = typeof model == 'function' ? new model() : deserialize(model);

			var router = this.router = new Router(this, routes);
			var viewState = this.viewState = new ViewState(collectViewStateProperties(viewState, router.routes));

			router.route(path);

			if (isClient) {
				viewState.updateFromSerializedData(viewStateData);
			}

			var view = this.view = new viewClass({ app: this, block: viewBlock });

			router.start();

			if (isClient) {
				view.initClient();
			}
		}
	});

	rt.BaseApp = BaseApp;

})();
