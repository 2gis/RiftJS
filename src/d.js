var cellx = require('cellx');
var BaseModel = require('./BaseModel');
var BaseView = require('./BaseView');

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

	BaseModel.prototype[_name] = BaseView.prototype[_name] = function(type, listener, context) {
		if (type.slice(0, 7) == 'change_') {
			this[type.slice(6)](name, 'change', listener, context);
		} else {
			EventEmitter.prototype[_name].call(this, type, listener, context);
		}
	};
});

function active(target, name, descr, opts) {
	if (arguments.length == 1) {
		opts = target;

		return function(target, name, descr) {
			return active(target, name, descr, opts);
		};
	}

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

exports.active = active;
