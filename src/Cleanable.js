(function() {

	var getUID = _.object.getUID;
	var getDataPropertyValues = _.object.getDataPropertyValues;
	var getHash = _.value.getHash;
	var EventEmitter = _.EventEmitter;
	var ActiveProperty = _.ActiveProperty;
	var disposeDataCells = _.ActiveProperty.disposeDataCells;

	/**
	 * @private
	 *
	 * @param {Function} method
	 * @returns {Function}
	 */
	function wrapListeningMethod(method) {
		return function _(target, type, listener, context, meta) {
			if (Array.isArray(target) || target instanceof $) {
				for (var i = target.length; i;) {
					_.call(this, target[--i], type, listener, context, meta);
				}
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
	 * @class Rift.Cleanable
	 * @extends {Rift.EventEmitter}
	 */
	var Cleanable = EventEmitter.extend(/** @lends Rift.Cleanable# */{
		_listening: null,
		_callbacks: null,
		_timeouts: null,
		_dataCells: null,

		/**
		 * Начинает прослушивание события на объекте.
		 *
		 * @param {Rift.EventEmitter|EventTarget} target
		 * @param {string} type
		 * @param {Function} listener
		 * @param {Object|undefined} [context=this]
		 * @param {*} [meta]
		 * @returns {Rift.Cleanable}
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

			var listening = this._listening || (this._listening = {});
			var id = getUID(target) + '-' + type + '-' +
				getUID(hasOwn.call(listener, keyListeningInner) ? listener[keyListeningInner] : listener) + '-' +
				getUID(context) + '-' + (meta !== undef ? getHash(meta) : '');

			if (hasOwn.call(listening, id)) {
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

			listening[id] = {
				target: target,
				type: type,
				listener: listener,
				context: context,
				meta: meta
			};
		},

		/**
		 * Останавливает прослушивание события на объекте.
		 *
		 * @param {Rift.EventEmitter|EventTarget} target
		 * @param {string} type
		 * @param {Function} listener
		 * @param {Object|undefined} [context=this]
		 * @param {*} [meta]
		 * @returns {Rift.Cleanable}
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
				getUID(hasOwn.call(listener, keyListeningInner) ? listener[keyListeningInner] : listener) + '-' +
				getUID(context) + '-' + (meta !== undef ? getHash(meta) : '');

			if (hasOwn.call(listening, id)) {
				removeListener(listening[id]);
				delete listening[id];
			}
		},

		/**
		 * Останавливает прослушивание всех событий.
		 *
		 * @returns {Rift.Cleanable}
		 */
		stopAllListening: function() {
			var listening = this._listening;

			if (listening) {
				for (var id in listening) {
					removeListener(listening[id]);
					delete listening[id];
				}
			}

			return this;
		},

		/**
		 * Регистрирует колбэк.
		 *
		 * @param {Function} cb
		 * @returns {Function}
		 */
		regCallback: function(cb) {
			var callbacks = this._callbacks || (this._callbacks = {});
			var id = getUID(cb);

			if (hasOwn.call(callbacks, id)) {
				callbacks[id].canceled = true;
			}

			var cleanable = this;

			function outer() {
				if (hasOwn.call(outer, 'canceled') && outer.canceled) {
					return;
				}

				delete callbacks[id];
				cb.apply(cleanable, arguments);
			}

			callbacks[id] = outer;

			return outer;
		},

		/**
		 * Отменяет колбэк.
		 *
		 * @param {Function} cb
		 * @returns {Rift.Cleanable}
		 */
		cancelCallback: function(cb) {
			var callbacks = this._callbacks;

			if (callbacks) {
				var id = getUID(cb);

				if (hasOwn.call(callbacks, id)) {
					callbacks[id].canceled = true;
					delete callbacks[id];
				}
			}

			return this;
		},

		/**
		 * Отменяет все колбэки.
		 *
		 * @returns {Rift.Cleanable}
		 */
		cancelAllCallbacks: function() {
			var callbacks = this._callbacks;

			if (callbacks) {
				for (var id in callbacks) {
					callbacks[id].canceled = true;
					delete callbacks[id];
				}
			}

			return this;
		},

		/**
		 * Устанавливает таймер.
		 *
		 * @param {Function} cb
		 * @param {int} delay
		 * @returns {Rift.Cleanable}
		 */
		setTimeout: function(cb, delay) {
			var timeouts = this._timeouts || (this._timeouts = {});
			var id = getUID(cb);

			if (hasOwn.call(timeouts, id)) {
				clearTimeout(timeouts[id]);
			}

			var cleanable = this;

			timeouts[id] = setTimeout(function() {
				delete timeouts[id];
				cb.call(cleanable);
			}, delay);

			return this;
		},

		/**
		 * Отменяет установленный таймер.
		 *
		 * @param {Function} cb - Колбэк отменяемого таймера.
		 * @returns {Rift.Cleanable}
		 */
		clearTimeout: function(cb) {
			var timeouts = this._timeouts;

			if (timeouts) {
				var id = getUID(cb);

				if (hasOwn.call(timeouts, id)) {
					clearTimeout(timeouts[id]);
					delete timeouts[id];
				}
			}

			return this;
		},

		/**
		 * Отменяет все установленные таймеры.
		 *
		 * @returns {Rift.Cleanable}
		 */
		clearAllTimeouts: function() {
			var timeouts = this._timeouts;

			if (timeouts) {
				for (var id in timeouts) {
					clearTimeout(timeouts[id]);
					delete timeouts[id];
				}
			}

			return this;
		},

		/**
		 * @param {Object} data
		 */
		collectDumpObject: function(data) {
			var dcs = this._dataCells;

			if (!dcs) {
				return;
			}

			var values = getDataPropertyValues(this);

			for (var name in values) {
				var value = values[name];

				if (typeof value == 'function' && value.constructor == ActiveProperty) {
					var id = getUID(value);

					if (hasOwn.call(dcs, id)) {
						var dc = dcs[id];

						if (!dc.computable) {
							var dcValue = dc.value;

							if (dcValue === Object(dcValue) ? dc.changed : dc.initialValue !== dcValue) {
								data[name] = dcValue;
							}
						}
					}
				}
			}
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
		 * Останавливает прослушивание всех событий, отменяет все колбэки и все установленные таймеры.
		 */
		clean: function() {
			this
				.stopAllListening()
				.cancelAllCallbacks()
				.clearAllTimeouts();

			disposeDataCells(this);
		},

		/**
		 * Уничтожает инстанс освобождая занятые им ресурсы.
		 */
		dispose: function() {
			this.clean();
		}
	});

	_.Cleanable = Cleanable;

})();
