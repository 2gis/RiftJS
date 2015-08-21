var cellx = require('cellx');

function autobind(target, name, descr) {
	var fn = descr.initializer ? descr.initializer() : descr.value;

	return {
		configurable: false,
		enumerable: descr.enumerable,

		get: function() {
			var bound = descr.value = fn.bind(this);

			for (var nm in fn) {
				if (fn.hasOwnProperty(nm)) {
					bound[nm] = fn[nm];
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

function active(target, name, descr, opts) {
	if (arguments.length == 1) {
		opts = target;

		return function(target, name, descr) {
			return active(target, name, descr, opts);
		};
	}

	var cl = cellx(descr.initializer(), opts);

	return {
		configurable: descr.configurable,
		enumerable: descr.enumerable,

		get: function() {
			return cl.call(this);
		},

		set: function(value) {
			if (cl.call(this, value)) {
				this.emit('change:' + name);
			}
		}
	};
}

exports.active = active;
