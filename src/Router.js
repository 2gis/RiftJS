var cellx = require('cellx');
var env = require('./env');
var regex = require('./regex');
var Disposable = require('./Disposable');

var Map = cellx.Map;
var isServer = env.isServer;
var isClient = env.isClient;
var escapeRegExp = regex.escape;

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
 *     pathModel: Array<{ requiredProperties: Array<string>, value?: string, property?: string }>,
 *     requiredProperties: Array<string>,
 *     properties: Array<{ type: int, name: string }>,
 *     rePath: RegExp,
 *     callback: (path: string)
 * }} Rift.Router~Node
 */

/**
 * @typesign (node: Rift.Router~Node, state: Object): string;
 */
function buildPath(node, state) {
	var path = [];

	node.pathModel.forEach(function(pathPart) {
		var value;

		var requiredProperties = pathPart.requiredProperties;
		var i = requiredProperties.length;

		while (i--) {
			value = state[requiredProperties[i]];

			if (typeof value == 'function') {
				value = value.call(state);
			}

			if (value == null || value === false || value === '') {
				break;
			}
		}

		if (i == -1) {
			if (pathPart.value !== undefined) {
				path.push(pathPart.value);
			} else {
				value = state[pathPart.property];

				if (typeof value == 'function') {
					value = value.call(state);
				}

				path.push(value);
			}
		}
	});

	return slashifyPath(path.join(''));
}

/**
 * @typesign (
 *     state: Object,
 *     nodes: Array<Rift.Router~Node>,
 *     preferredNode?: Rift.Router~Node
 * ): { node: Rift.Router~Node, path: string }|null;
 */
function tryState(state, nodes, preferredNode) {
	var resultNode = null;

	for (var iterator = nodes.values(), step; !(step = iterator.next()).done;) {
		var node = step.value;
		var requiredProperties = node.requiredProperties;
		var j = requiredProperties.length;

		while (j--) {
			var value = state[requiredProperties[j]];

			if (typeof value == 'function') {
				value = value.call(state);
			}

			if (value == null || value === false || value === '') {
				break;
			}
		}

		if (j == -1) {
			if (resultNode) {
				if (resultNode.requiredProperties.length) {
					if (requiredProperties.length && node === preferredNode) {
						resultNode = node;
						break;
					}
				} else {
					if (requiredProperties.length) {
						resultNode = node;

						if (node === preferredNode) {
							break;
						}
					} else {
						if (node === preferredNode) {
							resultNode = node;
						}
					}
				}
			} else {
				resultNode = node;
			}
		}
	}

	return resultNode && {
		node: resultNode,
		path: buildPath(resultNode, state)
	};
}

/**
 * @typesign (path: string, nodes: Array<Rift.Router~Node>): { node: Rift.Router~Node, state: Object }|null;
 */
function tryPath(path, nodes) {
	for (var iterator = nodes.values(), step; !(step = iterator.next()).done;) {
		var node = step.value;
		var match = path.match(node.rePath);

		if (match) {
			return {
				node: node,

				state: node.properties.reduce(function(state, prop, index) {
					state[prop.name] = prop.type == 1 ?
						!!match[index + 1] :
						match[index + 1] && tryStringAsNumber(decodeURIComponent(match[index + 1]));

					return state;
				}, {})
			};
		}
	}

	return null;
}

/**
 * @class Rift.Router
 * @extends {Rift.Disposable}
 *
 * @typesign new (
 *     app: Rift.BaseApp,
 *     nodes?: Array<{ name?: string, path: string, callback?: (path: string) }>
 * ): Rift.Router;
 */
