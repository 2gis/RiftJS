var Disposable = require('./Disposable');

/**
 * @class Rift.BaseModel
 * @extends {Rift.Disposable}
 * @abstract
 * @typesign new (data?: Object): Rift.BaseModel;
 */
var BaseModel = Disposable.extend({
	/**
	 * @typesign (data: Object, nameMap?: Object<string>): Rift.BaseModel;
	 */
	setData: function(data, nameMap) {
		if (!nameMap) {
			nameMap = {};
		}

		for (var name in data) {
			var mappedName = nameMap[name] || name;

			if (mappedName in this) {
				var value = data[name];

				if (typeof this[mappedName] == 'function') {
					this[mappedName](value);
				} else {
					this[mappedName] = value;
				}
			}
		}

		return this;
	}
});

module.exports = BaseModel;
