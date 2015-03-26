(function() {

	var deserialize = _.dump.deserialize;
	var ViewState = _.ViewState;
	var Router = _.Router;

	/**
	 * @private
	 */
	function collectViewStateFields(viewState, routes) {
		var fields = Object.assign({}, viewState);

		for (var i = routes.length; i;) {
			var routeFields = routes[--i].fields;

			for (var j = routeFields.length; j;) {
				var id = routeFields[--j].id;

				if (!hasOwn.call(fields, id)) {
					fields[id] = undef;
				}
			}
		}

		return fields;
	}

	/**
	 * @class Rift.BaseApp
	 * @extends {Object}
	 */
	function BaseApp() {}

	BaseApp.extend = _.Class.extend;

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
		 * @param {string|undefined} [path='/']
		 */
		_init: function(model, viewClass, viewBlock, viewState, viewStateData, routes, path) {
			this.model = typeof model == 'function' ? new model() : deserialize(model);

			var router = this.router = new Router(this, routes);

			this.viewState = new ViewState(collectViewStateFields(viewState, router.routes));

			if (isServer) {
				router.route(path || '/');
			} else {
				this.viewState.updateFromSerializedData(viewStateData);
			}

			this.view = new viewClass({ app: this, block: viewBlock });
			router.start();
		}
	});

	_.BaseApp = BaseApp;

})();
