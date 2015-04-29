(function() {

	var escapeRegExp = rt.regex.escape;
	var nextTick = rt.process.nextTick;

	var reNotLocal = /^(?:\w+:)?\/\//;
	var reSlashes = /[\/\\]+/g;
	var reInsert = /\{([^}]+)\}/g;
	var reOption = /\((?:\?(\S+)\s+)?([^)]+)\)/g;

	/**
	 * @private
	 *
	 * @param {string} str
	 * @returns {number|string}
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
	 * @private
	 *
	 * @param {string} path
	 * @returns {string}
	 */
	function encodePath(path) {
		path = path.split('/');

		for (var i = path.length; i;) {
			path[--i] = encodeURIComponent(decodeURIComponent(path[i]));
		}

		return path.join('/');
	}

	/**
	 * @private
	 *
	 * @param {string} path
	 * @returns {string}
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
	 *     rePath: RegExp,
	 *     properties: { type: int, id: string },
	 *     requiredProperties: Array<string>,
	 *     pathMap: { requiredProperties: Array<string>, pathPart: string=, prop: string= },
	 *     callback: Function
	 * }} Router~Route
	 */

	/**
	 * @private
	 *
	 * @param {Rift#Router} router
	 * @param {string} path
	 * @returns {?{ route: Router~Route, state: Object }}
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
						state[prop.id] = prop.type == 1 ?
							Boolean(match[index + 1]) :
							tryStringAsNumber(decodeURIComponent(match[index + 1]));

						return state;
					}, {})
				};
			}
		}

		return null;
	}

	/**
	 * @private
	 *
	 * @param {Rift#Router} router
	 * @param {Router~Route} [preferredRoute]
	 * @returns {?{ route: Router~Route, path: string }}
	 */
	function tryViewState(router, preferredRoute) {
		var viewState = router.app.viewState;
		var routes = router.routes;
		var resultRoute = null;

		for (var i = 0, l = routes.length; i < l; i++) {
			var route = routes[i];
			var requiredProps = route.requiredProperties;
			var j = requiredProps.length;

			while (j--) {
				var value = viewState[requiredProps[j]]();

				if (value == null || value === false || value === '') {
					break;
				}
			}

			if (j == -1) {
				if (requiredProps.length) {
					resultRoute = route;
					break;
				} else if (!resultRoute || route === preferredRoute) {
					resultRoute = route;
				}
			}
		}

		return resultRoute && {
			route: resultRoute,
			path: buildPath(router, resultRoute)
		};
	}

	/**
	 * @private
	 *
	 * @param {Rift#Router} router
	 * @param {Router~Route} route
	 * @returns {string}
	 */
	function buildPath(router, route) {
		var viewState = router.app.viewState;
		var pathMap = route.pathMap;
		var path = [];

		for (var i = 0, l = pathMap.length; i < l; i++) {
			var pathMapItem = pathMap[i];
			var requiredProps = pathMapItem.requiredProperties;
			var j = requiredProps.length;

			while (j--) {
				var value = viewState[requiredProps[j]]();

				if (value == null || value === false || value === '') {
					break;
				}
			}

			if (j == -1) {
				path.push(
					hasOwn.call(pathMapItem, 'pathPart') ? pathMapItem.pathPart : viewState[pathMapItem.prop]()
				);
			}
		}

		return slashifyPath(path.join(''));
	}

	/**
	 * @private
	 *
	 * @param {Rift#Router} router
	 * @param {Router~Route} route
	 * @param {string} path
	 * @param {Object} viewStateData
	 * @param {int} [mode=0]
	 */
	function setState(router, route, path, viewStateData, mode) {
		router.currentRoute = route;
		router.currentPath = path;

		if (isClient) {
			if (mode) {
				history[mode == 1 ? 'replaceState' : 'pushState']({
					'_rt-state': {
						routeIndex: router.routes.indexOf(route),
						path: path,
						viewStateData: viewStateData
					}
				}, null, path);
			} else {
				var state = history.state || {};

				state['_rt-state'] = {
					routeIndex: router.routes.indexOf(route),
					path: path,
					viewStateData: viewStateData
				};

				history.replaceState(state, null, path);
			}
		}

		if (route.callback) {
			route.callback.call(router.app, path);
		}
	}

	/**
	 * @class Rift.Router
	 * @extends {Object}
	 *
	 * @param {Rift.BaseApp} app
	 * @param {Array<{ path: string, callback: Function= }|string>} [routes]
	 */
	function Router(app, routes) {
		this._onViewStateChange = this._onViewStateChange.bind(this);

		this.app = app;

		this.routes = [];

		if (routes) {
			this.addRoutes(routes);
		}
	}

	Object.assign(Router.prototype, /** @lends Rift.Router# */{
		/**
		 * Ссылка на приложение.
		 *
		 * @type {Rift.App}
		 */
		app: null,

		/**
		 * Ссылка на корневой элемент вьюшки.
		 *
		 * @type {?HTMLElement}
		 */
		viewBlock: null,

		/**
		 * @type {Array<Router~Route>}
		 * @protected
		 */
		routes: null,

		/**
		 * @type {?Router~Route}
		 */
		currentRoute: null,

		/**
		 * @type {string|undefined}
		 */
		currentPath: undef,

		/**
		 * @type {boolean}
		 */
		started: false,

		_isViewStateChangeHandlingRequired: false,

		/**
		 * @param {Array<{ path: string, callback: Function }|string>} routes
		 * @returns {Rift.Router}
		 */
		addRoutes: function(routes) {
			routes.forEach(function(route) {
				if (typeof route == 'string') {
					route = { path: route };
				}

				this.addRoute(route.path, route.callback);
			}, this);

			return this;
		},

		/**
		 * @param {string} path
		 * @param {Function|undefined} [callback]
		 * @returns {Rift.Router}
		 */
		addRoute: function(path, callback) {
			if (this.started) {
				throw new TypeError('Router is already started');
			}

			path = path.split(reOption);

			var rePath = [];
			var props = [];
			var requiredProps = [];
			var pathMap = [];

			for (var i = 0, l = path.length; i < l;) {
				if (i % 3) {
					rePath.push('(');

					var pathMapItemRequiredProps = [];

					if (path[i]) {
						pathMapItemRequiredProps.push(path[i]);

						props.push({
							type: 1,
							id: path[i]
						});
					}

					var pathPart = path[i + 1].split(reInsert);

					for (var j = 0, m = pathPart.length; j < m; j++) {
						if (j % 2) {
							var id = pathPart[j];

							pathMapItemRequiredProps.push(id);

							rePath.push('([^\\/]+)');

							props.push({
								type: 2,
								id: id
							});

							pathMap.push({
								requiredProperties: pathMapItemRequiredProps,
								prop: id
							});
						} else {
							if (pathPart[j]) {
								var encodedPathPart = encodePath(pathPart[j]);

								rePath.push(escapeRegExp(encodedPathPart).split('\\*').join('.*?'));

								pathMap.push({
									requiredProperties: pathMapItemRequiredProps,
									pathPart: encodedPathPart.split('*').join('')
								});
							}
						}
					}

					rePath.push(')?');

					i += 2;
				} else {
					if (path[i]) {
						var pathPart = path[i].split(reInsert);

						for (var j = 0, m = pathPart.length; j < m; j++) {
							if (j % 2) {
								var id = pathPart[j];

								rePath.push('([^\\/]+)');

								props.push({
									type: 0,
									id: id
								});

								requiredProps.push(id);

								pathMap.push({
									requiredProperties: [id],
									prop: id
								});
							} else {
								if (pathPart[j]) {
									var encodedPathPart = encodePath(pathPart[j]);

									rePath.push(escapeRegExp(encodedPathPart).split('\\*').join('.*?'));

									pathMap.push({
										requiredProperties: [],
										pathPart: encodedPathPart.split('*').join('')
									});
								}
							}
						}
					}

					i++;
				}
			}

			this.routes.push({
				rePath: RegExp('^\\/?' + rePath.join('') + '\\/?$'),
				properties: props,
				requiredProperties: requiredProps,
				pathMap: pathMap,
				callback: callback
			});

			return this;
		},

		/**
		 * @returns {Rift.Router}
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

		/**
		 * @protected
		 */
		_bindEvents: function() {
			if (isClient) {
				window.addEventListener('popstate', this._onWindowPopState.bind(this), false);
				this.viewBlock.addEventListener('click', this._onViewBlockClick.bind(this), false);
			}

			var viewState = this.app.viewState;
			var onViewStatePropertyChange = this._onViewStatePropertyChange;
			var props = viewState.properties;

			for (var i = props.length; i;) {
				viewState[props[--i]]('subscribe', onViewStatePropertyChange, this);
			}
		},

		/**
		 * @protected
		 */
		_onWindowPopState: function() {
			var state = history.state && history.state['_rt-state'];

			if (state) {
				var route = this.currentRoute = this.routes[state.routeIndex];
				var path = this.currentPath = state.path;

				this.app.viewState.updateFromSerializedData(state.viewStateData);

				if (route.callback) {
					route.callback.call(this.app, path);
				}
			} else {
				this.app.viewState.update({});

				var match = tryViewState(this);

				if (match) {
					setState(this, match.route, match.path, {}, 1);
				} else {
					this.currentRoute = null;
					this.currentPath = undef;
				}
			}
		},

		/**
		 * Обработчик клика по корневому элементу вьюшки.
		 *
		 * @protected
		 *
		 * @param {MouseEvent} evt
		 */
		_onViewBlockClick: function(evt) {
			var viewBlock = this.viewBlock;
			var el = evt.target;

			while (el.tagName != 'A') {
				if (el == viewBlock) {
					return;
				}

				el = el.parentNode;
			}

			var href = el.getAttribute('href');

			if (!reNotLocal.test(href) && this.route(href, true)) {
				evt.preventDefault();
			}
		},

		/**
		 * @protected
		 */
		_onViewStatePropertyChange: function() {
			if (this._isViewStateChangeHandlingRequired) {
				return;
			}

			this._isViewStateChangeHandlingRequired = true;

			nextTick(this._onViewStateChange);
		},

		/**
		 * Обработчик изменения состояния представления.
		 *
		 * @protected
		 */
		_onViewStateChange: function() {
			if (!this._isViewStateChangeHandlingRequired) {
				return;
			}

			this._isViewStateChangeHandlingRequired = false;

			var match = tryViewState(this, this.currentRoute);

			if (!match) {
				return;
			}

			var path = match.path;

			if (path === this.currentPath) {
				if (isClient) {
					var state = history.state || {};

					if (!state['_rt-state']) {
						state['_rt-state'] = {
							routeIndex: this.routes.indexOf(this.currentRoute),
							path: path
						};
					}

					state['_rt-state'].viewStateData = this.app.viewState.serializeData();

					history.replaceState(state, null, path);
				}
			} else {
				setState(this, match.route, path, this.app.viewState.serializeData(), 2);
			}
		},

		/**
		 * Редиректит по указанному пути.
		 * Если нет подходящего маршрута - возвращает false, редиректа не происходит.
		 *
		 * @param {string} path
		 * @param {boolean} [pushHistory=false]
		 * @returns {boolean}
		 */
		route: function(path, pushHistory) {
			path = encodePath(path.replace(reSlashes, '/'));

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
			setState(this, match.route, path, this.app.viewState.serializeData(), pushHistory ? 2 : 1);

			return true;
		}
	});

	rt.Router = Router;

})();
