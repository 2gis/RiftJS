(function() {

	var getUID = rt.object.getUID;
	var execNamespace = rt.namespace.exec;
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
	var keyView = '_rt-view';
	var keyViewElementName = '_rt-viewElementName';

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
		if (!hasOwn.call(el, keyViewElementName) || !el[keyViewElementName] || el[keyView] != view) {
			return;
		}

		el[keyView] = null;
		el[keyViewElementName] = undef;

		var els = view.elements[el[keyViewElementName]];
		els.splice(els.indexOf(el), 1);

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

			if (this._receiveData != emptyFn) {
				var view = this;

				if (this._beforeDataReceiving != emptyFn) {
					try {
						this._beforeDataReceiving();
					} catch (err) {
						this._logError(err);
					}
				}

				try {
					if (this._receiveData.length) {
						view._receiveData(function(err) {
							if (err != null) {
								view.dataReceivingError = err;
								view._logError(err);
							}

							afterDataReceiving(view);
							renderInner(view, cb);
						});
					} else {
						this._receiveData().then(function() {
							afterDataReceiving(view);
							renderInner(view, cb);
						}, function(err) {
							view.dataReceivingError = err;
							view._logError(err);

							afterDataReceiving(view);
							renderInner(view, cb);
						});
					}
				} catch (err) {
					this.dataReceivingError = err;
					this._logError(err);

					afterDataReceiving(this);
					renderInner(this, cb);
				}
			} else {
				renderInner(this, cb);
			}
		},

		/**
		 * @protected
		 */
		_beforeDataReceiving: emptyFn,

		/**
		 * @protected
		 */
		_afterDataReceiving: emptyFn,

		/**
		 * @param {Function} [cb]
		 * @returns {Promise|undefined}
		 */
		_receiveData: emptyFn,

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
		 * @param {...(HTMLElement|string|{ tagName: string, attrs: Object<string>, mods: Object, html: string })} [el]
		 * @returns {$}
		 */
		$: function(name) {
			var els;

			if (hasOwn.call(this.elements, name)) {
				els = this.elements[name];
			} else {
				els = $('.' + this.blockName + '_' + name, this.block);

				if (this._checkDescendantElements(this.blockName, name)) {
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
						var elDescr = el;
						var cls = [this.blockName + '_' + name];

						el = document.createElement(elDescr.tagName || 'div');

						if (elDescr.mods) {
							pushMods(cls, elDescr.mods);
						}

						el.className = cls.join(' ');

						if (elDescr.attrs) {
							setAttributes(el, elDescr.attrs);
						}

						if (elDescr.html) {
							el.innerHTML = elDescr.html;
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
		 * @protected
		 *
		 * @param {string} blockName
		 * @param {string} name
		 * @returns {boolean}
		 */
		_checkDescendantElements: function(blockName, name) {
			var children = this.children;
			var result = false;

			for (var i = children.length; i;) {
				var child = children[--i];

				if (child.blockName == blockName) {
					child.$(name);
					result = true;
				} else {
					if (child._checkDescendantElements(blockName, name)) {
						result = true;
					}
				}
			}

			return result;
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
