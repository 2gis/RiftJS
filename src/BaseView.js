(function() {

	var getUID = rt.object.getUID;
	var execNamespace = rt.namespace.exec;
	var getHash = rt.value.getHash;
	var toString = rt.value.toString;
	var classes = rt.Class.classes;
	var getClassOrError = rt.Class.getOrError;
	var Cleanable = rt.Cleanable;
	var escapeHTML = rt.html.escape;
	var bindDOM = rt.domBinding.bind;

	var selfClosingTags = Object.assign(Object.create(null), {
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

	var reNameClass = /^(.+?):(.+)$/;
	var reViewData = /([^,]*),([^,]*),(.*)/;
	var keyView = '_rt-view';
	var keyViewElementName = '_rt-viewElementName';

	function emptyFn() {}

	/**
	 * @private
	 *
	 * @param {Rift.BaseView} view
	 * @param {Function} cb
	 */
	function receiveData(view, cb) {
		if (view._receiveData != emptyFn) {
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
							view.dataReceivingError = err;
							view._logError(err);
						})
						.then(function() {
							afterDataReceiving(view);
							cb.call(view);
						});
				}
			} catch (err) {
				view.dataReceivingError = err;
				view._logError(err);
				afterDataReceiving(view);
				cb.call(view);
			}
		} else {
			cb.call(view);
		}
	}

	/**
	 * @private
	 *
	 * @param {Rift.BaseView} view
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
	 * @private
	 *
	 * @param {Array<string>} cls
	 * @param {Object} mods
	 * @returns {Array<string>}
	 */
	function pushMods(cls, mods) {
		for (var name in mods) {
			var value = mods[name];

			if (value != null && value !== false) {
				cls.push('__' + name + (value === true ? '' : '_' + value));
			}
		}

		return cls;
	}

	/**
	 * @private
	 *
	 * @param {HTMLElement} el
	 * @param {Object} attrs
	 */
	function setAttributes(el, attrs) {
		for (var name in attrs) {
			el.setAttribute(name, attrs[name]);
		}
	}

	/**
	 * @private
	 *
	 * @param {Rift.BaseView} view
	 * @param {string} blockName
	 * @param {string} name
	 * @returns {boolean}
	 */
	function initSimilarDescendantElements(view, blockName, name) {
		var children = view.children;
		var result = false;

		for (var i = children.length; i;) {
			var child = children[--i];

			if (child.blockName == blockName) {
				child.$(name);
				result = true;
			} else {
				if (initSimilarDescendantElements(child, blockName, name)) {
					result = true;
				}
			}
		}

		return result;
	}

	/**
	 * @private
	 *
	 * @param {Rift.BaseView} view
	 * @param {HTMLElement} el
	 */
	function removeElement(view, el) {
		if (!hasOwn.call(el, keyViewElementName) || !el[keyViewElementName] || el[keyView] != view) {
			return;
		}

		var els = view.elements[el[keyViewElementName]];
		els.splice(els.indexOf(el), 1);

		el[keyView] = null;
		el[keyViewElementName] = undef;

		if (el.parentNode) {
			el.parentNode.removeChild(el);
		}
	}

	/**
	 * @class Rift.BaseView
	 * @extends {Rift.Cleanable}
	 *
	 * @param {Object} [params]
	 * @param {Rift.BaseApp} [params.app]
	 * @param {Rift.BaseModel|Rift.ActiveDictionary|Rift.ActiveArray|Rift.ActiveProperty|string} [params.model]
	 * @param {string} [params.name]
	 * @param {string} [params.tagName]
	 * @param {Object<boolean|number|string>} [params.mods]
	 * @param {Object<string>} [params.attrs]
	 * @param {Rift.BaseView} [params.parent]
	 * @param {?(HTMLElement|$)} [params.block]
	 * @param {boolean} [params.onlyClient=false] - Рендерить только на клиенте.
	 */
	var BaseView = Cleanable.extend(/** @lends Rift.BaseView# */{
		_params: null,

		_id: undef,

		/**
		 * @type {?Rift.BaseApp}
		 */
		app: null,

		/**
		 * @type {?(Rift.BaseModel|Rift.ActiveDictionary|Rift.ActiveArray|Rift.ActiveProperty)}
		 */
		model: null,

		/**
		 * @type {string|undefined}
		 */
		name: undef,

		/**
		 * @type {string}
		 */
		tagName: 'div',

		/**
		 * @type {string}
		 */
		blockName: undef,

		/**
		 * @type {Object}
		 */
		mods: null,

		/**
		 * @type {Object<string>}
		 */
		attrs: null,

		_parent: null,

		/**
		 * Родительская вьюшка.
		 *
		 * @type {?Rift.BaseView}
		 * @writable
		 */
		get parent() {
			return this._parent;
		},
		set parent(parent) {
			if (parent) {
				parent.regChild(this);
			} else if (this._parent) {
				this._parent.unregChild(this);
			}
		},

		/**
		 * Дочерние вьюшки.
		 *
		 * @type {Array<Rift.BaseView>}
		 */
		children: null,

		/**
		 * Корневой элемент вьюшки.
		 *
		 * @type {?$}
		 */
		block: null,

		/**
		 * Элементы вьюшки.
		 *
		 * @type {Object<$>}
		 */
		elements: null,

		/**
		 * @type {*}
		 */
		dataReceivingError: null,

		_currentlyRendering: false,
		_childRenderings: null,

		/**
		 * @type {Function}
		 */
		template: function() {
			return '';
		},

		/**
		 * @type {boolean}
		 */
		onlyClient: false,

		isClientInited: false,

		constructor: function(params) {
			Cleanable.call(this);

			if (!params) {
				params = {};
			}

			this._params = params;

			this.mods = Object.create(this.mods);
			this.attrs = Object.create(this.attrs);

			this.children = [];
			this.elements = {};

			if (!this.blockName) {
				var viewClass = this.constructor;

				while (viewClass.$super.constructor != BaseView) {
					viewClass = viewClass.$super.constructor;
				}

				viewClass.prototype.blockName = viewClass.__class;
			}

			var block;

			if (isServer) {
				if (params.block) {
					throw new TypeError('Parameter "block" can\'t be used on the server side');
				}

				block = null;

				if (params.block === null) {
					delete params.block;
				}
			} else {
				if (params.block !== undef) {
					block = params.block;
					delete params.block;
				}
			}

			if (block === null) {
				this._id = getUID(this, isServer ? 's' : 'c');
				this._parseParams();
			} else {
				var data;
				var rendered = false;

				if (block) {
					if (block instanceof $) {
						block = block[0];
					}

					if (hasOwn.call(block, keyView) && block[keyView]) {
						throw new TypeError(
							'Element is already used as ' + (
								hasOwn.call(block, keyViewElementName) && block[keyViewElementName] ?
									'an element' : 'a block'
							) + ' of view'
						);
					}

					if (block.hasAttribute('rt-d')) {
						data = block.getAttribute('rt-d').match(reViewData);

						if (data[2]) {
							rendered = true;
						}

						if (data[3]) {
							Object.assign(params, Function('return {' + data[3] + '};')());
						}
					}
				}

				this._id = rendered ? data[2] : getUID(this, 'c');
				this._parseParams();

				if (!block) {
					block = document.createElement(this.tagName);
				}

				this.block = $(block);
				block[keyView] = this;

				if (rendered) {
					var view = this;

					this.block
						.find('[rt-p=' + this._id + ']')
						.each(function() {
							new classes[this.getAttribute('rt-d').match(reViewData)[1]]({
								parent: view,
								block: this
							});
						});
				} else {
					setAttributes(block, this.attrs);
					block.className = (pushMods([this.blockName], this.mods).join(' ') + ' ' + block.className).trim();

					this._currentlyRendering = true;

					receiveData(this, function() {
						this._renderInner(function(html) {
							this._currentlyRendering = true;

							block.innerHTML = html;

							var blocks = block.querySelectorAll('[rt-p]');
							var blockDict = {};

							for (var i = blocks.length; i;) {
								blockDict[blocks[--i].getAttribute('rt-d').match(reViewData)[2]] = blocks[i];
							}

							(function _(view) {
								var children = view.children;

								for (var i = children.length; i;) {
									var child = children[--i];
									var childBlock = blockDict[child._id];

									child.block = $(childBlock);
									childBlock[keyView] = child;

									_(child);
								}
							})(this);
						});
					});
				}
			}
		},

		/**
		 * @protected
		 */
		_parseParams: function() {
			var params = this._params;

			if (params.name) {
				this.name = params.name;
			}

			if (params.tagName) {
				this.tagName = params.tagName;
				delete params.tagName;
			}

			if (params.blockName) {
				this.blockName = params.blockName;
			}

			if (params.mods) {
				Object.assign(this.mods, params.mods);
				delete params.mods;
			}

			if (params.attrs) {
				Object.assign(this.attrs, params.attrs);
				delete params.attrs;
			}

			if (params.parent) {
				this.parent = params.parent;
				delete params.parent;
			}

			if (params.app) {
				this.app = params.app;
				delete params.app;

				this.model = this.app.model;
			}

			var model = params.model;

			if (model) {
				if (typeof model == 'string') {
					this.model = execNamespace(model, this._parent || this);
				} else {
					this.model = model;
					delete params.model;
				}
			} else {
				var parent = this._parent;

				if (parent && parent.model) {
					this.model = parent.model;
				}
			}

			if (params.onlyClient !== undef) {
				this.onlyClient = params.onlyClient;
			}
		},

		/**
		 * @param {Function} cb
		 */
		render: function(cb) {
			if (this._currentlyRendering) {
				throw new TypeError('Cannot run the rendering when it is in process');
			}

			if (isServer && this.onlyClient) {
				cb(this._renderOpenTag(true) + (this.tagName in selfClosingTags ? '' : '</' + this.tagName + '>'));
				return;
			}

			this._currentlyRendering = true;

			receiveData(this, function() {
				if (this.tagName in selfClosingTags) {
					this._currentlyRendering = false;
					cb(this._renderOpenTag(false));
				} else {
					this._renderInner(function(html) {
						this._currentlyRendering = false;
						cb(this._renderOpenTag(false) + html + '</' + this.tagName + '>');
					});
				}
			});
		},

		/**
		 * @protected
		 *
		 * @param {boolean} billet
		 * @returns {string}
		 */
		_renderOpenTag: function(billet) {
			var attribs;

			if (billet) {
				attribs = '';
			} else {
				var attrs = this.attrs;

				attribs = [
					'class="' +
						(pushMods([this.blockName], this.mods).join(' ') + ' ' + (attrs.class || '')).trim() + '"'
				];

				for (var name in attrs) {
					if (name != 'class') {
						attribs.push(name + '="' + attrs[name] + '"');
					}
				}
			}

			return '<' + this.tagName +
				' ' + attribs.join(' ') +
				' rt-d="' + [
					this.constructor.__class,
					billet ? '' : this._id,
					isEmpty(this._params) ? '' : escapeHTML(toString(this._params).slice(1, -1))
				] + '"' +
				(this._parent ? ' rt-p="' + this._parent._id + '"' : '') +
				'>';
		},

		/**
		 * @param {Function} cb
		 */
		_renderInner: function(cb) {
			var childRenderings = this._childRenderings = {
				count: 0,
				readyCount: 0,

				marks: [],
				results: [],

				onallready: null
			};
			var html;

			try {
				html = this.template.call(this);
			} catch (err) {
				this._childRenderings = null;
				this._logError(err);
				cb.call(this, '');
				return;
			}

			var view = this;

			childRenderings.onallready = function() {
				view._childRenderings = null;

				var marks = childRenderings.marks;
				var results = childRenderings.results;

				for (var i = marks.length; i;) {
					html = html.replace(marks[--i], function() {
						return results[i];
					});
				}

				cb.call(view, html);
			};

			if (childRenderings.count == childRenderings.readyCount) {
				childRenderings.onallready();
			}
		},

		/**
		 * @protected
		 *
		 * @param {Function} [cb]
		 * @returns {Promise|undefined}
		 */
		_receiveData: emptyFn,

		/**
		 * @protected
		 */
		_beforeDataReceiving: emptyFn,

		/**
		 * @protected
		 */
		_afterDataReceiving: emptyFn,

		/**
		 * //
		 */
		initClient: function() {
			if (this.isClientInited) {
				throw new TypeError('Client is already initialized');
			}

			this.isClientInited = true;

			var children = this.children.slice(0);

			for (var i = 0, l = children.length; i < l; i++) {
				children[i].initClient();
			}

			try {
				var dcs = bindDOM(this.block[0], this, { removeAttr: true });

				if (this._dataCells) {
					Object.assign(this._dataCells, dcs);
				} else {
					this._dataCells = dcs;
				}

				if (this._initClient != emptyFn) {
					this._initClient();
				}
				if (this._bindEvents != emptyFn) {
					this._bindEvents();
				}
			} catch (err) {
				this._logError(err);
			}
		},

		/**
		 * @protected
		 */
		_initClient: emptyFn,

		/**
		 * @protected
		 */
		_bindEvents: emptyFn,

		/**
		 * Регистрирует дочернюю вьюшку.
		 *
		 * @param {Rift.BaseView} child
		 * @returns {Rift.BaseView}
		 */
		regChild: function(child) {
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
		 *
		 * @param {Rift.BaseView} child
		 * @returns {Rift.BaseView}
		 */
		unregChild: function(child) {
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
		 * Создаёт и регистрирует элемент(ы) и/или возвращает именованную $-коллекцию.
		 *
		 * @example
		 * this.$('btnSend'); // получение элемента(ов) по имени
		 *
		 * @example
		 * // создаёт новый элемент `<li class="Module_element __selected">Hi!</li>`,
		 * // добавляет его в коллекцию `element` и возвращает коллекцию с новым элементом
		 * this.$('item', '<li class="__selected">Hi!</li>');
		 *
		 * @example
		 * // то же, что и в предыдущем примере, но описание элемента в виде объекта
		 * this.$('item', { tagName: 'li', mods: { selected: true }, html: 'Hi!' });
		 *
		 * @param {string} name
		 * @param {...(HTMLElement|string|{ tagName: string, mods: Object, attrs: Object<string>, html: string })} [el]
		 * @returns {$}
		 */
		$: function(name) {
			var els;

			if (hasOwn.call(this.elements, name)) {
				els = this.elements[name];
			} else {
				els = $('.' + this.blockName + '_' + name, this.block);

				if (initSimilarDescendantElements(this, this.blockName, name)) {
					els = els.filter(function() {
						return !hasOwn.call(this, keyView) || !this[keyView];
					});
				}

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
							var outer = document.createElement('div');
							outer.innerHTML = el;

							el = outer.childNodes.length == 1 && outer.firstChild.nodeType == 1 ?
								outer.firstChild :
								outer;
						} else {
							if (hasOwn.call(el, keyView) && el[keyView]) {
								if (!hasOwn.call(el, keyViewElementName) || !el[keyViewElementName]) {
									throw new TypeError('Element is already used as a block of view');
								}

								if (el[keyView] != this || el[keyViewElementName] != name) {
									throw new TypeError('Element is already used as an element of view');
								}

								continue;
							}
						}

						el.className = (this.blockName + '_' + name + ' ' + el.className).trim();
					} else {
						var elSettings = el;

						el = document.createElement(elSettings.tagName || 'div');

						if (elSettings.attrs) {
							setAttributes(el, elSettings.attrs);
						}

						var cls = [this.blockName + '_' + name];

						if (elSettings.mods) {
							pushMods(cls, elSettings.mods);
						}

						el.className = (cls.join(' ') + ' ' + el.className).trim();

						if (elSettings.html) {
							el.innerHTML = elSettings.html;
						}
					}

					el[keyView] = this;
					el[keyViewElementName] = name;

					els.push(el);
				} while (++i < argCount);
			}

			return els;
		},

		/**
		 * Удаляет элемент(ы) из dom-дерева и отменяет его(их) регистрацию.
		 *
		 * @param {...($|HTMLElement|string)} els
		 * @returns {Rift.BaseView}
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
					var view = this;

					el.each(function() {
						removeElement(view, this);
					});
				} else {
					removeElement(this, el);
				}
			}

			return this;
		},

		/**
		 * @param {string} children
		 * @param {string} method
		 * @param {...*} [args]
		 * @returns {Array}
		 */
		broadcast: function(children, method) {
			var name;
			var cl;

			if (reNameClass.test(children)) {
				name = RegExp.$1;
				cl = RegExp.$2;
			} else {
				name = children;
				cl = '*';
			}

			if (name == '*') {
				children = this.children;
			} else {
				if (!hasOwn.call(this.children, name)) {
					return [];
				}

				children = this.children[name];
			}

			if (cl == '*') {
				children = children.slice(0);
			} else {
				cl = getClassOrError(cl);

				children = children.filter(function(child) {
					return child instanceof cl;
				});
			}

			var args = slice.call(arguments, 2);

			return children.map(function(child) {
				return child[method].apply(child, args);
			});
		},

		_listen: function(target, evt, listener, context, meta) {
			var type;
			var cl;

			if (target instanceof BaseView) {
				if (reNameClass.test(evt)) {
					type = RegExp.$1;
					cl = RegExp.$2;

					if (cl != '*') {
						cl = getClassOrError(cl);

						var inner = listener;
						var outer = function(evt) {
							if (evt.target instanceof cl) {
								return inner.call(this, evt);
							}
						};
						outer[keyListeningInner] = inner;

						listener = outer;
					}
				} else {
					type = evt;

					var view = this;
					var inner = listener;
					var outer = function(evt) {
						if (evt.target == view) {
							return inner.call(this, evt);
						}
					};
					outer[keyListeningInner] = inner;

					listener = outer;
				}
			} else {
				type = evt;
			}

			BaseView.$super._listen.call(
				this,
				target,
				type,
				listener,
				context,
				(cl ? (cl === '*' ? '' : getUID(cl)) : '0') + getHash(meta)
			);
		},

		_stopListening: function(target, evt, listener, context, meta) {
			var type;
			var cl;

			if (target instanceof BaseView) {
				if (reNameClass.test(evt)) {
					type = RegExp.$1;
					cl = RegExp.$2;

					if (cl != '*') {
						cl = getClassOrError(cl);
					}
				} else {
					type = evt;
				}
			} else {
				type = evt;
			}

			BaseView.$super._stopListening.call(
				this,
				target,
				type,
				listener,
				context,
				(cl ? (cl === '*' ? '' : getUID(cl)) : '0') + getHash(meta)
			);
		},

		/**
		 * Уничтожает вьюшку освобождая занятые ей ресурсы.
		 */
		dispose: function() {
			var block = this.block[0];

			if (block.parentNode) {
				block.parentNode.removeChild(block);
			}

			var children = this.children;

			for (var i = children.length; i;) {
				children[--i].dispose();
			}

			if (this._parent) {
				var parentChildren = this._parent.children;

				parentChildren.splice(parentChildren.indexOf(this), 1);

				if (this.name) {
					var namedParentChildren = parentChildren[this.name];
					namedParentChildren.splice(namedParentChildren.indexOf(this), 1);
				}
			}

			block[keyView] = null;

			BaseView.$super.dispose.call(this);
		}
	});

	rt.BaseView = BaseView;

})();
