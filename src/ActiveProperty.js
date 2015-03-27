(function() {

	var getUID = _.object.getUID;
	var cloneObject = _.object.clone;
	var DataCell = _.DataCell;

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
				var origDescr = descr;

				descr = {
					configurable: true,
					enumerable: origDescr.enumerable,

					get: function() {
						origDescr.value = Object.defineProperty(value.bind(this), 'constructor', {
							configurable: true,
							writable: true,
							value: ActiveProperty
						});

						Object.defineProperty(this, name, origDescr);

						return this[name];
					}
				};

				Object.defineProperty(obj, name, descr);
			}
		});

		return obj;
	}

	/**
	 * Уничтожает активные свойства инстанса.
	 *
	 * @memberOf Rift.ActiveProperty
	 *
	 * @param {Object} inst
	 */
	function disposeDataCells(inst) {
		var dcs = inst._dataCells;

		if (dcs) {
			for (var id in dcs) {
				dcs[id].dispose();
			}

			inst._dataCells = null;
		}
	}

	/**
	 * @private
	 */
	function exec(prop, id, initialValue, opts, args) {
		var dc = (this._dataCells || (this._dataCells = {}))[id];

		if (!dc) {
			if (typeof initialValue == 'function') {
				initialValue = initialValue.bind(this);
			} else if (initialValue === Object(initialValue)) {
				if (typeof initialValue.clone == 'function') {
					initialValue = initialValue.clone();
				} else if (Array.isArray(initialValue)) {
					initialValue = initialValue.slice(0);
				} else {
					var copy = new initialValue.constructor(initialValue);
					initialValue = copy != initialValue ? copy : cloneObject(initialValue);
				}
			}

			if (opts) {
				var owner = this;

				opts = ['get', 'set', 'onchange', 'onerror'].reduce(function(options, name) {
					if (opts[name]) {
						options[name] = opts[name].bind(owner);
					}

					return options;
				}, {});
			}

			dc = this._dataCells[id] = new DataCell(initialValue, opts);
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
	 * @returns {Function}
	 */
	function ActiveProperty(value, opts) {
		function prop() {
			return exec.call(this, prop, id, value, opts, arguments);
		}

		var id = getUID(prop);

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

	_.ActiveProperty = ActiveProperty;

	_.$prop = function(value, opts) {
		return new ActiveProperty(value, opts);
	};

})();
