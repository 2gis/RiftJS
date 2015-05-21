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
	 */
	var BaseApp = rt.Class.extend(/** @lends Rift.BaseApp# */{
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
		 * @protected
		 *
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

			this.viewState = new ViewState(collectViewStateProperties(viewState, router.routes));

			router.route(path);

			if (isClient) {
				this.viewState.updateFromSerializedData(viewStateData);
			}

			var view = this.view = new viewClass({ app: this, block: viewBlock });

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

	rt.BaseApp = BaseApp;

})();
