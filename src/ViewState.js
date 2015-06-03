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
		propertyList: null,

		constructor: function(props) {
			Disposable.call(this);

			this.propertyList = Object.keys(props);

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
			var propList = this.propertyList;
			var data = {};

			for (var i = propList.length; i;) {
				var dc = this[propList[--i]]('dataCell', 0);

				if (!dc.computable) {
					var value = dc.value;

					if (value === Object(value) ? dc.changed : dc.initialValue !== value) {
						data[propList[i]] = serialize({ v: value });
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
			var propList = this.propertyList;
			var oldData = {};

			for (var i = propList.length; i;) {
				oldData[propList[--i]] = this[propList[i]]();
			}

			for (var i = propList.length; i;) {
				var prop = propList[--i];

				if (oldData[prop] === this[prop]()) {
					this[prop](hasOwn.call(data, prop) ? data[prop] : this[prop]('dataCell', 0).initialValue);
				}
			}

			return this;
		}
	});

	rt.ViewState = ViewState;

})();
