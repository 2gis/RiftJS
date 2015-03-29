(function() {

	var Cleanable = rt.Cleanable;

	/**
	 * @class Rift.BaseModel
	 * @extends {Rift.Cleanable}
	 * @abstract
	 *
	 * @param {?(Object|undefined)} [data] - Начальные данные.
	 * @param {Object} [opts]
	 */
	var BaseModel = Cleanable.extend(/** @lends Rift.BaseModel# */{
		_options: null,

		constructor: function(data, opts) {
			Cleanable.call(this);

			this._options = opts || {};

			if (data) {
				this.setData(data);
			}
		},

		/**
		 * @param {Object} data
		 */
		setData: function(data) {
			for (var name in data) {
				if (name in this) {
					this[name](data[name]);
				}
			}
		},

		/**
		 * @param {Object} data
		 * @param {Object} opts
		 */
		collectDumpObject: function(data, opts) {
			BaseModel.$super.collectDumpObject.call(this, data);
			Object.assign(opts, this._options);
		}
	});

	rt.BaseModel = BaseModel;

})();
