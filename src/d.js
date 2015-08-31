var cellx = require('cellx');

var EventEmitter = cellx.EventEmitter;

function autobind(target, name, descr) {
	var fn = descr.initializer ? descr.initializer() : descr.value;

	return {
		configurable: false,
		enumerable: descr.enumerable,

		get: function() {
			var bound = descr.value = fn.bind(this);

			for (var prop in fn) {
				if (fn.hasOwnProperty(prop)) {
					bound[prop] = fn[prop];
				}
			}

			if (bound.constructor != fn.constructor) {
				Object.defineProperty(bound, 'constructor', {
					configurable: true,
					writable: true,
					value: fn.constructor
				});
			}

			Object.defineProperty(this, name, descr);

			return this[name];
		}
	};
}

exports.autobind = autobind;

['on', 'off'].forEach(function(name) {
	var _name = '_' + name;
	var origMethod = EventEmitter.prototype[_name];

	EventEmitter.prototype[_name] = function(type, listener, context) {
		if (type.slice(0, 7) == 'change:') {
			this['_' + type.slice(7)](name, 'change', listener, context);
		} else {
			origMethod.call(this, type, listener, context);
		}
	};
});

function observable(target, name, descr, opts) {
	if (arguments.length == 1) {
		opts = target;

		return function(target, name, descr) {
			return observable(target, name, descr, opts);
		};
	}

	if (!opts) {
		opts = {};
	}

	opts.computed = false;

	var _name = '_' + name;

	target[_name] = cellx(descr.initializer(), opts);

	return {
		configurable: descr.configurable,
		enumerable: descr.enumerable,

		get: function() {
			return this[_name]();
		},

		set: function(value) {
			this[_name](value);
		}
	};
}

exports.observable = observable;

function computed(target, name, descr, opts) {
	if (arguments.length == 1) {
		opts = target;

		return function(target, name, descr) {
			return computed(target, name, descr, opts);
		};
	}

	var value = descr.initializer();

	if (typeof value != 'function') {
		throw new TypeError('Property value must be a function');
	}

	if (!opts) {
		opts = {};
	}

	opts.computed = true;

	var _name = '_' + name;

	target[_name] = cellx(value, opts);

	var descr = {
		configurable: descr.configurable,
		enumerable: descr.enumerable,

		get: function() {
			return this[_name]();
		}
	};
	
	if (opts.write) {
		descr.set = function(value) {
			this[_name](value);
		};
	}

	return descr;
}

exports.computed = computed;
