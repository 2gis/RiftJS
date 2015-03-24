(function() {

	var serialize = _.dump.serialize;
	var deserialize = _.dump.deserialize;
	var ActiveProperty = _.ActiveProperty;
	var Cleanable = _.Cleanable;

	/**
	 * @class Rift.ViewState
	 * @extends {Rift.Cleanable}
	 *
	 * @param {Object} fields
	 */
	var ViewState = Cleanable.extend('Rift.ViewState', /** @lends Rift.ViewState# */{
		/**
		 * @type {Array<string>}
		 */
		fields: null,

		constructor: function(fields) {
			Cleanable.call(this);

			this.fields = Object.keys(fields);

			for (var id in fields) {
				this[id] = typeof fields[id] == 'function' ? fields[id] : new ActiveProperty(fields[id]);
			}
		},

		/**
		 * @returns {Object<string>}
		 */
		serializeData: function() {
			var fields = this.fields;
			var data = {};

			for (var i = fields.length; i;) {
				var dc = this[fields[--i]]('dataCell', 0);

				if (!dc.computable) {
					var value = dc.value;

					if (dc.initialValue !== value || value === Object(value)) {
						data[fields[i]] = serialize({ v: value });
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
			var fields = this.fields;

			for (var i = fields.length; i;) {
				var id = fields[--i];
				this[id](hasOwn.call(data, id) ? data[id] : this[id]('dataCell', 0).initialValue);
			}

			return this;
		}
	});

	_.ViewState = ViewState;

})();
