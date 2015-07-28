(function() {
	var nextTick = rt.nextTick;
	var escapeRegExp = rt.regex.escape;
	var serialize = rt.dump.serialize;
	var Disposable = rt.Disposable;

	var KEY_ROUTING_STATE = rt.KEY_ROUTING_STATE = '__rt_routingState__';

	/**
	 * @typesign (str: string): number|string;
	 */
	function tryStringAsNumber(str) {
		if (str != '') {
			if (str == 'NaN') {
				return NaN;
			}

			var num = Number(str);

			if (num == num) {
				return num;
			}
		}

		return str;
	}

	/**
	 * Кодирует путь. Символы те же, что и у encodeURIComponent, кроме слеша `/`.
	 * В отличии от encodeURI и encodeURIComponent не трогает уже закодированное:
	 *     encodeURIComponent(' %20'); // '%20%2520'
	 *     encodePath(' %20'); // '%20%20'
	 *
	 * @example
	 * encodeURIComponent(' %20/%2F'); // '%20%2520%2F%252F'
	 * encodePath(' %20/%2F'); // '%20%20/%2F'
	 *
	 * @typesign (path: string): string;
	 */
	function encodePath(path) {
		path = path.split('/');

		for (var i = path.length; i;) {
			path[--i] = encodeURIComponent(decodeURIComponent(path[i]));
		}

		return path.join('/');
	}

	/**
	 * @typesign (path: string): string;
	 */
	function slashifyPath(path) {
		if (path[0] != '/') {
			path = '/' + path;
		}
		if (path[path.length - 1] != '/') {
			path += '/';
		}

		return path;
	}

	/**
	 * @typedef {{
	 *     name: string,
	 *     rePath: RegExp,
	 *     properties: Array<{ type: int, name: string }>,
	 *     requiredProperties: Array<string>,
	 *     pathMap: Array<{
	 *         requiredProperties: Array<string>,
	 *         pathPart: string,
	 *         property: undefined
	 *     }|{
	 *         requiredProperties: Array<string>,
	 *         pathPart: undefined,
	 *         property: string
	 *     }>,
	 *     callback: (path: string)
	 * }} Router~Route
	 */

	/**
	 * @typesign (viewState: Rift.ViewState, route: Router~Route): string;
	 */
	function buildPath(viewState, route) {
		var pathMap = route.pathMap;
		var path = [];

		for (var i = 0, l = pathMap.length; i < l; i++) {
			var pathItem = pathMap[i];
			var requiredProperties = pathItem.requiredProperties;
			var j = requiredProperties.length;

			while (j--) {
				var value = viewState[requiredProperties[j]]();

				if (value == null || value === false || value === '') {
					break;
				}
			}

			if (j == -1) {
				path.push(pathItem.pathPart !== undefined ? pathItem.pathPart : viewState[pathItem.property]());
			}
		}

		return slashifyPath(path.join(''));
	}

	/**
	 * @typesign (router: Rift.Router, path: string): { route: Router~Route, state: Object }|null;
	 */
	function tryPath(router, path) {
		var routes = router.routes;

		for (var i = 0, l = routes.length; i < l; i++) {
			var route = routes[i];
			var match = path.match(route.rePath);

			if (match) {
				return {
					route: route,

					state: route.properties.reduce(function(state, prop, index) {
						if (prop.type == 1) {
							state[prop.name] = !!match[index + 1];
						} else {
							state[prop.name] = match[index + 1] &&
								tryStringAsNumber(decodeURIComponent(match[index + 1]));
						}

						return state;
					}, {})
				};
			}
		}

		return null;
	}

	/**
	 * @typesign (router: Rift.Router, preferredRoute?: Router~Route): { route: Router~Route, path: string }|null;
	 */
	function tryViewState(router, preferredRoute) {
		var viewState = router.app.viewState;
		var routes = router.routes;
		var resultRoute = null;

		for (var i = 0, l = routes.length; i < l; i++) {
			var route = routes[i];
			var requiredProperties = route.requiredProperties;
			var j = requiredProperties.length;

			while (j--) {
				var value = viewState[requiredProperties[j]]();

				if (value == null || value === false || value === '') {
					break;
				}
			}

			if (j == -1) {
				if (resultRoute) {
					if (resultRoute.requiredProperties.length) {
						if (requiredProperties.length && route === preferredRoute) {
							resultRoute = route;
							break;
						}
					} else {
						if (requiredProperties.length) {
							resultRoute = route;

							if (route === preferredRoute) {
								break;
							}
						} else if (route === preferredRoute) {
							resultRoute = route;
						}
					}
				} else {
					resultRoute = route;
				}
			}
		}

		return resultRoute && {
			route: resultRoute,
			path: buildPath(viewState, resultRoute)
		};
	}

	/**
	 * @typesign (router: Rift.Router, route: Router~Route, path: string, viewStateData: Object, mode: uint = 0);
	 */
	function setState(router, route, path, viewStateData, mode) {
		router.currentRoute = route;
		router.currentRouteName(route.name);

		router.currentPath = path;

		if (isClient) {
			router._isViewStateChangeHandlingRequired = false;

			var historyState;

			if (mode) {
				historyState = {};

				historyState[KEY_ROUTING_STATE] = {
					routeIndex: router.routes.indexOf(route),
					path: path,
					viewStateData: viewStateData
				};

				history[mode == 1 ? 'replaceState' : 'pushState'](historyState, null, path);
			} else {
				historyState = history.state || {};

				historyState[KEY_ROUTING_STATE] = {
					routeIndex: router.routes.indexOf(route),
					path: path,
					viewStateData: viewStateData
				};

				history.replaceState(historyState, null, path);
			}
		}

		if (route.callback) {
			route.callback.call(router.app, path);
		}
	}

	/**
	 * @typesign (router: Rift.Router, preferredRoute?: Router~Route): boolean;
	 */
	function updateFromViewState(router, preferredRoute) {
		var match = tryViewState(router, preferredRoute);

		if (match) {
			var path = match.path;

			if (path !== router.currentPath) {
				setState(router, match.route, path, router.app.viewState.serializeData(), 2);
				return true;
			}
		}

		return false;
	}

	/**
	 * @class Rift.Router
	 * @extends {Object}
	 *
	 * @typesign new (
	 *     app: Rift.BaseApp,
	 *     routes?: Array<{ name?: string, path: string, callback?: (path: string) }|string>
	 * ): Rift.Router;
	 */
	var Router = Disposable.extend({
		/**
		 * Ссылка на приложение.
		 * @type {Rift.App}
		 */
		app: null,

		/**
		 * Ссылка на корневой элемент вьюшки.
		 * @type {?HTMLElement}
		 */
		viewBlock: null,

		/**
		 * @type {Array<Router~Route>}
		 */
		routes: null,

		/**
		 * @type {Object<Router~Route>}
		 */
		routeDict: null,

		/**
		 * @type {boolean}
		 */
		started: false,

		/**
		 * @type {?Router~Route}
		 */
		currentRoute: null,
		/**
		 * @type {string}
		 */
		currentRouteName: cellx(''),

		/**
		 * @type {string|undefined}
		 */
		currentPath: undefined,

		_isViewStateChangeHandlingRequired: false,

		constructor: function(app, routes) {
			Disposable.call(this);

			this.app = app;
			this.routes = [];
			this.routeDict = Object.create(null);

			this.currentRouteName = this.currentRouteName.bind(this);
			this.currentRouteName.constructor = cellx;

			if (routes) {
				this.addRoutes(routes);
			}
		},

		/**
		 * @typesign (routes: Array<{ name?: string, path: string, callback?: (path: string) }|string): Rift.Router;
		 */
		addRoutes: function(routes) {
			routes.forEach(function(route) {
				if (typeof route == 'string') {
					route = { path: route };
				}

				this.addRoute(route.path, route.name, route.callback);
			}, this);

			return this;
		},

		/**
		 * @typesign (path: string, name?: string, cb?: (path: string)): Rift.Router;
		 */
		addRoute: function(path, name, cb) {
			if (this.started) {
				throw new TypeError('Can\'t add route to started router');
			}

			path = path.split(/\((?:\?([^\s)]+)\s+)?([^)]+)\)/g);

			var reInsert = /\{([^}]+)\}/g;

			var pathPart;
			var encodedPathPart;

			var prop;

			var rePath = [];
			var props = [];
			var requiredProperties = [];
			var pathMap = [];

			for (var i = 0, l = path.length; i < l;) {
				if (i % 3) {
					rePath.push('(');

					var pathItemRequiredProperties = [];

					if (path[i]) {
						pathItemRequiredProperties.push(path[i]);

						props.push({
							type: 1,
							name: path[i]
						});
					}

					pathPart = path[i + 1].split(reInsert);

					for (var j = 0, m = pathPart.length; j < m; j++) {
						if (j % 2) {
							prop = pathPart[j];

							pathItemRequiredProperties.push(prop);

							rePath.push('([^\\/]+)');

							props.push({
								type: 2,
								name: prop
							});

							pathMap.push({
								requiredProperties: pathItemRequiredProperties,
								pathPart: undefined,
								property: prop
							});
						} else {
							if (pathPart[j]) {
								encodedPathPart = encodePath(pathPart[j]);

								rePath.push(escapeRegExp(encodedPathPart).split('\\*').join('.*?'));

								pathMap.push({
									requiredProperties: pathItemRequiredProperties,
									pathPart: encodedPathPart.split('*').join(''),
									property: undefined
								});
							}
						}
					}

					rePath.push(')?');

					i += 2;
				} else {
					if (path[i]) {
						pathPart = path[i].split(reInsert);

						for (var k = 0, n = pathPart.length; k < n; k++) {
							if (k % 2) {
								prop = pathPart[k];

								rePath.push('([^\\/]+)');

								props.push({
									type: 0,
									name: prop
								});

								requiredProperties.push(prop);

								pathMap.push({
									requiredProperties: [prop],
									pathPart: undefined,
									property: prop
								});
							} else {
								if (pathPart[k]) {
									encodedPathPart = encodePath(pathPart[k]);

									rePath.push(escapeRegExp(encodedPathPart).split('\\*').join('.*?'));

									pathMap.push({
										requiredProperties: [],
										pathPart: encodedPathPart.split('*').join(''),
										property: undefined
									});
								}
							}
						}
					}

					i++;
				}
			}

			var route = {
				name: name,
				rePath: RegExp('^\\/?' + rePath.join('') + '\\/?$'),
				properties: props,
				requiredProperties: requiredProperties,
				pathMap: pathMap,
				callback: cb
			};

			this.routes.push(route);

			if (name) {
				if (name in this.routeDict) {
					throw new TypeError('Route "' + name + '" is already exist');
				}

				this.routeDict[name] = route;
			}

			return this;
		},

		/**
		 * @typesign (): Rift.Router;
		 */
		start: function() {
			if (this.started) {
				return this;
			}

			this.started = true;

			if (isClient) {
				this.viewBlock = this.app.view.block[0];
			}

			this._bindEvents();

			if (isServer) {
				var match = tryViewState(this, this.currentPath == '/' ? null : this.currentRoute);

				if (match) {
					setState(this, match.route, match.path, this.app.viewState.serializeData());
				}
			}

			return this;
		},

		_bindEvents: function() {
			if (isClient) {
				this.listenTo(window, 'popstate', this._onWindowPopState);
				this.listenTo(this.viewBlock, 'click', this._onViewBlockClick);

				var viewState = this.app.viewState;
				var onViewStatePropertyChange = this._onViewStatePropertyChange;
				var propertyList = viewState.propertyList;

				for (var i = propertyList.length; i;) {
					this.listenTo(viewState[propertyList[--i]]('unwrap', 0), 'change', onViewStatePropertyChange);
				}
			}
		},

		_onWindowPopState: function() {
			var historyState = history.state && history.state[KEY_ROUTING_STATE];

			if (historyState) {
				var route = this.routes[historyState.routeIndex];
				var path = historyState.path;

				this.currentRoute = route;
				this.currentRouteName(route.name);

				this.currentPath = path;

				this.app.viewState.updateFromSerializedData(historyState.viewStateData);

				if (route.callback) {
					route.callback.call(this.app, path);
				}
			} else {
				this.app.viewState.update({});

				var match = tryViewState(this);

				if (match) {
					setState(this, match.route, match.path, serialize({}), 0);
				} else {
					this.currentRoute = null;
					this.currentRouteName('');

					this.currentPath = undefined;
				}
			}
		},

		/**
		 * Обработчик клика по корневому элементу вьюшки.
		 * @typesign (evt: MouseEvent);
		 */
		_onViewBlockClick: function(evt) {
			var viewBlock = this.viewBlock;
			var el = evt.target;

			while (el.tagName != 'A') {
				if (el == viewBlock) {
					return;
				}

				el = el.parentNode;

				if (!el) {
					return;
				}
			}

			var href = el.getAttribute('href');

			if (href.indexOf('#') != -1) {
				return;
			}

			if (!/^(?:\w+:)?\/\//.test(href) && this.route(href)) {
				evt.preventDefault();
			}
		},

		/**
		 * @typesign ();
		 */
		_onViewStatePropertyChange: function() {
			if (this._isViewStateChangeHandlingRequired) {
				return;
			}

			this._isViewStateChangeHandlingRequired = true;

			nextTick(this.registerCallback(this._onViewStateChange));
		},

		/**
		 * Обработчик изменения состояния представления.
		 * @typesign ();
		 */
		_onViewStateChange: function() {
			if (!this._isViewStateChangeHandlingRequired) {
				return;
			}

			this._isViewStateChangeHandlingRequired = false;

			var historyState = history.state || {};

			if (!historyState[KEY_ROUTING_STATE]) {
				historyState[KEY_ROUTING_STATE] = {
					routeIndex: this.routes.indexOf(this.currentRoute),
					path: this.currentPath
				};
			}

			historyState[KEY_ROUTING_STATE].viewStateData = this.app.viewState.serializeData();

			history.replaceState(historyState, null, this.currentPath);
		},

		/**
		 * Редиректит по указанному пути.
		 * Если нет подходящего маршрута - возвращает false, редиректа не происходит.
		 *
		 * @typesign (path: string, newHistoryStep: boolean = true): boolean;
		 */
		route: function(path, newHistoryStep) {
			path = encodePath(path.replace(/[\/\\]+/g, '/'));

			if (path[0] != '/') {
				var locationPath = location.pathname;
				path = locationPath + (locationPath[locationPath.length - 1] == '/' ? '' : '/') + path;
			}

			if (path[path.length - 1] != '/') {
				path += '/';
			}

			if (path === this.currentPath) {
				return true;
			}

			var match = tryPath(this, path);

			if (!match) {
				return false;
			}

			this.app.viewState.update(match.state);
			setState(this, match.route, path, this.app.viewState.serializeData(), newHistoryStep !== false ? 2 : 1);

			return true;
		},

		/**
		 * @typesign (preferredRoute: string): boolean;
		 */
		update: function(preferredRoute) {
			return updateFromViewState(this, preferredRoute ? this.routeDict[preferredRoute] : this.currentRoute);
		}
	});

	rt.Router = Router;
})();
