(function() {

	var serialize = rt.dump.serialize;
	var deserialize = rt.dump.deserialize;
	var ActiveProperty = rt.ActiveProperty;
	var Cleanable = rt.Cleanable;

	/**
	 * @class Rift.ViewState
	 * @extends {Rift.Cleanable}
	 *
	 * @param {Object} props
	 */
	var ViewState = Cleanable.extend('Rift.ViewState', /** @lends Rift.ViewState# */{
		/**
		 * @type {Array<string>}
		 */
		properties: null,

		constructor: function(props) {
			Cleanable.call(this);

			this.properties = Object.keys(props);

			for (var name in props) {
				this[name] = typeof props[name] == 'function' ? props[name] : new ActiveProperty(props[name]);
			}
		},

		/**
		 * @returns {Object<string>}
		 */
		serializeData: function() {
			var props = this.properties;
			var data = {};

			for (var i = props.length; i;) {
				var dc = this[props[--i]]('dataCell', 0);

				if (!dc.computable) {
					var value = dc.value;

					if (value === Object(value) ? dc.changed : dc.initialValue !== value) {
						data[props[i]] = serialize({ v: value });
					}
				}
			}

			return data;
		},

		/**
		 * @param {Object<string>} data
		 * @returns {Rift.ViewState}
		 */
		updateFromSerializedData: function(data) {
			var deserialized = {};

			for (var name in data) {
				deserialized[name] = deserialize(data[name]).v;
			}

			this.update(deserialized);

			return this;
		},

		/**
		 * @param {Object} data
		 * @returns {Rift.ViewState}
		 */
		update: function(data) {
			var props = this.properties;

			for (var i = props.length; i;) {
				var name = props[--i];
				this[name](hasOwn.call(data, name) ? data[name] : this[name]('dataCell', 0).initialValue);
			}

			return this;
		}
	});

	rt.ViewState = ViewState;

})();
