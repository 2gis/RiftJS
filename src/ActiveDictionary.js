(function() {

	var EventEmitter = rt.EventEmitter;

	/**
	 * @class Rift.ActiveDictionary
	 * @extends {Rift.EventEmitter}
	 *
	 * @param {?(Object|Rift.ActiveDictionary|undefined)} [data]
	 * @param {Object|boolean} [opts]
	 * @param {boolean} [opts.adoptItemChanges=false]
	 */
	var ActiveDictionary = EventEmitter.extend('Rift.ActiveDictionary', /** @lends Rift.ActiveDictionary# */{
		_data: null,
		_valueCounts: null,

		_adoptItemChanges: false,

		constructor: function(data, opts) {
			EventEmitter.call(this);

			var thisData = new Map();
			var valueCounts = new Map();
			var adoptItemChanges = typeof opts == 'boolean' ? opts : !!opts && opts.adoptItemChanges;

			if (data) {
				if (data instanceof ActiveDictionary) {
					data = data._data;
				}

				for (var name in data) {
					var value = data[name];

					thisData.set(name, value);

					if (valueCounts.has(value)) {
						valueCounts.set(value, valueCounts.get(value) + 1);
					} else {
						valueCounts.set(value, 1);

						if (adoptItemChanges && value instanceof EventEmitter) {
							value.on('change', this._onItemChange, this);
						}
					}
				}
			}

			this._data = thisData;
			this._valueCounts = valueCounts;

			if (adoptItemChanges) {
				this._adoptItemChanges = true;
			}
		},

		/**
		 * @protected
		 *
		 * @param {Rift.Event} evt
		 */
		_onItemChange: function(evt) {
			this._handleEvent(evt);
		},

		/**
		 * Проверяет, имеет ли словарь запись с указанным именем.
		 *
		 * @param {string} name
		 * @returns {boolean}
		 */
		has: function(name) {
			return this._data.has(name);
		},

		/**
		 * Получает значение записи.
		 *
		 * @param {string} name
		 * @returns {*}
		 */
		get: function(name) {
			return this._data.get(name);
		},

		/**
		 * Устанавлиет значение записи.
		 *
		 * @param {string} name
		 * @param {*} value
		 * @returns {Rift.ActiveDictionary}
		 */
		set: function(name, value) {
			var values;

			if (typeof name == 'string') {
				values = {};
				values[name] = value;
			} else {
				values = name;
			}

			var data = this._data;
			var valueCounts = this._valueCounts;
			var adoptItemChanges = this._adoptItemChanges;
			var changed = false;
			var removedValueSet = new Set();
			var removedValues = [];
			var addedValues = [];
			var diff = {
				$removedValues: removedValues,
				$addedValues: addedValues
			};

			for (name in values) {
				var hasName = data.has(name);
				var oldValue = data.get(name);
				var val = values[name];

				if (!hasName || !svz(oldValue, val)) {
					changed = true;

					if (hasName) {
						var oldValueCount = valueCounts.get(oldValue) - 1;

						if (oldValueCount) {
							valueCounts.set(oldValue, oldValueCount);
						} else {
							valueCounts.delete(oldValue);

							if (adoptItemChanges && oldValue instanceof EventEmitter) {
								oldValue.off('change', this._onItemChange, this);
							}

							removedValueSet.add(oldValue);
						}
					}

					if (valueCounts.has(val)) {
						valueCounts.set(val, valueCounts.get(val) + 1);
					} else {
						valueCounts.set(val, 1);

						if (adoptItemChanges && val instanceof EventEmitter) {
							val.on('change', this._onItemChange, this);
						}

						if (!removedValueSet.delete(val)) {
							addedValues.push(val);
						}
					}

					diff[name] = {
						type: hasName ? 'update' : 'add',
						oldValue: oldValue,
						value: val
					};

					data.set(name, val);
				}
			}

			if (changed) {
				removedValueSet.forEach(function(value) {
					removedValues.push(value);
				});

				this.emit('change', { diff: diff });
			}

			return this;
		},

		/**
		 * Удаляет записи.
		 *
		 * @param {...string} names
		 * @returns {Rift.ActiveDictionary}
		 */
		delete: function() {
			var data = this._data;
			var valueCounts = this._valueCounts;
			var adoptItemChanges = this._adoptItemChanges;
			var changed = false;
			var removedValues = [];
			var diff = {
				$removedValues: removedValues,
				$addedValues: []
			};

			for (var i = 0, l = arguments.length; i < l; i++) {
				var name = arguments[i];

				if (!data.has(name)) {
					continue;
				}

				changed = true;

				var value = data.get(name);
				var valueCount = valueCounts.get(value) - 1;

				if (valueCount) {
					valueCounts.set(value, valueCount);
				} else {
					valueCounts.delete(value);

					if (adoptItemChanges && value instanceof EventEmitter) {
						value.off('change', this._onItemChange, this);
					}

					removedValues.push(value);
				}

				diff[name] = {
					type: 'delete',
					oldValue: value,
					value: undefined
				};

				data.delete(name);
			}

			if (changed) {
				this.emit('change', { diff: diff });
			}

			return this;
		},

		/**
		 * @param {*} value
		 * @returns {boolean}
		 */
		contains: function(value) {
			return this._valueCounts.has(value);
		},

		/**
		 * Создает копию словаря.
		 *
		 * @returns {Rift.ActiveDictionary}
		 */
		clone: function() {
			return new this.constructor(this, { adoptItemChanges: this._adoptItemChanges });
		},

		/**
		 * Преобразует в объект.
		 *
		 * @returns {Object}
		 */
		toObject: function() {
			var obj = {};

			this._data.forEach(function(value, name) {
				obj[name] = value;
			});

			return obj;
		},

		/**
		 * @param {Object} data
		 * @param {Object} opts
		 */
		collectDumpObject: function(data, opts) {
			this._data.forEach(function(value, name) {
				data[name] = value;
			});

			if (this._adoptItemChanges) {
				opts.adoptItemChanges = true;
			}
		},

		/**
		 * @param {Object} data
		 */
		expandFromDumpObject: function(data) {
			this.set(data);
		},

		/**
		 * Уничтожает инстанс освобождая занятые им ресурсы.
		 */
		dispose: function() {
			if (this._adoptItemChanges) {
				var onItemChange = this._onItemChange;

				this._valueCounts.forEach(function(value) {
					if (value instanceof EventEmitter) {
						value.off('change', onItemChange, this);
					}
				}, this);
			}
		}
	});

	rt.ActiveDictionary = ActiveDictionary;

})();
