(function() {
	var assign = rt.object.assign;
	var deserialize = rt.dump.deserialize;
	var ViewState = rt.ViewState;
	var Router = rt.Router;

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
	 */
	var BaseApp = rt.Class.extend({
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

	rt.BaseApp = BaseApp;
})();
