var Disposable = require('./Disposable');

/**
 * @class Rift.BaseModel
 * @extends {Rift.Disposable}
 * @abstract
 * @typesign new (data?: Object): Rift.BaseModel;
 */
var BaseModel = Disposable.extend({
	setData: function(data) {
		for (var name in data) {
			this[name](data[name]);
		}
	}
});

module.exports = BaseModel;