var Router = Disposable.extend({
	/**
	 * @type {Rift.BaseApp}
	 */
	app: null,

	/**
	 * @type {?HTMLElement}
	 */
	viewBlock: null,

	/**
	 * @type {cellx.Map<Rift.Router~Node>}
	 */
	nodes: null,

	started: false,

	/**
	 * @type {?Rift.Router~Node}
	 */
	currentNode: null,
	/**
	 * @type {string}
	 */
	currentNodeName: cellx(''),

	/**
	 * @type {string|undefined}
	 */
	currentPath: undefined,

	constructor: function(app, nodes) {
		Disposable.call(this);

		this.app = app;
		this.nodes = new Map();

		if (nodes) {
			nodes.forEach(function(node) {
				this.addNode(node);
			}, this);
		}

		this.currentNodeName = this.currentNodeName.bind(this);
		this.currentNodeName.constructor = cellx;
	},

	/**
	 * @typesign (node: { name?: string, path: string, callback?: (path: string) }): Rift.Router;
	 */
	addNode: function(node) {
		if (this.started) {
			throw new TypeError('Can\'t add node to started router');
		}

		var name = node.name;

		if (this.nodes.has(name)) {
			throw new TypeError('Node "' + name + '" is already exist');
		}

		var path = node.path;
		var cb = node.callback;

		var reInsert = /\{([^}]+)\}/g;

		var pathPart;
		var encodedPathPart;

		var prop;

		var pathModel = [];
		var requiredProperties = [];
		var props = [];
		var rePath = [];

		path = path.split(/\((?:\?([^\s)]+)\s+)?([^)]+)\)/g);

		for (var i = 0, l = path.length; i < l;) {
			if (i % 3) {
				rePath.push('(' + (path[i] ? '' : '?:'));

				var pathPartRequiredProperties = [];

				if (path[i]) {
					props.push({
						type: 1,
						name: path[i]
					});

					pathPartRequiredProperties.push(path[i]);
				}

				pathPart = path[i + 1].split(reInsert);

				for (var j = 0, m = pathPart.length; j < m; j++) {
					if (j % 2) {
						prop = pathPart[j];

						pathModel.push({
							requiredProperties: pathPartRequiredProperties,
							value: undefined,
							property: prop
						});

						props.push({
							type: 2,
							name: prop
						});

						rePath.push('([^\\/]+)');

						pathPartRequiredProperties.push(prop);
					} else {
						if (pathPart[j]) {
							encodedPathPart = encodePath(pathPart[j]);

							pathModel.push({
								requiredProperties: pathPartRequiredProperties,
								value: encodedPathPart.split('*').join(''),
								property: undefined
							});

							rePath.push(escapeRegExp(encodedPathPart).split('\\*').join('.*?'));
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

							pathModel.push({
								requiredProperties: [prop],
								value: undefined,
								property: prop
							});

							requiredProperties.push(prop);

							props.push({
								type: 0,
								name: prop
							});

							rePath.push('([^\\/]+)');
						} else {
							if (pathPart[k]) {
								encodedPathPart = encodePath(pathPart[k]);

								pathModel.push({
									requiredProperties: [],
									value: encodedPathPart.split('*').join(''),
									property: undefined
								});

								rePath.push(escapeRegExp(encodedPathPart).split('\\*').join('.*?'));
							}
						}
					}
				}

				i++;
			}
		}

		this.nodes.set(name, {
			name: name,

			// Для составления пути.
			pathModel: pathModel,

			// Для проверки соответствия стейта данному узлу.
			requiredProperties: requiredProperties,

			// Для вытаскивания данных из совпадения по регулярке,
			// индексы будут на 1 меньше соответствующих индексов в совпадении.
			properties: props,

			rePath: RegExp('^\\/?' + rePath.join('') + '\\/?$'),

			callback: cb
		});

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
			var match = tryState(this.app.model, this.nodes, this.currentPath == '/' ? null : this.currentNode);

			if (match) {
				var node = match.node;

				this.currentNode = node;
				this.currentNodeName(node.name);

				this.currentPath = match.path;

				if (node.callback) {
					node.callback.call(this.app, match.path);
				}
			}
		}

		return this;
	},

	_bindEvents: function() {
		if (isClient) {
			this.listenTo(window, 'popstate', this._onWindowPopState);
			this.listenTo(this.viewBlock, 'click', this._onViewBlockClick);
		}
	},

	_onWindowPopState: function() {
		this.route(location.pathname, false);
	},

	/**
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

		if (!/^(?:\w+:)?\/\//.test(href) && href.indexOf('#') == -1 && this.route(href)) {
			evt.preventDefault();
		}
	},

	/**
	 * Редиректит по указанному пути.
	 * Если нет подходящего маршрута - возвращает false, редиректа не происходит.
	 *
	 * @typesign (path: string, newHistoryStep: boolean = true): boolean;
	 */
	route: function(path, newHistoryStep) {
		var model = this.app.model;
		var match;

		if (this.nodes.has(path)) {
			match = tryState(model, this.nodes, this.nodes.get(path));

			if (!match) {
				return false;
			}

			path = match.path;

			if (path === this.currentPath) {
				return true;
			}
		} else {
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

			match = tryPath(path, this.nodes);

			if (!match) {
				return false;
			}

			var state = match.state;

			for (var name in state) {
				if (typeof model[name] == 'function') {
					model[name](state[name]);
				} else {
					model[name] = state[name];
				}
			}
		}

		var node = match.node;

		this.currentNode = node;
		this.currentNodeName(node.name);

		this.currentPath = path;

		if (isClient) {
			if (newHistoryStep !== false) {
				history.pushState({}, null, path);
			} else {
				history.replaceState(history.state, null, path);
			}
		}

		if (node.callback) {
			node.callback.call(this.app, path);
		}

		return true;
	}
});

module.exports = Router;
