var cellx = require('cellx');
var uid = require('./uid');

var EventEmitter = cellx.EventEmitter;
var nextUID = uid.next;

/**
 * @class Rift.Disposable
 * @extends {Rift.EventEmitter}
 * @typesign new (): Rift.Disposable;
 */
var Disposable = EventEmitter.extend({
	_disposables: null,

	disposed: false,

	constructor: function() {
		EventEmitter.call(this);
		this._disposables = Object.create(null);
	},

	listenTo: function(target, type, listener, context) {
		var listeners;
		var listenings;

		if (Array.isArray(target) || (target.addClass && target.append)) {
			listenings = [];

			for (var i = target.length; i;) {
				listenings.push(this.listenTo(target[--i], type, listener, context));
			}
		} else if (typeof type == 'object') {
			context = listener;
			listeners = type;
			listenings = [];

			for (type in listeners) {
				listenings.push(this.listenTo(target, type, listeners[type], context));
			}
		} else if (Array.isArray(listener)) {
			listeners = listener;
			listenings = [];

			for (var j = 0, m = listeners.length; j < m; j++) {
				listenings.push(this.listenTo(target, type, listeners[j], context));
			}
		} else if (typeof listener == 'object') {
			listeners = listener;
			listenings = [];

			for (var name in listeners) {
				listenings.push(this.listenTo(target[name]('unwrap', 0), type, listeners[name], context));
			}
		} else {
			return this._listenTo(target, type, listener, context);
		}

		var id = nextUID();
		var _this = this;

		function stopListening() {
			for (var i = listenings.length; i;) {
				listenings[--i].stop();
			}

			delete _this._disposables[id];
		}

		var listening = this._disposables[id] = {
			stop: stopListening,
			dispose: stopListening
		};

		return listening;
	},

	/**
	 * @typesign (
	 *     target: Rift.EventEmitter|EventTarget,
	 *     type: string,
	 *     listener: (evt: cellx~Event): boolean|undefined,
	 *     context?: Object
	 * );
	 */
	_listenTo: function(target, type, listener, context) {
		if (!context) {
			context = this;
		}

		var id = nextUID();
		var _this = this;

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

		function stopListening() {
			if (id in _this._disposables) {
				if (target instanceof EventEmitter) {
					target.off(type, listener, context);
				} else {
					target.removeEventListener(type, listener, false);
				}

				delete _this._disposables[id];
			}
		}

		var listening = this._disposables[id] = {
			stop: stopListening,
			dispose: stopListening
		};

		return listening;
	},

	/**
	 * Регистрирует колбэк.
	 * @typesign (cb: Function): Function{ cancel: (), dispose: () };
	 */
	registerCallback: function(cb) {
		var id = nextUID();
		var _this = this;

		function callback() {
			if (id in _this._disposables) {
				delete _this._disposables[id];
				return cb.apply(_this, arguments);
			}
		}

		function cancelCallback() {
			delete _this._disposables[id];
		}

		callback.cancel = cancelCallback;
		callback.dispose = cancelCallback;

		this._disposables[id] = callback;

		return callback;
	},

	/**
	 * Устанавливает таймер.
	 * @typesign (fn: Function, delay: uint): { clear: (), dispose: () };
	 */
	setTimeout: function(fn, delay) {
		var id = nextUID();
		var _this = this;

		var timeoutId = setTimeout(function() {
			delete _this._disposables[id];
			fn.call(_this);
		}, delay);

		function clearTimeout() {
			if (id in _this._disposables) {
				clearTimeout(timeoutId);
				delete _this._disposables[id];
			}
		}

		var timeout = this._disposables[id] = {
			clear: clearTimeout,
			dispose: clearTimeout
		};

		return timeout;
	},

	/**
	 * @typesign ();
	 */
	dispose: function() {
		if (this.disposed) {
			return;
		}

		var disposables = this._disposables;

		for (var id in disposables) {
			disposables[id].dispose();
		}

		this.disposed = true;
	}
});

module.exports = Disposable;
