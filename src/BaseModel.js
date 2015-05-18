(function() {

	var ActiveProperty = rt.ActiveProperty;
	var Disposable = rt.Disposable;

	/**
	 * @class Rift.BaseModel
	 * @extends {Rift.Disposable}
	 * @abstract
	 *
	 * @param {?(Object|undefined)} [data] - Начальные данные.
	 * @param {Object} [opts]
	 */
	var BaseModel = Disposable.extend(/** @lends Rift.BaseModel# */{
		_options: null,

		constructor: function(data, opts) {
			Disposable.call(this);

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
				if (typeof this[name] == 'function' && this[name].constructor == ActiveProperty) {
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
