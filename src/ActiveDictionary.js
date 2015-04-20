(function() {

	var getHash = rt.value.getHash;
	var EventEmitter = rt.EventEmitter;

	/**
	 * @class Rift.ActiveDictionary
	 * @extends {Rift.EventEmitter}
	 *
	 * @param {?(Object|Rift.ActiveDictionary|undefined)} [data]
	 * @param {Object|boolean} [opts]
	 * @param {boolean} [opts.handleItemChanges=false]
	 */
	var ActiveDictionary = EventEmitter.extend('Rift.ActiveDictionary', /** @lends Rift.ActiveDictionary# */{
		_inner: null,
		_valueCount: null,

		_handleItemChanges: false,

		constructor: function(data, opts) {
			EventEmitter.call(this);

			this._valueCount = {};

			if (typeof opts == 'boolean') {
				opts = { handleItemChanges: opts };
			} else if (!opts) {
				opts = {};
			}

			var handleItemChanges = opts.handleItemChanges === true;

			if (handleItemChanges) {
				this._handleItemChanges = true;
			}

			if (data) {
				var inner = this._inner = Object.assign(
					Object.create(null),
					data instanceof ActiveDictionary ? data._inner : data
				);
				var valueCount = this._valueCount;

				for (var name in inner) {
					var value = inner[name];
					var valueHash = getHash(value);

					if (hasOwn.call(valueCount, valueHash)) {
						valueCount[valueHash]++;
					} else {
						valueCount[valueHash] = 1;

						if (handleItemChanges && value instanceof EventEmitter) {
							value.on('change', this._onItemChange, this);
						}
					}
				}
			} else {
				this._inner = {};
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
			return name in this._inner;
		},

		/**
		 * Получает значение записи.
		 *
		 * @param {string} name
		 * @returns {*}
		 */
		get: function(name) {
			return this._inner[name];
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

			var inner = this._inner;
			var valueCount = this._valueCount;
			var handleItemChanges = this._handleItemChanges;
			var changed = false;
			var removedValueDict = {};
			var removedValues = [];
			var addedValues = [];
			var diff = {
				$removedValues: removedValues,
				$addedValues: addedValues
			};

			for (name in values) {
				var hasName = name in inner;
				var oldValue = inner[name];
				var val = values[name];

				if (!hasName || !svz(oldValue, val)) {
					changed = true;

					if (hasName) {
						var oldValueHash = getHash(oldValue);

						if (!--valueCount[oldValueHash]) {
							delete valueCount[oldValueHash];

							if (handleItemChanges && oldValue instanceof EventEmitter) {
								oldValue.off('change', this._onItemChange);
							}

							removedValueDict[oldValueHash] = oldValue;
						}
					}

					var valueHash = getHash(val);

					if (hasOwn.call(valueCount, valueHash)) {
						valueCount[valueHash]++;
					} else {
						valueCount[valueHash] = 1;

						if (handleItemChanges && val instanceof EventEmitter) {
							val.on('change', this._onItemChange, this);
						}

						if (hasOwn.call(removedValueDict, valueHash)) {
							delete removedValueDict[valueHash];
						} else {
							addedValues.push(val);
						}
					}

					diff[name] = {
						type: hasName ? 'update' : 'add',
						oldValue: oldValue,
						value: val
					};

					inner[name] = val;
				}
			}

			if (changed) {
				for (var valueHash in removedValueDict) {
					removedValues.push(removedValueDict[valueHash]);
				}

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
			var inner = this._inner;
			var valueCount = this._valueCount;
			var handleItemChanges = this._handleItemChanges;
			var changed = false;
			var removedValues = [];
			var diff = {
				$removedValues: removedValues,
				$addedValues: []
			};

			for (var i = 0, l = arguments.length; i < l; i++) {
				var name = arguments[i];

				if (name in inner) {
					changed = true;

					var value = inner[name];
					var valueHash = getHash(value);

					if (!--valueCount[valueHash]) {
						delete valueCount[valueHash];

						if (handleItemChanges && value instanceof EventEmitter) {
							value.off('change', this._onItemChange);
						}

						removedValues.push(value);
					}

					diff[name] = {
						type: 'delete',
						oldValue: value,
						value: undef
					};

					delete inner[name];
				}
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
			return hasOwn.call(this._valueCount, getHash(value));
		},

		/**
		 * Создает копию словаря.
		 *
		 * @returns {Rift.ActiveDictionary}
		 */
		clone: function() {
			return new this.constructor(this, { handleItemChanges: this._handleItemChanges });
		},

		/**
		 * Преобразует в объект.
		 *
		 * @returns {Object}
		 */
		toObject: function() {
			return Object.assign({}, this._inner);
		},

		/**
		 * @param {Object} data
		 * @param {Object} opts
		 */
		collectDumpObject: function(data, opts) {
			var inner = this._inner;

			for (var name in inner) {
				data[name] = inner[name];
			}

			if (this._handleItemChanges) {
				opts.handleItemChanges = true;
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
			if (this._handleItemChanges) {
				var inner = this._inner;

				for (var name in inner) {
					if (inner[name] instanceof EventEmitter) {
						inner[name].off('change', this._onItemChange);
					}
				}
			}
		}
	});

	rt.ActiveDictionary = ActiveDictionary;

})();
