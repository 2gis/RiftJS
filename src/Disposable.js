(function() {

	var getUID = rt.object.getUID;
	var getHash = rt.value.getHash;
	var EventEmitter = rt.EventEmitter;
	var ActiveProperty = rt.ActiveProperty;
	var autoBind = rt.ActiveProperty.autoBind;
	var disposeDataCells = rt.ActiveProperty.disposeDataCells;

	/**
	 * @private
	 *
	 * @param {Function} method
	 * @returns {Function}
	 */
	function wrapListeningMethod(method) {
		return function _(target, type, listener, context, meta) {
			if (Array.isArray(target) || (isClient && target instanceof $)) {
				for (var i = target.length; i;) {
					_.call(this, target[--i], type, listener, context, meta);
				}
			} else if (typeof target == 'function' && target.constructor == ActiveProperty) {
				target = target('dataCell', 0);
			} else if (typeof type == 'object') {
				meta = context;
				context = listener;

				var types = type;

				for (type in types) {
					_.call(this, target, type, types[type], context, meta);
				}
			} else if (Array.isArray(listener)) {
				var listeners = listener;

				for (var i = 0, l = listeners.length; i < l; i++) {
					_.call(this, target, type, listeners[i], context, meta);
				}
			} else if (typeof listener == 'object') {
				var props = listener;

				for (var name in props) {
					_.call(this, target[name]('dataCell', 0), type, props[name], context, meta);
				}
			} else {
				method.call(this, target, type, listener, context, meta);
			}

			return this;
		};
	}

	/**
	 * @private
	 *
	 * @param {{ target: Object, type: string, listener: Function, context: Object }} listening
	 */
	function removeListener(listening) {
		if (listening.target instanceof EventEmitter) {
			listening.target.off(listening.type, listening.listener, listening.context);
		} else {
			listening.target.removeEventListener(listening.type, listening.listener, false);
		}
	}

	/**
	 * @class Rift.Disposable
	 * @extends {Rift.EventEmitter}
	 */
	var Disposable = EventEmitter.extend(/** @lends Rift.Disposable# */{
		_listening: null,
		_callbacks: null,
		_timeouts: null,
		_dataCells: null,

		constructor: function() {
			EventEmitter.call(this);

			if (!this.constructor._isActivePropertiesBound) {
				var cl = this.constructor;

				do {
					autoBind(cl.prototype);
					cl._isActivePropertiesBound = true;

					cl = cl.$super.constructor;
				} while (cl != Disposable && !cl._isActivePropertiesBound);
			}
		},

		/**
		 * Начинает прослушивание события на объекте.
		 *
		 * @param {Rift.EventEmitter|EventTarget} target
		 * @param {string} type
		 * @param {Function} listener
		 * @param {Object|undefined} [context=this]
		 * @param {*} [meta]
		 * @returns {Rift.Disposable}
		 */
		listen: wrapListeningMethod(function(target, type, listener, context, meta) {
			this._listen(target, type, listener, context, meta);
		}),

		/**
		 * @protected
		 */
		_listen: function(target, type, listener, context, meta) {
			if (!context) {
				context = this;
			}

			var listening = this._listening || (this._listening = new Map());
			var id = getUID(target) + '-' + type + '-' +
				getUID(listener.hasOwnProperty(keyListenerInner) ? listener[keyListenerInner] : listener) + '-' +
				getUID(context) + '-' + (meta !== undefined ? getHash(meta) : '');

			if (listening.has(id)) {
				return;
			}

			if (target instanceof EventEmitter) {
				target.on(type, listener, context);
			} else if (typeof target.addEventListener == 'function') {
				if (target != context) {
					listener = listener.bind(context);
				}

				target.addEventListener(type, listener, false);
			} else {
				throw new TypeError('Unable to add a listener');
			}

			listening.set(id, {
				target: target,
				type: type,
				listener: listener,
				context: context,
				meta: meta
			});
		},

		/**
		 * Останавливает прослушивание события на объекте.
		 *
		 * @param {Rift.EventEmitter|EventTarget} target
		 * @param {string} type
		 * @param {Function} listener
		 * @param {Object|undefined} [context=this]
		 * @param {*} [meta]
		 * @returns {Rift.Disposable}
		 */
		stopListening: wrapListeningMethod(function(target, type, listener, context, meta) {
			this._stopListening(target, type, listener, context, meta);
		}),

		/**
		 * @protected
		 */
		_stopListening: function(target, type, listener, context, meta) {
			var listening = this._listening;

			if (!listening) {
				return;
			}

			if (!context) {
				context = this;
			}

			var id = getUID(target) + '-' + type + '-' +
				getUID(listener.hasOwnProperty(keyListenerInner) ? listener[keyListenerInner] : listener) + '-' +
				getUID(context) + '-' + (meta !== undefined ? getHash(meta) : '');

			if (listening.has(id)) {
				removeListener(listening.get(id));
				listening.delete(id);
			}
		},

		/**
		 * Останавливает прослушивание всех событий.
		 *
		 * @returns {Rift.Disposable}
		 */
		stopAllListening: function() {
			var listening = this._listening;

			if (listening) {
				for (var id in listening) {
					removeListener(listening[id]);
				}

				this._listening = null;
			}

			return this;
		},

		/**
		 * Регистрирует колбэк.
		 *
		 * @param {Function} cb
		 * @returns {Function}
		 */
		registerCallback: function(cb) {
			var callbacks = this._callbacks || (this._callbacks = new Map());

			if (callbacks.has(cb)) {
				callbacks.get(cb).canceled = true;
			}

			var disposable = this;

			function outer() {
				if (outer.hasOwnProperty('canceled') && outer.canceled) {
					return;
				}

				callbacks.delete(cb);
				cb.apply(disposable, arguments);
			}

			callbacks.set(cb, outer);

			return outer;
		},

		/**
		 * Отменяет регистрацию колбэка.
		 *
		 * @param {Function} cb
		 * @returns {Rift.Disposable}
		 */
		unregisterCallback: function(cb) {
			var callbacks = this._callbacks;

			if (callbacks && callbacks.has(cb)) {
				callbacks.get(cb).canceled = true;
				callbacks.delete(cb);
			}

			return this;
		},

		/**
		 * Отменяет все колбэки.
		 *
		 * @returns {Rift.Disposable}
		 */
		unregisterAllCallbacks: function() {
			var callbacks = this._callbacks;

			if (callbacks) {
				callbacks.forEach(function(outer) {
					outer.canceled = true;
				});

				this._callbacks = null;
			}

			return this;
		},

		/**
		 * Устанавливает таймер.
		 *
		 * @param {Function} fn
		 * @param {int} delay
		 * @returns {Rift.Disposable}
		 */
		setTimeout: function(fn, delay) {
			var timeouts = this._timeouts || (this._timeouts = new Map());

			if (timeouts.has(fn)) {
				clearTimeout(timeouts.get(fn));
			}

			var disposable = this;

			timeouts.set(fn, setTimeout(function() {
				timeouts.delete(fn);
				fn.call(disposable);
			}, delay));

			return this;
		},

		/**
		 * Отменяет установленный таймер.
		 *
		 * @param {Function} fn - Колбэк отменяемого таймера.
		 * @returns {Rift.Disposable}
		 */
		clearTimeout: function(fn) {
			var timeouts = this._timeouts;

			if (timeouts && timeouts.has(fn)) {
				clearTimeout(timeouts.get(fn));
				timeouts.delete(fn);
			}

			return this;
		},

		/**
		 * Отменяет все установленные таймеры.
		 *
		 * @returns {Rift.Disposable}
		 */
		clearAllTimeouts: function() {
			var timeouts = this._timeouts;

			if (timeouts) {
				timeouts.forEach(function(fn, id) {
					clearTimeout(id);
				});

				this._timeouts = null;
			}

			return this;
		},

		/**
		 * @param {Object} data
		 */
		collectDumpObject: function(data) {
			Object.keys(this).forEach(function(name) {
				var value = Object.getOwnPropertyDescriptor(this, name).value;

				if (typeof value == 'function' && value.constructor == ActiveProperty) {
					var dc = value('dataCell', 0);

					if (!dc.computable) {
						var dcValue = dc.value;

						if (dcValue === Object(dcValue) ? dc.changed : dc.initialValue !== dcValue) {
							data[name] = dcValue;
						}
					}
				}
			}, this);
		},

		/**
		 * @param {Object} data
		 */
		expandFromDumpObject: function(data) {
			for (var name in data) {
				this[name](data[name]);
			}
		},

		/**
		 * Уничтожает инстанс освобождая занятые им ресурсы.
		 */
		dispose: function() {
			this
				.stopAllListening()
				.unregisterAllCallbacks()
				.clearAllTimeouts();

			disposeDataCells(this);
		}
	});

	rt.Disposable = Disposable;

})();
