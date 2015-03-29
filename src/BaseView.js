(function() {

	var getUID = rt.object.getUID;
	var execNamespace = rt.namespace.exec;
	var escapeRegExp = rt.regex.escape;
	var getHash = rt.value.getHash;
	var toString = rt.value.toString;
	var nextTick = rt.process.nextTick;
	var classes = rt.Class.classes;
	var getClassOrError = rt.Class.getOrError;
	var Cleanable = rt.Cleanable;
	var escapeHTML = rt.html.escape;
	var pushMods = rt.mods.push;
	var templates = rt.template.templates;
	var bindDOM = rt.domBinding.bind;

	var reNameClass = /^(.+?)::(.+)$/;
	var reViewData = /([^,]*),([^,]*),(.*)/;
	var reBlockElement = {};
	var keyView = '_rt-view';
	var keyViewElementName = '_rt-viewElementName';

	/**
	 * @private
	 *
	 * @param {Rift.BaseView} view
	 * @param {Function} cb
	 */
	function renderInner(view, cb) {
		var childRenderings = view._childRenderings = {
			count: 0,
			readyCount: 0,

			marks: [],
			results: [],

			onready: null
		};
		var html;

		try {
			html = view.template.call(view);
		} catch (err) {
			view._logError(err);
			cb('');
			return;
		}

		childRenderings.onready = function() {
			var marks = childRenderings.marks;
			var results = childRenderings.results;

			for (var i = marks.length; i;) {
				html = html.replace(marks[--i], function() {
					return results[i];
				});
			}

			cb(html);
		};

		if (childRenderings.count == childRenderings.readyCount) {
			view._childRenderings = null;
			childRenderings.onready();
		}
	}

	/**
	 * @private
	 *
	 * @param {Rift.BaseView} view
	 */
	function initClient(view) {
		var dcs = bindDOM(view.block[0], view, {
			bindRootElement: false,
			applyValues: false,
			removeAttr: true
		});

		if (view._dataCells) {
			Object.assign(view._dataCells, dcs);
		} else {
			view._dataCells = dcs;
		}

		if (view._initClient != emptyFn) {
			nextTick(function() {
				if (view._initClient.length) {
					try {
						view._initClient(function(err) {
							if (err != null) {
								handleClientInitError(view, err);
								return;
							}

							bindEvents(view);
						});
					} catch (err) {
						handleClientInitError(view, err);
					}
				} else {
					var result;

					try {
						result = view._initClient();
					} catch (err) {
						handleClientInitError(view, err);
						return;
					}

					if (result) {
						result.then(function() {
							bindEvents(view);
						}, function(err) {
							handleClientInitError(view, err);
						});
					} else {
						bindEvents(view);
					}
				}
			});
		} else {
			nextTick(function() {
				bindEvents(view);
			});
		}
	}

	/**
	 * @private
	 *
	 * @param {Rift.BaseView} view
	 */
	function bindEvents(view) {
		if (view._bindEvents != emptyFn) {
			try {
				view._bindEvents();
			} catch (err) {
				handleClientInitError(view, err);
				return;
			}
		}

		view.emit('clientinited');
	}

	/**
	 * @private
	 *
	 * @param {Rift.BaseView} view
	 * @param {*} err
	 */
	function handleClientInitError(view, err) {
		view._logError(err);
		view.emit('clientiniterror', { error: err });
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
	 * @param {HTMLElement} el
	 */
	function removeElement(view, el) {
		view.unregElement(el);

		if (el.parentNode) {
			el.parentNode.removeChild(el);
		}
	}

	/**
	 * @class Rift.BaseView
	 * @extends {Rift.Cleanable}
	 *
	 * @param {Object} [opts]
	 * @param {string} [opts.name]
	 * @param {string} [opts.tagName]
	 * @param {Object<boolean|number|string>} [opts.mods]
	 * @param {Object<string>} [opts.attrs]
	 * @param {boolean} [opts.onlyClient=false] - Рендерить только на клиенте.
	 * @param {Rift.BaseApp} [opts.app]
	 * @param {Rift.BaseModel|Rift.ActiveDictionary|Rift.ActiveArray|Rift.ActiveProperty|string} [opts.model]
	 * @param {Rift.BaseView} [opts.parent]
	 * @param {?(HTMLElement|$)} [opts.block]
	 */
	var BaseView = Cleanable.extend(/** @lends Rift.BaseView# */{
		static: {
			_isTemplateInited: false
		},

		_id: undef,

		_options: null,

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

		/**
		 * @type {boolean}
		 */
		onlyClient: false,

		/**
		 * @type {?Rift.BaseApp}
		 */
		app: null,

		/**
		 * @type {?(Rift.BaseModel|Rift.ActiveDictionary|Rift.ActiveArray|Rift.ActiveProperty)}
		 */
		model: null,

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

		/**
		 * @type {Function}
		 */
		template: function() { return ''; },

		_childRenderings: null,

		/**
		 * @type {Function}
		 * @writable
		 */
		onclientinited: null,

		/**
		 * @type {Function}
		 * @writable
		 */
		onclientiniterror: null,

		constructor: function(opts) {
			Cleanable.call(this);

			if (!opts) {
				opts = {};
			}

			this._options = opts;

			this.mods = Object.create(this.mods);
			this.attrs = Object.create(this.attrs);

			this.children = [];
			this.elements = {};

			if (!this.blockName) {
				var viewClass = this.constructor;

				while (viewClass.$super.constructor != BaseView) {
					viewClass = viewClass.$super.constructor;
				}

				var cl = viewClass.__class;
				var index = cl.lastIndexOf('.');

				viewClass.prototype.blockName = index == -1 ? cl : cl.slice(index + 1);
			}

			if (!this.constructor._isTemplateInited) {
				var viewClass = this.constructor;

				do {
					var cl = viewClass.__class;
					var index = cl.lastIndexOf('.');
					var name = index == -1 ? cl : cl.slice(index + 1);

					if (hasOwn.call(templates, name)) {
						this.constructor.prototype.template = templates[name];
						break;
					}

					viewClass = viewClass.$super.constructor;
				} while (viewClass != BaseView);

				this.constructor._isTemplateInited = true;
			}

			var block;

			if (isServer) {
				if (opts.block) {
					throw new TypeError('Option "block" can\'t be used on the server side');
				}

				block = null;

				if (opts.block === null) {
					delete opts.block;
				}
			} else {
				if (opts.block !== undef) {
					block = opts.block;
					delete opts.block;
				}
			}

			if (block === null) {
				this._id = getUID(this, isServer ? 's' : 'c');
				this._parseOptions();
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

					if (block.hasAttribute('rt-v')) {
						data = block.getAttribute('rt-v').match(reViewData);

						if (data[2]) {
							rendered = true;
						}

						if (data[3]) {
							Object.assign(opts, Function('return {' + data[3] + '};')());
						}
					}
				}

				this._id = rendered ? data[2] : getUID(this, 'c');
				this._parseOptions();

				if (!block) {
					block = document.createElement(this.tagName);
				}

				this.block = $(block);
				block[keyView] = this;

				var view = this;

				if (rendered) {
					this._collectElements();

					this.block
						.find('[rt-p=' + this._id + ']')
						.each(function() {
							new classes[this.getAttribute('rt-v').match(reViewData)[1]]({
								parent: view,
								block: this
							});
						});

					initClient(this);
				} else {
					block.className = (block.className + ' ' + pushMods([this.blockName], this.mods).join(' ')).trim();

					setAttributes(block, this.attrs);

					this.renderInner(function(html) {
						block.innerHTML = html;

						var blocks = block.querySelectorAll('[rt-p]');
						var blockDict = {};

						for (var i = blocks.length; i;) {
							blockDict[blocks[--i].getAttribute('rt-v').match(reViewData)[2]] = blocks[i];
						}

						(function _(view) {
							view._collectElements();

							var children = view.children;

							for (var i = 0, l = children.length; i < l; i++) {
								var child = children[i];
								var childBlock = blockDict[child._id];

								child.block = $(childBlock);
								childBlock[keyView] = child;

								_(child);
							}

							initClient(view);
						})(view);
					});
				}
			}
		},

		/**
		 * @protected
		 */
		_parseOptions: function() {
			var opts = this._options;

			if (opts.name) {
				this.name = opts.name;
			}

			if (opts.tagName) {
				this.tagName = opts.tagName;
				delete opts.tagName;
			}

			if (opts.blockName) {
				this.blockName = opts.blockName;
			}

			if (opts.mods) {
				Object.assign(this.mods, opts.mods);
				delete opts.mods;
			}

			if (opts.attrs) {
				Object.assign(this.attrs, opts.attrs);
				delete opts.attrs;
			}

			if (opts.onlyClient !== undef) {
				this.onlyClient = opts.onlyClient;
			}

			if (opts.parent) {
				this.parent = opts.parent;
				delete opts.parent;
			}

			if (opts.app) {
				this.app = opts.app;
				delete opts.app;

				this.model = this.app.model;
			}

			var model = opts.model;

			if (model) {
				if (typeof model == 'string') {
					this.model = execNamespace(model, this._parent || this);
				} else {
					this.model = model;
					delete opts.model;
				}
			} else {
				var parent = this._parent;

				if (parent && parent.model) {
					this.model = parent.model;
				}
			}
		},

		/**
		 * @param {Function} cb
		 */
		render: function(cb) {
			if (this._childRenderings) {
				throw new TypeError('Cannot run the rendering when it is in process');
			}

			if (isServer && this.onlyClient) {
				cb(
					'<' + this.tagName +
						' rt-v="' + [
							this.constructor.__class,
							'',
							isEmpty(this._options) ? '' : escapeHTML(toString(this._options).slice(1, -1))
						] + '"' +
						(this._parent ? ' rt-p="' + this._parent._id + '"' : '') +
						'></' + this.tagName + '>'
				);

				return;
			}

			var view = this;

			this.renderInner(function(html) {
				var cls = [view.blockName];
				var attrs = [];

				pushMods(cls, view.mods);

				var attribs = view.attrs;

				for (var name in attribs) {
					attrs.push(name + '="' + attribs[name] + '"');
				}

				cb(
					'<' + view.tagName +
						' class="' + cls.join(' ') + '"' +
						(attrs.length ? ' ' + attrs.join(' ') : '') +
						' rt-v="' + [
							view.constructor.__class,
							view._id,
							isEmpty(view._options) ? '' : escapeHTML(toString(view._options).slice(1, -1))
						] + '"' +
						(view._parent ? ' rt-p="' + view._parent._id + '"' : '') +
						'>' + html + '</' + view.tagName + '>'
				);
			});
		},

		/**
		 * @param {Function} cb
		 */
		renderInner: function(cb) {
			if (this._childRenderings) {
				throw new TypeError('Cannot run the rendering when it is in process');
			}

			if (this.receiveData != emptyFn) {
				var view = this;

				try {
					if (this.receiveData.length) {
						view.receiveData(function(err) {
							if (err != null) {
								view.dataReceivingError = err;
								view._logError(err);
							}

							renderInner(view, cb);
						});
					} else {
						this.receiveData().then(function() {
							renderInner(view, cb);
						}, function(err) {
							view.dataReceivingError = err;
							view._logError(err);

							renderInner(view, cb);
						});
					}
				} catch (err) {
					this.dataReceivingError = err;
					this._logError(err);

					renderInner(this, cb);
				}
			} else {
				renderInner(this, cb);
			}
		},

		/**
		 * @param {Function} [cb]
		 * @returns {Promise|undefined}
		 */
		receiveData: emptyFn,

		_collectElements: function() {
			var blockName = this.blockName;
			var reBE = hasOwn.call(reBlockElement, blockName) ?
				reBlockElement[blockName] :
				(reBlockElement[blockName] = RegExp('(?:^|\\s)' + escapeRegExp(blockName) + '_([^_\\s]+)(?:\\s|$)'));
			var els = this.elements;

			this.block.find('.' + this._id + '--').each(function() {
				var name = this.className.match(reBE)[1];
				(els[name] || (els[name] = $())).push(this);
			});
		},

		/**
		 * @protected
		 *
		 * @param {Function} [cb]
		 * @returns {Promise|undefined}
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
				if (child._parent != this) {
					throw new TypeError('View is already registered as a child of other view');
				}

				return this;
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

				if (!namedChildren.length) {
					delete children[childName];
				}
			}

			return this;
		},

		/**
		 * Регистрирует элемент.
		 *
		 * @param {string} name
		 * @param {HTMLElement} el
		 * @returns {Rift.BaseView}
		 */
		regElement: function(name, el) {
			if (hasOwn.call(el, keyView) && el[keyView]) {
				if (!hasOwn.call(el, keyViewElementName) || !el[keyViewElementName]) {
					throw new TypeError('Element can\'t be registered because it is used as a block of view');
				}

				if (el[keyView] != this || el[keyViewElementName] != name) {
					throw new TypeError('Element is already registered as an element of other view');
				}

				return this;
			}

			el[keyView] = this;
			el[keyViewElementName] = name;

			(hasOwn.call(this.elements, name) ? this.elements[name] : (this.elements[name] = $())).push(el);

			return this;
		},

		/**
		 * Отменяет регистрацию элемента.
		 *
		 * @param {HTMLElement} el
		 * @returns {Rift.BaseView}
		 */
		unregElement: function(el) {
			if (!hasOwn.call(el, keyViewElementName)) {
				return this;
			}

			var name = el[keyViewElementName];

			if (!name || el[keyView] != this) {
				return this;
			}

			el[keyView] = null;
			el[keyViewElementName] = undef;

			var els = this.elements[name];

			els.splice(els.indexOf(el), 1);

			if (!els.length) {
				delete this.elements[name];
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
		 * // создаёт новый элемент `<li class="Module_item __selected">Hi!</li>`,
		 * // добавляет его в коллекцию item и возвращает всю коллекцию
		 * this.$('item', '<li class="__selected">Hi!</li>');
		 *
		 * @example
		 * // то же, что и в предыдущем примере, но описание элемента в виде объекта
		 * this.$('item', { tagName: 'li', mods: { selected: true }, html: 'Hi!' });
		 *
		 * @param {string} name
		 * @param {...({ tagName: string, mods: Object, attrs: Object<string>, html: string }|string|HTMLElement)} [el]
		 * @returns {$}
		 */
		$: function(name) {
			var argCount = arguments.length;

			if (argCount > 1) {
				var i = 1;

				do {
					var el = arguments[i];
					var type = typeof el;

					if (type == 'string' || el instanceof HTMLElement) {
						if (type == 'string') {
							var outer = document.createElement('div');

							outer.innerHTML = el;
							el = outer.childNodes.length == 1 && outer.firstChild.nodeType == 1 ?
								outer.firstChild : outer;
						}

						el.className = (this.blockName + '_' + name + ' ' + el.className).trim();
					} else {
						var elem = document.createElement(el.tagName || 'div');
						var cls = [this.blockName + '_' + name];

						if (el.mods) {
							pushMods(cls, el.mods);
						}

						elem.className = cls.join(' ');

						if (el.attrs) {
							setAttributes(elem, el.attrs);
						}

						if (el.html) {
							elem.innerHTML = el.html;
						}

						el = elem;
					}

					this.regElement(name, el);
				} while (++i < argCount);
			}

			return this.elements[name];
		},

		/**
		 * Удаляет элемент(ы) из dom-дерева и отменяет его(их) регистрацию.
		 *
		 * @param {...(HTMLElement|string|$)} els
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

			children = name == '*' ? this.children : this.children[name];

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
					parentChildren = parentChildren[this.name];
					parentChildren.splice(parentChildren.indexOf(this), 1);
				}
			}

			block[keyView] = null;

			BaseView.$super.dispose.call(this);
		}
	});

	rt.BaseView = BaseView;

})();
