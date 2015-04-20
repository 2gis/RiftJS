(function() {

	var Event = rt.Event;

	var keyUsed = '_emt-used';

	/**
	 * @private
	 *
	 * @param {Function} method
	 * @returns {Function}
	 */
	function wrapOnOff(method) {
		return function _(type, listener, context) {
			if (typeof type == 'object') {
				context = listener;

				var types = type;

				for (type in types) {
					_.call(this, type, types[type], context);
				}
			} else {
				method.call(this, type, listener, context);
			}

			return this;
		};
	}

	/**
	 * @class Rift.EventEmitter
	 * @extends {Object}
	 */
	function EventEmitter() {}

	EventEmitter.extend = rt.Class.extend;

	Object.assign(EventEmitter.prototype, /** @lends Rift.EventEmitter# */{
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
		 * @param {Object} [context=this]
		 * @returns {Rift.EventEmitter}
		 */
		on: wrapOnOff(function(type, listener, context) {
			var events = this._events || (this._events = Object.create(null));

			(events[type] || (events[type] = [])).push({
				listener: listener,
				context: context || this
			});
		}),

		/**
		 * @param {string} type
		 * @param {Function} listener
		 * @param {Object} [context=this]
		 * @returns {Rift.EventEmitter}
		 */
		off: wrapOnOff(function(type, listener, context) {
			var events = (this._events || (this._events = Object.create(null)))[type];

			if (!events) {
				return;
			}

			if (!context) {
				context = this;
			}

			for (var i = events.length; i;) {
				var evt = events[--i];

				if (evt.context == context && (
					evt.listener == listener ||
						(hasOwn.call(evt.listener, keyListeningInner) && evt.listener[keyListeningInner] === listener)
				)) {
					events.splice(i, 1);
				}
			}

			if (!events.length) {
				delete this._events[type];
			}
		}),

		/**
		 * @param {string} type
		 * @param {Function} listener
		 * @param {Object} [context=this]
		 * @returns {Rift.EventEmitter}
		 */
		once: function(type, listener, context) {
			function outer() {
				this.off(type, outer);
				listener.apply(this, arguments);
			}
			outer[keyListeningInner] = listener;

			return this.on(type, outer, context);
		},

		/**
		 * @param {Rift.Event|string} evt
		 * @param {Object} [detail]
		 * @returns {Rift.Event}
		 */
		emit: function(evt, detail) {
			if (typeof evt == 'string') {
				evt = new Event(evt);
			} else if (hasOwn.call(evt, keyUsed)) {
				throw new TypeError('Attempt to use an object that is no longer usable');
			}

			evt[keyUsed] = true;

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
				var events = (this._events || (this._events = Object.create(null)))[type];
				var eventCount;

				if (typeof this['on' + type] == 'function') {
					events = events ? events.slice(0) : [];
					events.push({ listener: this['on' + type], context: this });

					eventCount = events.length;
				} else {
					if (events) {
						events = events.slice(0);
						eventCount = events.length;
					} else {
						eventCount = 0;
					}
				}

				if (eventCount) {
					var i = 0;

					do {
						if (evt.isImmediatePropagationStopped) {
							break;
						}

						try {
							if (events[i].listener.call(events[i].context, evt) === false) {
								evt.isPropagationStopped = true;
							}
						} catch (err) {
							this._logError(err);
						}
					} while (++i < eventCount);
				}
			}

			var parent = this.parent;

			if (parent && evt.bubbles && !evt.isPropagationStopped) {
				parent._handleEvent(evt);
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
