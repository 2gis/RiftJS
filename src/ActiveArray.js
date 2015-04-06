(function() {

	var getHash = rt.value.getHash;
	var EventEmitter = rt.EventEmitter;

	var arrayProto = Array.prototype;
	var push = arrayProto.push;
	var unshift = arrayProto.unshift;
	var concat = arrayProto.concat;
	var slice = arrayProto.slice;
	var splice = arrayProto.splice;
	var map = arrayProto.map;
	var reduce = arrayProto.reduce;

	/**
	 * @class Rift.ActiveArray
	 * @extends {Rift.EventEmitter}
	 *
	 * @param {?(Array|Rift.ActiveArray|undefined)} [data]
	 * @param {Object|boolean} [opts]
	 * @param {boolean} [opts.handleItemChanges=false]
	 */
	var ActiveArray = EventEmitter.extend('Rift.ActiveArray', /** @lends Rift.ActiveArray# */{
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
				var inner = this._inner = (data instanceof ActiveArray ? data._inner : data).slice(0);
				var valueCount = this._valueCount;

				for (var i = inner.length; i;) {
					if (--i in inner) {
						var value = inner[i];
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
				}
			} else {
				this._inner = [];
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
		 * Получает значение индекса.
		 *
		 * @param {int} index
		 * @returns {*}
		 */
		get: function(index) {
			return this._inner[index];
		},

		/**
		 * Устанавливает значение индекса.
		 *
		 * @param {int} index
		 * @param {*} value
		 * @returns {Rift.ActiveArray}
		 */
		set: function(index, value) {
			var inner = this._inner;
			var hasIndex = index in inner;
			var oldValue = inner[index];

			if (!hasIndex || !svz(oldValue, value)) {
				var valueCount = this._valueCount;
				var removedValues;
				var addedValues;

				if (hasIndex) {
					var oldValueHash = getHash(oldValue);

					if (!--valueCount[oldValueHash]) {
						delete valueCount[oldValueHash];

						if (this._handleItemChanges && oldValue instanceof EventEmitter) {
							oldValue.off('change', this._onItemChange);
						}

						removedValues = [oldValue];
					}
				}

				var valueHash = getHash(value);

				if (hasOwn.call(valueCount, valueHash)) {
					valueCount[valueHash]++;
				} else {
					valueCount[valueHash] = 1;

					if (this._handleItemChanges && value instanceof EventEmitter) {
						value.on('change', this._onItemChange, this);
					}

					addedValues = [value];
				}

				inner[index] = value;

				this.emit('change', {
					diff: {
						$removedValues: removedValues || [],
						$addedValues: addedValues || []
					}
				});
			}

			return this;
		},

		/**
		 * Удаляет значения индексов.
		 *
		 * @param {...int} indexes
		 * @returns {Rift.ActiveArray}
		 */
		delete: function() {
			var inner = this._inner;
			var valueCount = this._valueCount;
			var handleItemChanges = this._handleItemChanges;
			var changed = false;
			var removedValues = [];

			for (var i = 0, l = arguments.length; i < l; i++) {
				var index = arguments[i];

				if (index in inner) {
					changed = true;

					var value = inner[index];
					var valueHash = getHash(value);

					if (!--valueCount[valueHash]) {
						delete valueCount[valueHash];

						if (handleItemChanges && value instanceof EventEmitter) {
							value.off('change', this._onItemChange);
						}

						removedValues.push(value);
					}

					delete inner[index];
				}
			}

			if (changed) {
				this.emit('change', {
					diff: {
						$removedValues: removedValues,
						$addedValues: []
					}
				});
			}

			return this;
		},

		/**
		 * Длинна массива.
		 *
		 * @type {int}
		 * @writable
		 */
		get length() {
			return this._inner.length;
		},
		set length(len) {
			var inner = this._inner;
			var oldLen = inner.length;

			if (oldLen != len) {
				var changed = false;
				var removedValues = [];

				if (len < oldLen) {
					var valueCount = this._valueCount;
					var handleItemChanges = this._handleItemChanges;
					var i = len;

					do {
						if (i in inner) {
							changed = true;

							var value = inner[i];
							var valueHash = getHash(value);

							if (!--valueCount[valueHash]) {
								delete valueCount[valueHash];

								if (handleItemChanges && value instanceof EventEmitter) {
									value.off('change', this._onItemChange);
								}

								removedValues.push(value);
							}
						}
					} while (++i < oldLen);
				}

				inner.length = len;

				if (changed) {
					this.emit('change', {
						diff: {
							$removedValues: removedValues,
							$addedValues: []
						}
					});
				}
			}
		},

		/**
		 * @param {*} value
		 * @returns {boolean}
		 */
		contains: function(value) {
			return hasOwn.call(this._valueCount, getHash(value));
		},

		/**
		 * @param {*} value
		 * @param {int} [fromIndex=0]
		 * @returns {int}
		 */
		indexOf: function(value, fromIndex) {
			return this._inner.indexOf(value, fromIndex);
		},

		/**
		 * @param {*} value
		 * @param {int} [fromIndex=-1]
		 * @returns {int}
		 */
		lastIndexOf: function(value, fromIndex) {
			return this._inner.lastIndexOf(value, fromIndex);
		},

		/**
		 * Добавляет один или более элементов в конец массива и возвращает новую длину массива.
		 *
		 * @param {...*} values - Элементы, добавляемые в конец массива.
		 * @returns {int}
		 */
		push: function() {
			if (!arguments.length) {
				return this._inner.length;
			}

			push.apply(this._inner, arguments);

			this.emit('change', {
				diff: {
					$removedValues: [],
					$addedValues: this._addValues(arguments)
				}
			});

			return this._inner.length;
		},

		/**
		 * Добавляет один или более элементов в конец массива и возвращает новую длину массива.
		 * Элементы, уже присутствующие в массиве, добавлены не будут. Повторяющиеся элементы, отсутствующие в массиве,
		 * будут добавлены один раз.
		 *
		 * @param {...*} values - Элементы, добавляемые в конец массива.
		 * @returns {int}
		 */
		pushUnique: function() {
			var valueCount = this._valueCount;

			return this.push.apply(this, reduce.call(arguments, function(values, value) {
				if (!hasOwn.call(valueCount, getHash(value)) && values.indexOf(value) == -1) {
					values.push(value);
				}

				return values;
			}, []));
		},

		/**
		 * Удаляет первый элемент из массива и возвращает его значение.
		 *
		 * @returns {*}
		 */
		shift: function() {
			var inner = this._inner;

			if (!inner.length) {
				return;
			}

			if (isEmpty(this._valueCount)) {
				inner.length--;
				return;
			}

			var hasFirst = '0' in inner;
			var value;

			if (hasFirst) {
				value = inner.shift();
			} else {
				inner.length--;
			}

			this.emit('change', {
				diff: {
					$removedValues: hasFirst ? this._removeValue(value) : [],
					$addedValues: []
				}
			});

			return value;
		},

		/**
		 * Добавляет один или более элементов в начало массива и возвращает новую длину массива.
		 *
		 * @example
		 * var arr = [1, 2];
		 *
		 * arr.unshift(0); // 3
		 * concole.log(arr);
		 * // => [0, 1, 2]
		 *
		 * arr.unshift(-2, -1); // 5
		 * concole.log(arr);
		 * // => [-2, -1, 0, 1, 2]
		 *
		 * @param {...*} values - Элементы, добавляемые в начало массива.
		 * @returns {int}
		 */
		unshift: function() {
			if (!arguments.length) {
				return this._inner.length;
			}

			unshift.apply(this._inner, arguments);

			this.emit('change', {
				diff: {
					$removedValues: [],
					$addedValues: this._addValues(arguments)
				}
			});

			return this._inner.length;
		},

		/**
		 * Удаляет последний элемент из массива и возвращает его значение.
		 *
		 * @returns {*}
		 */
		pop: function() {
			var inner = this._inner;

			if (!inner.length) {
				return;
			}

			if (!(inner.length - 1 in inner)) {
				inner.length--;
				return;
			}

			var value = inner.pop();

			this.emit('change', {
				diff: {
					$removedValues: this._removeValue(value),
					$addedValues: []
				}
			});

			return value;
		},

		/**
		 * @protected
		 *
		 * @param {Arguments} values
		 * @returns {Array}
		 */
		_addValues: function(values) {
			var valueCount = this._valueCount;
			var handleItemChanges = this._handleItemChanges;
			var addedValues = [];

			for (var i = 0, l = values.length; i < l; i++) {
				var value = values[i];
				var valueHash = getHash(value);

				if (hasOwn.call(valueCount, valueHash)) {
					valueCount[valueHash]++;
				} else {
					valueCount[valueHash] = 1;

					if (handleItemChanges && value instanceof EventEmitter) {
						value.on('change', this._onItemChange, this);
					}

					addedValues.push(value);
				}
			}

			return addedValues;
		},

		/**
		 * @protected
		 *
		 * @param {*} value
		 * @returns {Array}
		 */
		_removeValue: function(value) {
			var valueHash = getHash(value);

			if (!--this._valueCount[valueHash]) {
				delete this._valueCount[valueHash];

				if (this._handleItemChanges && value instanceof EventEmitter) {
					value.off('change', this._onItemChange);
				}

				return [value];
			}

			return [];
		},

		/**
		 * Объединяет все элементы массива в строку через разделитель.
		 *
		 * @param {string} [separator]
		 * @returns {string}
		 */
		join: function(separator) {
			return this._inner.join(separator);
		},

		/**
		 * @param {...*} values - Массивы и/или значения, соединяемые в новый массив.
		 * @returns {Rift.ActiveArray}
		 */
		concat: function() {
			return new this.constructor(
				concat.apply(this._inner, map.call(arguments, function(value) {
					return value instanceof ActiveArray ? value._inner : value;
				}))
			);
		},

		/**
		 * Создаёт поверхностную копию части массива.
		 *
		 * @param {int} [startIndex=0]
		 * @param {int} [endIndex=this.length]
		 * @returns {Array}
		 */
		slice: function(startIndex, endIndex) {
			return this._inner.slice(startIndex, endIndex);
		},

		/**
		 * Изменяет содержимое массива, добавляя новые и удаляя старые элементы.
		 *
		 * @param {int} startIndex
		 * @param {int} deleteCount
		 * @param {...*} [values]
		 * @returns {Array} - Удалённые элементы.
		 */
		splice: function(startIndex, deleteCount) {
			var inner = this._inner;
			var removedSlice = splice.apply(inner, arguments);
			var addedSlice = slice.call(arguments, 2);
			var removedSliceLen = removedSlice.length;
			var addedSliceLen = addedSlice.length;

			if (!removedSliceLen && !addedSliceLen) {
				return removedSlice;
			}

			var valueCount = this._valueCount;
			var handleItemChanges = this._handleItemChanges;
			var changed = false;
			var removedValueDict = {};
			var addedValues = [];

			for (var i = 0, l = Math.max(removedSliceLen, addedSliceLen); i < l; i++) {
				var iInRemovedSlice = i in removedSlice;
				var iInAddedSlice = i in addedSlice;

				if (!iInRemovedSlice && !iInAddedSlice) {
					continue;
				}

				var removedValue = removedSlice[i];
				var addedValue = addedSlice[i];

				if (!iInRemovedSlice || !iInAddedSlice || !svz(removedValue, addedValue)) {
					changed = true;

					if (iInRemovedSlice) {
						var removedValueHash = getHash(removedValue);

						if (!--valueCount[removedValueHash]) {
							delete valueCount[removedValueHash];

							if (handleItemChanges && removedValue instanceof EventEmitter) {
								removedValue.off('change', this._onItemChange);
							}

							removedValueDict[removedValueHash] = removedValue;
						}
					}

					if (iInAddedSlice) {
						var addedValueHash = getHash(addedValue);

						if (hasOwn.call(valueCount, addedValueHash)) {
							valueCount[addedValueHash]++;
						} else {
							valueCount[addedValueHash] = 1;

							if (handleItemChanges && addedValue instanceof EventEmitter) {
								addedValue.on('change', this._onItemChange, this);
							}

							if (hasOwn.call(removedValueDict, addedValueHash)) {
								delete removedValueDict[addedValueHash];
							} else {
								addedValues.push(addedValue);
							}
						}
					}
				}
			}

			if (!changed && removedSliceLen > addedSliceLen) {
				for (var i = startIndex + addedSliceLen, l = inner.length; i < l; i++) {
					if (i in inner) {
						changed = true;
						break;
					}
				}
			}

			if (changed) {
				var removedValues = [];

				for (var valueHash in removedValueDict) {
					removedValues.push(removedValueDict[valueHash]);
				}

				this.emit('change', {
					diff: {
						$removedValues: removedValues,
						$addedValues: addedValues
					}
				});
			}

			return removedSlice;
		},

		/**
		 * @method
		 *
		 * @param {Function} cb
		 * @param {Object} [context=global]
		 */
		forEach: null,

		/**
		 * @method
		 *
		 * @param {Function} cb
		 * @param {Object} [context=global]
		 * @returns {Array}
		 */
		map: null,

		/**
		 * @method
		 *
		 * @param {Function} cb
		 * @param {Object} [context=global]
		 * @returns {Array}
		 */
		filter: null,

		/**
		 * @method
		 *
		 * @param {Function} cb
		 * @param {Object} [context=global]
		 * @returns {boolean}
		 */
		every: null,

		/**
		 * @method
		 *
		 * @param {Function} cb
		 * @param {Object} [context=global]
		 * @returns {boolean}
		 */
		some: null,

		/**
		 * @method
		 *
		 * @param {Function} cb
		 * @param {*} [initialValue]
		 * @returns {*}
		 */
		reduce: null,

		/**
		 * @method
		 *
		 * @param {Function} cb
		 * @param {*} [initialValue]
		 * @returns {*}
		 */
		reduceRight: null,

		/**
		 * Создает копию массива.
		 *
		 * @returns {Rift.ActiveArray}
		 */
		clone: function() {
			return new this.constructor(this, { handleItemChanges: this._handleItemChanges });
		},

		/**
		 * Преобразует в обычный массив.
		 *
		 * @returns {Array}
		 */
		toArray: function() {
			return this._inner.slice(0);
		},

		/**
		 * Преобразует в строковое представление.
		 *
		 * @returns {string}
		 */
		toString: function() {
			return this._inner.toString();
		},

		/**
		 * @param {Object} data
		 * @param {Object} opts
		 */
		collectDumpObject: function(data, opts) {
			var inner = this._inner;

			for (var i = inner.length; i;) {
				if (--i in inner) {
					data[i] = inner[i];
				}
			}

			if (this._handleItemChanges) {
				opts.handleItemChanges = true;
			}
		},

		/**
		 * @param {Object} data
		 */
		expandFromDumpObject: function(data) {
			for (var index in data) {
				this.set(index, data[index]);
			}
		},

		/**
		 * Уничтожает инстанс освобождая занятые им ресурсы.
		 */
		dispose: function() {
			if (this._handleItemChanges) {
				var inner = this._inner;

				for (var i = inner.length; i;) {
					if (--i in inner && inner[i] instanceof EventEmitter) {
						inner[i].off('change', this._onItemChange);
					}
				}
			}
		}
	});

	['forEach', 'map', 'filter', 'every', 'some', 'reduce', 'reduceRight'].forEach(function(name) {
		this[name] = function() {
			return arrayProto[name].apply(this._inner, arguments);
		};
	}, ActiveArray.prototype);

	rt.ActiveArray = ActiveArray;

})();
