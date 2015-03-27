(function() {

	var serialize = _.dump.serialize;
	var deserialize = _.dump.deserialize;
	var ActiveProperty = _.ActiveProperty;
	var Cleanable = _.Cleanable;

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

			for (var id in props) {
				this[id] = typeof props[id] == 'function' ? props[id] : new ActiveProperty(props[id]);
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

					if (dc.initialValue !== value || value === Object(value)) {
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

			for (var id in data) {
				deserialized[id] = deserialize(data[id]).v;
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
				var id = props[--i];
				this[id](hasOwn.call(data, id) ? data[id] : this[id]('dataCell', 0).initialValue);
			}

			return this;
		}
	});

	_.ViewState = ViewState;

})();
