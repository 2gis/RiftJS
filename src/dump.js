(function() {

	var getUID = rt.object.getUID;
	var stringify = rt.value.stringify;
	var classes = rt.Class.classes;
	var registerClass = rt.Class.register;

	registerClass('Array', Array);
	registerClass('Date', Date);

	Object.defineProperties(Date.prototype, {
		collectDumpObject: {
			configurable: true,
			writable: true,
			value: function(data) {
				data.utc = this.toString();
			}
		},

		expandFromDumpObject: {
			configurable: true,
			writable: true,
			value: function(data) {
				this.setTime(new Date(data.utc));
			}
		}
	});

	/**
	 * @private
	 *
	 * @param {Object} obj
	 * @param {Object} objects
	 * @returns {string}
	 */
	function collectDump(obj, objects) {
		var id = getUID(obj);

		if (objects.hasOwnProperty(id)) {
			return id;
		}

		var data = {};
		var opts = {};

		if (obj.constructor.hasOwnProperty('__class')) {
			if (obj.collectDumpObject) {
				obj.collectDumpObject(data, opts);
			} else {
				Object.assign(data, obj);
			}

			objects[id] = {
				c: obj.constructor.__class
			};
		} else {
			Object.assign(data, obj);
			objects[id] = {};
		}

		if (!isEmpty(data)) {
			for (var name in data) {
				var value = data[name];

				if (value === Object(value)) {
					data[name] = collectDump(value, objects);
				} else {
					data[name] = value === undefined ? {} : { v: value };
				}
			}

			objects[id].d = data;
		}

		if (!isEmpty(opts)) {
			objects[id].o = opts;
		}

		return id;
	}

	/**
	 * Сериализует объект в дамп.
	 *
	 * @memberOf Rift.dump
	 *
	 * @param {Object} obj
	 * @returns {string}
	 */
	function serialize(obj) {
		var objects = {};

		return stringify({
			s: objects,
			r: collectDump(obj, objects)
		});
	}

	/**
	 * Восстанавливает объект из дампа.
	 *
	 * @memberOf Rift.dump
	 *
	 * @param {string|Object} dump
	 * @returns {Object}
	 */
	function deserialize(dump) {
		if (typeof dump == 'string') {
			dump = Function('return ' + dump + ';')();
		}

		var objects = dump.s;

		for (var id in objects) {
			var obj = objects[id];

			if (obj.hasOwnProperty('c')) {
				var cl = classes[obj.c];
				obj.instance = obj.hasOwnProperty('o') ? new cl(undefined, obj.o) : new cl();
			} else {
				obj.instance = {};
			}
		}

		for (var id in objects) {
			var obj = objects[id];

			if (obj.hasOwnProperty('d')) {
				var data = obj.d;

				for (var name in data) {
					var item = data[name];

					if (typeof item == 'object') {
						data[name] = item.hasOwnProperty('v') ? item.v : undefined;
					} else {
						data[name] = objects[item].instance;
					}
				}

				if (obj.hasOwnProperty('c') && obj.instance.expandFromDumpObject) {
					obj.instance.expandFromDumpObject(data);
				} else {
					Object.assign(obj.instance, data);
				}
			}
		}

		return objects[dump.r].instance;
	}

	/**
	 * @namespace Rift.dump
	 */
	rt.dump = {
		serialize: serialize,
		deserialize: deserialize
	};

})();
