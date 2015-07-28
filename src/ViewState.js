(function() {
	var serialize = rt.dump.serialize;
	var deserialize = rt.dump.deserialize;
	var Disposable = rt.Disposable;

	/**
	 * @class Rift.ViewState
	 * @extends {Rift.Disposable}
	 * @typesign new (props: Object): Rift.ViewState;
	 */
	var ViewState = Disposable.extend('Rift.ViewState', {
		/**
		 * @type {Array<string>}
		 */
		propertyList: null,

		constructor: function(props) {
			Disposable.call(this);

			this.propertyList = Object.keys(props);

			this.propertyList.forEach(function(name) {
				this[name] = (typeof props[name] == 'function' ? props[name] : cellx(props[name])).bind(this);
				this[name].constructor = cellx;
			}, this);
		},

		/**
		 * @typesign (): Object;
		 */
		serializeData: function() {
			var propertyList = this.propertyList;
			var data = {};

			for (var i = propertyList.length; i;) {
				var cell = this[propertyList[--i]]('unwrap', 0);

				if (!cell.computable) {
					var value = cell.read();

					if (value === Object(value) ? cell.changed() : cell.initialValue !== value) {
						data[propertyList[i]] = value;
					}
				}
			}

			return serialize(data);
		},

		/**
		 * @typesign (data: Object): Rift.ViewState;
		 */
		updateFromSerializedData: function(data) {
			this.update(deserialize(data));
			return this;
		},

		/**
		 * @typesign (data: Object): Rift.ViewState;
		 */
		update: function(data) {
			var propertyList = this.propertyList;
			var name;

			for (var i = propertyList.length; i;) {
				name = propertyList[--i];

				var cell = this[name]('unwrap', 0);

				if (!cell.computable) {
					cell.write(cell.initialValue);
				}
			}

			for (var j = propertyList.length; j;) {
				name = propertyList[--j];

				if (hasOwn.call(data, name)) {
					this[name](data[name]);
				}
			}

			return this;
		}
	});

	rt.ViewState = ViewState;
})();
