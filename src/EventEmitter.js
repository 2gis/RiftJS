(function() {

	var Event = rt.Event;

	/**
	 * @class Rift.EventEmitter
	 * @extends {Object}
	 */
	var EventEmitter = rt.Class.extend(/** @lends Rift.EventEmitter# */{
		_events: null,

		/**
		 * @type {?Rift.EventEmitter}
		 * @writable
		 */
		parent: null,

		/**
		 * @type {boolean}
		 * @writable
		 */
		silent: false,

		/**
		 * @param {string} type
		 * @param {Function} listener
		 * @param {Object} [context]
		 * @returns {Rift.EventEmitter}
		 */
		on: function(type, listener, context) {
			if (typeof type == 'object') {
				context = listener;

				var types = type;

				for (type in types) {
					this._on(type, types[type], context);
				}
			} else {
				this._on(type, listener, context);
			}

			return this;
		},

		_on: function(type, listener, context) {
			var events = (this._events || (this._events = new Map())).get(type);

			if (!events) {
				events = [];
				this._events.set(type, events);
			}

			events.push({
				listener: listener,
				context: context || this
			});
		},

		/**
		 * @param {string} type
		 * @param {Function} listener
		 * @param {Object} [context]
		 * @returns {Rift.EventEmitter}
		 */
		off: function(type, listener, context) {
			if (type === undefined) {
				this._events = null;
			} else if (typeof type == 'object') {
				context = listener;

				var types = type;

				for (type in types) {
					this._off(type, types[type], context);
				}
			} else {
				this._off(type, listener, context);
			}

			return this;
		},

		_off: function(type, listener, context) {
			var events = this._events || (this._events = new Map()).get(type);

			if (!events) {
				return;
			}

			if (!context) {
				context = this;
			}

			for (var i = events.length; i;) {
				if (events[--i].context == context) {
					var lst = events[i].listener;

					if (lst == listener || (lst.hasOwnProperty(KEY_INNER) && lst[KEY_INNER] == listener)) {
						events.splice(i, 1);
						break;
					}
				}
			}

			if (!events.length) {
				this._events.delete(type);
			}
		},

		/**
		 * @param {string} type
		 * @param {Function} listener
		 * @param {Object} [context]
		 * @returns {Rift.EventEmitter}
		 */
		once: function(type, listener, context) {
			function outer() {
				this._off(type, outer, context);
				listener.apply(this, arguments);
			}
			outer[KEY_INNER] = listener;

			return this._on(type, outer, context);
		},

		/**
		 * @param {Rift.Event|string} evt
		 * @param {Object} [detail]
		 * @returns {Rift.Event}
		 */
		emit: function(evt, detail) {
			if (typeof evt == 'string') {
				evt = new Event(evt);
			} else if (evt.hasOwnProperty(KEY_USED)) {
				throw new TypeError('Attempt to use an object that is no longer usable');
			}

			evt[KEY_USED] = true;

			evt.target = this;
			evt.timestamp = Date.now();

			if (detail) {
				evt.detail = detail;
			}

			this._handleEvent(evt);

			return evt;
		},

		/**
		 * @protected
		 *
		 * @param {Rift.Event} evt
		 */
		_handleEvent: function(evt) {
			if (!this.silent || evt.target != this) {
				var type = evt.type;
				var events = (this._events && this._events.get(type) || []).slice(0);

				if (typeof this['on' + type] == 'function') {
					events.push({
						listener: this['on' + type],
						context: this
					});
				}

				for (var i = 0, l = events.length; i < l; i++) {
					if (evt.isImmediatePropagationStopped) {
						break;
					}

					try {
						if (events[i].listener.call(events[i].context, evt) === false) {
							evt.stopPropagation();
						}
					} catch (err) {
						this._logError(err);
					}
				}
			}

			if (this.parent && evt.bubbles && !evt.isPropagationStopped) {
				this.parent._handleEvent(evt);
			}
		},

		/**
		 * @protected
		 *
		 * @param {*} err
		 */
		_logError: function(err) {
			rt.logError(err);
		}
	});

	rt.EventEmitter = EventEmitter;

})();
