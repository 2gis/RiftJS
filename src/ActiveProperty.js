(function() {

	var cloneObject = rt.object.clone;
	var DataCell = rt.DataCell;

	/**
	 * Заменяет активные свойства на геттеры, которые при срабатывании будут подставлять в инстанс исходные свойства,
	 * но уже связанные с инстансом.
	 *
	 * @memberOf Rift.ActiveProperty
	 *
	 * @param {Object} obj
	 * @returns {Object}
	 */
	function autoBind(obj) {
		Object.keys(obj).forEach(function(name) {
			var descr = Object.getOwnPropertyDescriptor(obj, name);
			var value = descr.value;

			if (typeof value == 'function' && value.constructor == ActiveProperty) {
				Object.defineProperty(obj, name, {
					configurable: true,
					enumerable: descr.enumerable,

					get: function() {
						descr.value = Object.defineProperty(value.bind(this), 'constructor', {
							configurable: true,
							writable: true,
							value: ActiveProperty
						});

						Object.defineProperty(this, name, descr);

						return this[name];
					}
				});
			}
		});

		return obj;
	}

	/**
	 * @memberOf Rift.ActiveProperty
	 *
	 * @param {Object} obj
	 * @returns {Object}
	 */
	function disposeDataCells(obj) {
		if (obj._dataCells) {
			for (var iterator = obj._dataCells.values(), step; !(step = iterator.next()).done;) {
				step.value.dispose();
			}

			obj._dataCells = null;
		}

		return obj;
	}

	/**
	 * @private
	 */
	function applyProperty(prop, value, opts, args) {
		var dc = (this._dataCells || (this._dataCells = new Map())).get(prop);

		if (!dc) {
			if (value !== null && typeof value == 'object') {
				if (typeof value.clone == 'function') {
					value = value.clone();
				} else if (Array.isArray(value)) {
					value = value.slice(0);
				} else {
					var copy = new value.constructor(value);
					value = copy != value ? copy : cloneObject(value);
				}
			}

			opts = Object.create(opts);
			opts.owner = this;

			dc = new DataCell(value, opts);
			this._dataCells.set(prop, dc);
		}

		switch (args.length) {
			case 0: {
				return dc.value;
			}
			case 1: {
				dc.value = args[0];
				break;
			}
			default: {
				var methodName = args[0];
				args[0] = dc;
				return ActiveProperty.prototype[methodName].apply(this, args);
			}
		}

		return this;
	}

	/**
	 * @class Rift.ActiveProperty
	 * @extends {Function}
	 *
	 * @example
	 * function User() {}
	 *
	 * User.prototype = {
	 *     firstName: new ActiveProperty(''),
	 *     lastName: new ActiveProperty(''),
	 *
	 *     fullName: new ActiveProperty(function() {
	 *         return (this.firstName() + ' ' + this.lastName()).trim();
	 *     }, {
	 *         set: function(fullName) {
	 *             fullName = fullName.split(' ');
	 *
	 *             this.firstName(fullName[0]);
	 *             this.lastName(fullName[1]);
	 *         },
	 *
	 *         onchange: function(evt) {
	 *             console.log('evt.detail.diff: ' + JSON.stringify(evt.detail.diff));
	 *         }
	 *     }),
	 *
	 *     name: new ActiveProperty(function() {
	 *         return this.firstName() || this.lastName();
	 *     }, {
	 *         set: function(firstName) {
	 *             this.firstName(firstName);
	 *         }
	 *     })
	 * };
	 *
	 * var user = new User();
	 *
	 * console.log(user.fullName());
	 * // => ''
	 *
	 * console.log(user.name());
	 * // => ''
	 *
	 * user.firstName('Vasya');
	 * user.lastName('Pupkin');
	 * // => evt.detail.diff: {"value":{"oldValue":"","value":"Vasya Pupkin"}}
	 *
	 * console.log(user.fullName());
	 * // => 'Vasya Pupkin'
	 *
	 * console.log(user.name());
	 * // => 'Vasya'
	 *
	 * @param {*|Function} [value] - Значение или функция для его вычисления.
	 * @param {Object} [opts] - Опции.
	 * @param {Function} [opts.get] - Будет использоваться при получении значения.
	 * @param {Function} [opts.set] - Будет использоваться при установке значения.
	 * @param {Function} [opts.onchange] - Инлайновый обработчик изменения значения.
	 * @param {Function} [opts.onerror] - Инлайновый обработчик ошибки.
	 * @returns {Function}
	 */
	function ActiveProperty(value, opts) {
		if (!opts) {
			opts = {};
		}

		function prop() {
			return applyProperty.call(this, prop, value, opts, arguments);
		}

		Object.defineProperty(prop, 'constructor', {
			configurable: true,
			writable: true,
			value: ActiveProperty
		});

		return prop;
	}

	ActiveProperty.autoBind = autoBind;
	ActiveProperty.disposeDataCells = disposeDataCells;

	Object.assign(ActiveProperty.prototype, /** @lends Rift.ActiveProperty# */{
		/**
		 * @param {Rift.DataCell} dc
		 * @returns {Rift.DataCell}
		 */
		dataCell: function(dc) {
			return dc;
		},

		/**
		 * @param {Rift.DataCell} dc
		 * @param {Function} listener
		 * @param {Object} [context]
		 * @returns {Object}
		 */
		subscribe: function(dc, listener, context) {
			dc.on('change', listener, context || this);
			return this;
		},

		/**
		 * @param {Rift.DataCell} dc
		 * @param {Function} listener
		 * @param {Object} [context]
		 * @returns {Object}
		 */
		unsubscribe: function(dc, listener, context) {
			dc.off('change', listener, context || this);
			return this;
		}
	});

	rt.ActiveProperty = ActiveProperty;

	/**
	 * @memberOf Rift
	 *
	 * @param {Function} value
	 * @param {Object} [opts]
	 */
	rt.observable = function(value, opts) {
		if (typeof value == 'function' && value.constructor == Function) {
			if (!opts) {
				opts = {};
			}

			opts.computable = false;
		}

		return new ActiveProperty(value, opts);
	};

	/**
	 * @memberOf Rift
	 *
	 * @param {Function} formula
	 * @param {Object} [opts]
	 */
	rt.computable = function(formula, opts) {
		if (formula.constructor != Function) {
			if (!opts) {
				opts = {};
			}

			opts.computable = true;
		}

		return new ActiveProperty(formula, opts);
	};

})();
