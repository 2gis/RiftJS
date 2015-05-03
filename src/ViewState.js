(function() {

	var serialize = rt.dump.serialize;
	var deserialize = rt.dump.deserialize;
	var ActiveProperty = rt.ActiveProperty;
	var Disposable = rt.Disposable;

	/**
	 * @class Rift.ViewState
	 * @extends {Rift.Disposable}
	 *
	 * @param {Object} props
	 */
	var ViewState = Disposable.extend('Rift.ViewState', /** @lends Rift.ViewState# */{
		/**
		 * @type {Array<string>}
		 */
		properties: null,

		constructor: function(props) {
			Disposable.call(this);

			this.properties = Object.keys(props);

			for (var name in props) {
				var prop = (typeof props[name] == 'function' ? props[name] : new ActiveProperty(props[name]))
					.bind(this);

				Object.defineProperty(prop, 'constructor', {
					configurable: true,
					writable: true,
					value: ActiveProperty
				});

				this[name] = prop;
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
