(function() {
	var assign = rt.object.assign;
	var extend = rt.Class.extend;
	var bindCells = rt.bindCells;
	var Disposable = rt.Disposable;
	var bindDOM = rt.domBinding.bind;
	var unbindDOM = rt.domBinding.unbind;

	var selfClosingTags = assign(Object.create(null), {
		area: 1,
		base: 1,
		basefont: 1,
		br: 1,
		col: 1,
		command: 1,
		embed: 1,
		frame: 1,
		hr: 1,
		img: 1,
		input: 1,
		isindex: 1,
		keygen: 1,
		link: 1,
		meta: 1,
		param: 1,
		source: 1,
		track: 1,
		wbr: 1,

		// svg tags
		circle: 1,
		ellipse: 1,
		line: 1,
		path: 1,
		polygone: 1,
		polyline: 1,
		rect: 1,
		stop: 1,
		use: 1
	});

	function emptyFn() {}

	/**
	 * @type {Object<Function>}
	 */
	var viewClasses = rt.viewClasses = Object.create(null);

	/**
	 * @typesign (name: string): Function;
	 */
	function getViewClass(name) {
		if (!(name in viewClasses)) {
			throw new TypeError('ViewClass "' + name + '" is not defined');
		}

		return viewClasses[name];
	}

	rt.getViewClass = getViewClass;

	/**
	 * @typesign (name: string, viewClass: Function): Function;
	 */
	function registerViewClass(name, viewClass) {
		if (name in viewClasses) {
			throw new TypeError('ViewClass "' + name + '" is already registered');
		}

		Object.defineProperty(viewClass, '$viewClassName', {
			value: name
		});

		viewClasses[name] = viewClass;

		return viewClass;
	}

	rt.registerViewClass = registerViewClass;

	/**
	 * @typesign (str: string): string;
	 */
	function toCamelCase(str) {
		return str.replace(/[^$0-9a-zA-Z]([$0-9a-zA-Z])/g, function(match, firstWordChar) {
			return firstWordChar.toUpperCase();
		});
	}

	/**
	 * @typesign (cls: Array<string>, mods: Object): Array<string>;
	 */
	function pushMods(cls, mods) {
		for (var name in mods) {
			var value = mods[name];

			if (value != null && value !== false) {
				cls.push('_' + name + (value === true ? '' : '_' + value));
			}
		}

		return cls;
	}

	/**
	 * @typesign (el: HTMLElement, attrs: Object);
	 */
	function setAttributes(el, attrs) {
		for (var name in attrs) {
			el.setAttribute(name, attrs[name]);
		}
	}

	/**
	 * @typesign (view: Rift.BaseView, blockName: string, name: string): boolean;
	 */
	function initDescendantElements(view, blockName, name) {
		var children = view.children;
		var result = false;

		for (var i = children.length; i;) {
			var child = children[--i];

			if (child.blockName == blockName) {
				child.$(name);
				result = true;
			} else {
				if (initDescendantElements(child, blockName, name)) {
					result = true;
				}
			}
		}

		return result;
	}

	/**
	 * @typesign (view: Rift.BaseView, el: HTMLElement);
	 */
	function removeElement(view, el) {
		if (!el.hasOwnProperty(KEY_VIEW_ELEMENT_NAME) || !el[KEY_VIEW_ELEMENT_NAME] || el[KEY_VIEW] != view) {
			return;
		}

		if (el.parentNode) {
			el.parentNode.removeChild(el);
		}

		unbindDOM(el);

		var els = view.elements[el[KEY_VIEW_ELEMENT_NAME]];
		els.splice(els.indexOf(el), 1);

		el[KEY_VIEW] = null;
		el[KEY_VIEW_ELEMENT_NAME] = undefined;
	}

	/**
	 * @typesign (view: Rift.BaseView);
	 */
	function afterDataReceiving(view) {
		if (view._afterDataReceiving != emptyFn) {
			try {
				view._afterDataReceiving();
			} catch (err) {
				view._logError(err);
			}
		}
	}

	/**
	 * @typesign (view: Rift.BaseView, cb: ());
	 */
	function receiveData(view, cb) {
		if (view._receiveData == emptyFn) {
			cb.call(view);
		} else {
			if (view._beforeDataReceiving != emptyFn) {
				try {
					view._beforeDataReceiving();
				} catch (err) {
					view._logError(err);
				}
			}

			try {
				if (view._receiveData.length) {
					view._receiveData(function(err) {
						if (view.disposed) {
							return;
						}

						if (err != null) {
							view.dataReceivingError = err;
							view._logError(err);
						}

						afterDataReceiving(view);
						cb.call(view);
					});
				} else {
					view._receiveData()
						.catch(function(err) {
							if (!view.disposed) {
								view.dataReceivingError = err;
								view._logError(err);
							}
						})
						.then(function() {
							if (!view.disposed) {
								afterDataReceiving(view);
								cb.call(view);
							}
						});
				}
			} catch (err) {
				view.dataReceivingError = err;
				view._logError(err);
				afterDataReceiving(view);
				cb.call(view);
			}
		}
	}

	/**
	 * @typesign (view: Rift.BaseView, dom: HTMLElement);
	 */
	function linkToDOM(view, dom) {
		var blocks = reduce.call(dom.querySelectorAll('[rt-id]'), function(blocks, block) {
			blocks[block.getAttribute('rt-id')] = block;
			return blocks;
		}, {});

		(function _(view) {
			var children = view.children;

			for (var i = children.length; i;) {
				var child = children[--i];
				var childBlock = blocks[child._id];

				childBlock[KEY_VIEW] = child;
				child.block = $(childBlock);

				_(child);
			}

			view.isDOMReady = true;
			view.emit({ type: 'domready', bubbles: false });
		})(view);
	}

	/**
	 * @class Rift.BaseView
	 * @extends {Rift.Disposable}
	 * @abstract
	 *
	 * @typesign new (params?: {
	 *     tagName?: string,
	 *     blockName?: string,
	 *     mods?: Object<boolean|number|string>,
	 *     attrs?: Object<string>,
	 *     name?: string,
	 *     owner?: Rift.BaseView,
	 *     app?: Rift.BaseApp,
	 *     model?: Rift.BaseModel|Rift.ActiveMap|Rift.ActiveList|Rift.Cell|Rift.cellx,
	 *     parent?: Rift.BaseView,
	 *     block?: HTMLElement|$
	 * }): Rift.BaseView;
	 */
	var BaseView = Disposable.extend({
		static: {
			/**
			 * @typesign (name: string, declaration: { static?: Object, constructor?: Function }): Function;
			 */
			extend: function(name, declaration) {
				return registerViewClass(name, extend.call(this, undefined, declaration));
			}
		},

		tagName: 'div',

		/**
		 * @type {string}
		 */
		blockName: undefined,

		/**
		 * @type {Object}
		 */
		mods: null,

		/**
		 * @type {Object<string>}
		 */
		attrs: null,

		_idCounter: 0,

		_id: undefined,

		/**
		 * @type {string|undefined}
		 */
		name: undefined,

		/**
		 * @type {?Rift.BaseView}
		 */
		owner: null,

		/**
		 * @type {?Rift.BaseApp}
		 */
		app: null,

		/**
		 * @type {?(Rift.BaseModel|Rift.ActiveMap|Rift.ActiveList|Rift.Cell|Rift.cellx)}
		 */
		model: null,

		_parent: null,

		/**
		 * Родительская вьюшка.
		 * @type {?Rift.BaseView}
		 * @writable
		 */
		get parent() {
			return this._parent;
		},
		set parent(parent) {
			if (parent) {
				parent.registerChild(this);
			} else if (this._parent) {
				this._parent.unregisterChild(this);
			}
		},

		/**
		 * Дочерние вьюшки.
		 * @type {Array<Rift.BaseView>}
		 */
		children: null,

		/**
		 * Корневой элемент вьюшки.
		 * @type {?$}
		 */
		block: null,

		/**
		 * Элементы вьюшки.
		 * @type {Object<$>}
		 */
		elements: null,

		isDOMReady: false,

		/**
		 * @typesign (cb: ());
		 * @typesign (): Promise;
		 */
		_receiveData: emptyFn,

		/**
		 * @typesign ();
		 */
		_beforeDataReceiving: emptyFn,
		/**
		 * @typesign ();
		 */
		_afterDataReceiving: emptyFn,

		dataReceivingError: null,

		_currentlyRendering: false,
		_childRenderings: null,

		/**
		 * @typesign ();
		 */
		_beforeRendering: emptyFn,

		/**
		 * @typesign (): string;
		 */
		template: function() {
			return '';
		},

		isClientInited: false,

		/**
		 * @typesign ();
		 */
		_initClient: emptyFn,

		constructor: function(params) {
			Disposable.call(this);

			if (!params) {
				params = {};
			}

			if (this._initAssets) {
				this._initAssets(params);
				bindCells(this);
			}

			if (params.tagName) {
				this.tagName = params.tagName;
			}

			if (params.blockName) {
				this.blockName = params.blockName;
			} else if (!this.blockName) {
				var proto = Object.getPrototypeOf(this);

				while (Object.getPrototypeOf(proto).constructor != BaseView) {
					proto = Object.getPrototypeOf(proto);
				}

				proto.blockName = toCamelCase(proto.constructor.$viewClassName);
			}

			this.mods = Object.create(this.mods);

			if (params.mods) {
				assign(this.mods, params.mods);
			}

			this.attrs = Object.create(this.attrs);

			if (params.attrs) {
				assign(this.attrs, params.attrs);
			}

			if (params.name) {
				this.name = params.name;
			}

			if (params.owner) {
				this.owner = params.owner;
			}

			if (params.parent) {
				this.parent = params.parent;
			}

			var parent = this._parent;

			this._id = this._nextID();

			var app;

			if (params.app) {
				app = this.app = params.app;
			} else {
				if (parent && parent.app) {
					app = this.app = parent.app;
				}
			}

			if (params.model) {
				this.model = params.model;
			} else {
				if (parent && parent.model) {
					this.model = parent.model;
				} else if (app) {
					this.model = app.model;
				}
			}

			this.children = [];

			var block = isServer ? null : params.block;

			if (block !== null) {
				if (block) {
					if (block instanceof $) {
						block = block[0];
					}

					if (block.hasOwnProperty(KEY_VIEW) && block[KEY_VIEW]) {
						throw new TypeError(
							'Element is already used as ' + (
								block.hasOwnProperty(KEY_VIEW_ELEMENT_NAME) && block[KEY_VIEW_ELEMENT_NAME] ?
									'an element' : 'a block'
							) + ' of view'
						);
					}
				} else {
					block = document.createElement(this.tagName);
				}

				block[KEY_VIEW] = this;
				this.block = $(block);
			}

			this.elements = {};

			if (block) {
				if (block.hasAttribute('rt-id')) {
					this.render(function() {
						linkToDOM(this, block);
					});
				} else {
					setAttributes(block, this.attrs);
					block.className = (pushMods([this.blockName], this.mods).join(' ') + ' ' + block.className).trim();

					this._currentlyRendering = true;

					receiveData(this, function() {
						this._renderInner(function(html) {
							this._currentlyRendering = false;
							block.innerHTML = html;
							linkToDOM(this, block);
						});
					});
				}
			}
		},

		/**
		 * @typesign (): string;
		 */
		_nextID: function() {
			if (this._parent) {
				return this._parent._nextID();
			}

			return String(++this._idCounter);
		},

		/**
		 * @typesign (cb: (html: string));
		 */
		render: function(cb) {
			if (this._currentlyRendering) {
				throw new TypeError('Can\'t run rendering when it is in process');
			}

			if (this._beforeRendering != emptyFn) {
				try {
					this._beforeRendering();
				} catch (err) {
					this._logError(err);
				}
			}

			this._currentlyRendering = true;

			receiveData(this, function() {
				if (this.tagName in selfClosingTags) {
					this._currentlyRendering = false;
					cb.call(this, this._renderOpenTag());
				} else {
					this._renderInner(function(html) {
						this._currentlyRendering = false;
						cb.call(this, this._renderOpenTag() + html + '</' + this.tagName + '>');
					});
				}
			});
		},

		/**
		 * @typesign (): string;
		 */
		_renderOpenTag: function() {
			var attrs = this.attrs;
			var attributes = [
				'class="' + (pushMods([this.blockName], this.mods).join(' ') + ' ' + (attrs.class || '')).trim() + '"'
			];

			for (var name in attrs) {
				if (name != 'class') {
					attributes.push(name + '="' + attrs[name] + '"');
				}
			}

			return '<' + this.tagName + ' ' + attributes.join(' ') + ' rt-id="' + this._id + '">';
		},

		/**
		 * @typesign (cb: (html: string));
		 */
		_renderInner: function(cb) {
			var childRenderings = this._childRenderings = {
				count: 0,
				readyCount: 0,

				childTraces: [],
				results: [],

				onallready: null
			};
			var html;

			try {
				html = this.template.call(this.owner || this);
			} catch (err) {
				this._childRenderings = null;
				this._logError(err);
				cb.call(this, '');
				return;
			}

			var _this = this;

			childRenderings.onallready = function() {
				_this._childRenderings = null;

				var childTraces = childRenderings.childTraces;
				var results = childRenderings.results;

				for (var i = childTraces.length; i;) {
					html = html.replace(childTraces[--i], function() {
						return results[i];
					});
				}

				cb.call(_this, html);
			};

			if (childRenderings.count == childRenderings.readyCount) {
				childRenderings.onallready();
			}
		},

		/**
		 * @typesign (cb?: ()): Rift.BaseView;
		 */
		initClient: function(cb) {
			function initClient() {
				if (!this.isClientInited) {
					this.isClientInited = true;

					var children = this.children.slice();

					for (var i = 0, l = children.length; i < l; i++) {
						children[i].initClient();
					}

					try {
						if (this._initClient != emptyFn) {
							this._initClient();
						}

						bindDOM(this.block[0], this.owner || this);
					} catch (err) {
						this._logError(err);
					}
				}

				if (cb) {
					cb.call(this);
				}
			}

			if (this.isDOMReady) {
				initClient.call(this);
			} else {
				this.once('domready', initClient);
			}

			return this;
		},

		/**
		 * Регистрирует дочернюю вьюшку.
		 * @typesign (child: Rift.BaseView): Rift.BaseView;
		 */
		registerChild: function(child) {
			if (child._parent) {
				if (child._parent == this) {
					return this;
				}

				throw new TypeError('View is already used as a child of view');
			}

			child._parent = this;

			var children = this.children;
			var childName = child.name;

			children.push(child);

			if (childName) {
				(hasOwn.call(children, childName) ? children[childName] : (children[childName] = [])).push(child);
			}

			return this;
		},

		/**
		 * Отменяет регистрацию дочерней вьюшки.
		 * @typesign (child: Rift.BaseView): Rift.BaseView;
		 */
		unregisterChild: function(child) {
			if (child._parent !== this) {
				return this;
			}

			child._parent = null;

			var children = this.children;
			var childName = child.name;

			children.splice(children.indexOf(child), 1);

			if (childName) {
				var namedChildren = children[childName];
				namedChildren.splice(namedChildren.indexOf(child), 1);
			}

			return this;
		},

		/**
		 * @typesign (children: string, method: string, ...args?: Array): Array;
		 */
		broadcast: function(children, method) {
			var cl;
			var name;

			if (/^(.+?):(.+)$/.test(children)) {
				cl = RegExp.$1;
				name = RegExp.$2;
			} else {
				cl = children;
				name = '*';
			}

			cl = getViewClass(cl);

			var descendants = [];

			(function _(children) {
				for (var i = 0, l = children.length; i < l; i++) {
					var child = children[i];

					if ((cl === '*' || child instanceof cl) && (name == '*' || child.name === name)) {
						descendants.push(child);
					}

					_(child.children);
				}
			})(this.children);

			var args = slice.call(arguments, 2);

			return descendants.map(function(descendant) {
				if (!descendant.disposed && typeof descendant[method] == 'function') {
					return descendant[method].apply(descendant, args);
				}
			});
		},

		/**
		 * Создаёт и регистрирует элемент(ы) и/или возвращает именованную $-коллекцию.
		 *
		 * @example
		 * this.$('btnSend'); // получение элемента(ов) по имени
		 *
		 * @example
		 * // создаёт новый элемент `<li class="Module_item _selected">Hi!</li>`,
		 * // добавляет его в коллекцию `item` и возвращает коллекцию с новым элементом
		 * this.$('item', '<li class="_selected">Hi!</li>');
		 *
		 * @typesign (
		 *     name: string,
		 *     ...els?: Array<HTMLElement|string|{ tagName: string, mods: Object, attrs: Object<string>, html: string }>
		 * ): $;
		 */
		$: function(name) {
			var els;

			if (hasOwn.call(this.elements, name)) {
				els = this.elements[name];
			} else {
				els = this.block.find('.' + this.blockName + '_' + name);

				if (initDescendantElements(this, this.blockName, name)) {
					els = els.filter(function() {
						return !this.hasOwnProperty(KEY_VIEW) || !this[KEY_VIEW];
					});
				}

				var _this = this;

				els.each(function() {
					this[KEY_VIEW] = _this;
					this[KEY_VIEW_ELEMENT_NAME] = name;
				});

				this.elements[name] = els;
			}

			var argCount = arguments.length;

			if (argCount > 1) {
				var i = 1;

				do {
					var el = arguments[i];
					var isString = typeof el == 'string';

					if (isString || el instanceof HTMLElement) {
						if (isString) {
							var container = document.createElement('div');
							container.innerHTML = el;

							el = container.childNodes.length == 1 && container.firstChild.nodeType == 1 ?
								container.firstChild :
								container;
						} else {
							if (el.hasOwnProperty(KEY_VIEW) && el[KEY_VIEW]) {
								if (!el.hasOwnProperty(KEY_VIEW_ELEMENT_NAME) || !el[KEY_VIEW_ELEMENT_NAME]) {
									throw new TypeError('Element is already used as a block of view');
								}
								if (el[KEY_VIEW] != this || el[KEY_VIEW_ELEMENT_NAME] != name) {
									throw new TypeError('Element is already used as an element of view');
								}

								continue;
							}
						}

						el.className = (this.blockName + '_' + name + ' ' + el.className).trim();
					} else {
						var params = el;

						el = document.createElement(params.tagName || 'div');

						if (params.attrs) {
							setAttributes(el, params.attrs);
						}

						var cls = [this.blockName + '_' + name];

						if (params.mods) {
							pushMods(cls, params.mods);
						}

						el.className = (cls.join(' ') + ' ' + el.className).trim();

						if (params.html) {
							el.innerHTML = params.html;
						}
					}

					el[KEY_VIEW] = this;
					el[KEY_VIEW_ELEMENT_NAME] = name;

					els.push(el);

					bindDOM(el, this.owner || this);
				} while (++i < argCount);
			}

			return els;
		},

		/**
		 * @typesign (...els: $|HTMLElement|string): Rift.BaseView;
		 */
		$rm: function() {
			for (var i = arguments.length; i;) {
				var el = arguments[--i];

				if (typeof el == 'string') {
					if (!hasOwn.call(this.elements, el)) {
						continue;
					}

					el = this.elements[el];
				}

				if (el instanceof $) {
					var _this = this;

					el.each(function() {
						removeElement(_this, this);
					});
				} else {
					removeElement(this, el);
				}
			}

			return this;
		},

		/**
		 * @override Rift.Disposable#_listenTo
		 */
		_listenTo: function(target, evt, listener, context) {
			var type;

			if (target instanceof BaseView) {
				var inner;

				if (/^(.+?):(.+)$/.test(evt)) {
					var cl = RegExp.$1;
					type = RegExp.$2;

					if (cl != '*') {
						cl = getViewClass(cl);
						inner = listener;

						listener = function(evt) {
							if (evt.target instanceof cl) {
								return inner.call(this, evt);
							}
						};
					}
				} else {
					type = evt;
					inner = listener;

					var _this = this;

					listener = function(evt) {
						if (evt.target == _this) {
							return inner.call(this, evt);
						}
					};
				}
			} else {
				type = evt;
			}

			return Disposable.prototype._listenTo.call(this, target, type, listener, context);
		},

		/**
		 * @typesign ();
		 */
		dispose: function() {
			var block = this.block && this.block[0];

			if (block) {
				if (block.parentNode) {
					block.parentNode.removeChild(block);
				}

				unbindDOM(block);
			}

			var children = this.children;

			for (var i = children.length; i;) {
				children[--i].dispose();
			}

			this.parent = null;

			if (block) {
				block[KEY_VIEW] = null;
			}

			Disposable.prototype.dispose.call(this);
		}
	});

	rt.BaseView = BaseView;
})();
