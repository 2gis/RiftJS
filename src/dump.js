var cellx = require('cellx');
var object = require('./object');
var Class = require('./Class');

var ActiveMap = cellx.ActiveMap;
var ActiveList = cellx.ActiveList;
var getUID = object.getUID;
var assign = object.assign;
var classes = Class.classes;

var toString = Object.prototype.toString;

ActiveMap.prototype.collectDumpObject = function(data, opts) {
	var entries = data.entries = [];

	this._entries.forEach(function(value, key) {
		entries.push([key, value]);
	});

	if (this.adoptsItemChanges) {
		opts.adoptsItemChanges = true;
	}
};

ActiveMap.prototype.expandFromDumpObject = function(data) {
	data.entries.forEach(function(entry) {
		this.set(entry[0], entry[1]);
	}, this);
};

ActiveList.prototype.collectDumpObject = function(data, opts) {
	data.items = this.toArray();

	if (this.adoptsItemChanges) {
		opts.adoptsItemChanges = true;
	}
	if (this.sorted) {
		opts.sorted = true;
	}
};

ActiveList.prototype.expandFromDumpObject = function(data) {
	this.addRange(data.items);
};

Class.register('ActiveMap', ActiveMap);
Class.register('ActiveList', ActiveList);

/**
 * @typesign (obj: Object, dumpData: Object): string;
 */
function collectDump(obj, dumpData) {
	var id = getUID(obj);

	if (dumpData.hasOwnProperty(id)) {
		return id;
	}

	var data;
	var object = dumpData[id] = {};

	if (Array.isArray(obj)) {
		object.t = 0;
	} else if (toString.call(obj) == '[object Date]') {
		object.t = 1;
		object.s = obj.toString();

		return id;
	} else if (obj.constructor.hasOwnProperty('$class')) {
		object.c = obj.constructor.$class;

		if (obj.collectDumpObject) {
			data = {};
			var opts = {};

			obj.collectDumpObject(data, opts);

			if (Object.keys(opts).length) {
				object.o = opts;
			}
		}
	}

	if (!data) {
		data = assign({}, obj);
	}

	var isDataEmpty = true;

	for (var name in data) {
		isDataEmpty = false;

		var value = data[name];

		if (value === Object(value)) {
			data[name] = collectDump(value, dumpData);
		} else {
			data[name] = value === undefined ? {} : { v: value };
		}
	}

	if (!isDataEmpty) {
		object.d = data;
	}

	return id;
}

/**
 * Сериализует объект в дамп.
 * @typesign (obj: Object): string;
 */
function serialize(obj) {
	var dumpData = {};

	return JSON.stringify({
		d: dumpData,
		r: collectDump(obj, dumpData)
	});
}

exports.serialize = serialize;

/**
 * Восстанавливает объект из дампа.
 * @typesign (dump: string|Object): Object;
 */
function deserialize(dump) {
	if (typeof dump == 'string') {
		dump = JSON.parse(dump);
	}

	var dumpData = dump.d;
	var id;
	var obj;

	for (id in dumpData) {
		obj = dumpData[id];

		if (obj.hasOwnProperty('t')) {
			obj.instance = obj.t ? new Date(obj.s) : [];
		} else if (obj.hasOwnProperty('c')) {
			var cl = classes[obj.c];
			obj.instance = obj.hasOwnProperty('o') ? new cl(undefined, obj.o) : new cl();
		} else {
			obj.instance = {};
		}
	}

	for (id in dumpData) {
		obj = dumpData[id];

		if (obj.hasOwnProperty('d')) {
			var data = obj.d;

			for (var name in data) {
				var value = data[name];

				if (typeof value == 'object') {
					data[name] = value.hasOwnProperty('v') ? value.v : undefined;
				} else {
					data[name] = dumpData[value].instance;
				}
			}

			if (obj.hasOwnProperty('c') && obj.instance.expandFromDumpObject) {
				obj.instance.expandFromDumpObject(data);
			} else {
				assign(obj.instance, data);
			}
		}
	}

	return dumpData[dump.r].instance;
}

exports.deserialize = deserialize;
