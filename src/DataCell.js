(function() {

	var getUID = rt.object.getUID;
	var nextTick = rt.process.nextTick;
	var Event = rt.Event;
	var EventEmitter = rt.EventEmitter;

	var STATE_CHANGES_ACCUMULATION = 0;
	var STATE_CHANGES_HANDLING = 1;
	var STATE_CHILDREN_RECALCULATION = 2;

	var state = STATE_CHANGES_ACCUMULATION;

	/**
	 * @type {Object<{ dataCell: Rift.DataCell, event: Rift.Event, cancellable: boolean }>}
	 * @private
	 */
	var changes = {};

	var changeCount = 0;

	/**
	 * @private
	 */
	var outdatedDataCells = Object.assign(Object.create(null), {
		first: null,
		last: null
	});

	var circularityDetectionCounter = {};

	/**
	 * @private
	 *
	 * @param {Rift.DataCell} dc
	 * @returns {boolean}
	 */
	function addOutdatedDataCell(dc) {
		var dcBundle = outdatedDataCells.last;
		var maxParentDepth = dc._maxParentDepth;

		if (dcBundle) {
			while (true) {
				if (maxParentDepth == dcBundle.maxParentDepth) {
					var id = getUID(dc);

					if (hasOwn.call(dcBundle.dataCells, id)) {
						return false;
					}

					dcBundle.dataCells[id] = dc;
					dcBundle.count++;

					return true;
				}

				if (maxParentDepth > dcBundle.maxParentDepth) {
					var next = dcBundle.next;

					(dcBundle.next = (next || outdatedDataCells)[next ? 'prev' : 'last'] =
						outdatedDataCells[maxParentDepth] = {
							maxParentDepth: maxParentDepth,
							dataCells: {},
							count: 1,
							prev: dcBundle,
							next: next
						}
					).dataCells[getUID(dc)] = dc;

					return true;
				}

				if (!dcBundle.prev) {
					(dcBundle.prev = outdatedDataCells.first = outdatedDataCells[maxParentDepth] = {
						maxParentDepth: maxParentDepth,
						dataCells: {},
						count: 1,
						prev: null,
						next: dcBundle
					}).dataCells[getUID(dc)] = dc;

					return true;
				}

				dcBundle = dcBundle.prev;
			}
		}

		(outdatedDataCells.first = outdatedDataCells.last = outdatedDataCells[maxParentDepth] = {
			maxParentDepth: maxParentDepth,
			dataCells: {},
			count: 1,
			prev: null,
			next: null
		}).dataCells[getUID(dc)] = dc;

		return true;
	}

	/**
	 * @private
	 *
	 * @param {Rift.DataCell} dc
	 * @returns {boolean}
	 */
	function removeOutdatedDataCell(dc) {
		var dcBundle = outdatedDataCells[dc._maxParentDepth];

		if (dcBundle) {
			var id = getUID(dc);

			if (hasOwn.call(dcBundle.dataCells, id)) {
				if (--dcBundle.count) {
					delete dcBundle.dataCells[id];
				} else {
					var prev = dcBundle.prev;
					var next = dcBundle.next;

					if (prev) {
						prev.next = next;
					} else {
						outdatedDataCells.first = next;
					}

					if (next) {
						next.prev = prev;
					} else {
						outdatedDataCells.last = prev;
					}

					delete outdatedDataCells[dc._maxParentDepth];
				}

				return true;
			}
		}

		return false;
	}

	/**
	 * @private
	 */
	function handleChanges() {
		state = STATE_CHANGES_HANDLING;

		do {
			for (var changeId in changes) {
				var change = changes[changeId];
				var dc = change.dataCell;
				var children = dc._children;

				for (var childId in children) {
					addOutdatedDataCell(children[childId]);
				}

				delete changes[changeId];
				changeCount--;

				dc._fixedValue = dc._value;
				dc._changed = true;

				dc._handleEvent(change.event);

				if (state != STATE_CHANGES_HANDLING) {
					return;
				}
			}
		} while (changeCount);
	}

	/**
	 * @private
	 */
	function releaseChanges() {
		if (state == STATE_CHANGES_ACCUMULATION) {
			if (changeCount) {
				handleChanges();

				if (state != STATE_CHANGES_HANDLING) {
					return;
				}
			} else {
				return;
			}
		} else if (state == STATE_CHANGES_HANDLING) {
			if (changeCount) {
				handleChanges();

				if (state != STATE_CHANGES_HANDLING) {
					return;
				}
			}
		} else {
			handleChanges();

			if (state != STATE_CHANGES_HANDLING) {
				return;
			}
		}

		state = STATE_CHILDREN_RECALCULATION;

		for (var dcBundle; dcBundle = outdatedDataCells.first;) {
			var dcs = dcBundle.dataCells;

			for (var id in dcs) {
				var dc = dcs[id];

				dc._recalc();

				if (state != STATE_CHILDREN_RECALCULATION) {
					return;
				}

				// кажется, что правильней поставить этот if-else над dc._recalc() , но подумай получше ;)
				if (--dcBundle.count) {
					delete dcs[id];
				} else {
					var prev = dcBundle.prev;
					var next = dcBundle.next;

					if (prev) {
						prev.next = next;
					} else {
						outdatedDataCells.first = next;
					}

					if (next) {
						next.prev = prev;
					} else {
						outdatedDataCells.last = prev;
					}

					delete outdatedDataCells[dc._maxParentDepth];
				}

				if (changeCount) {
					handleChanges();

					if (state != STATE_CHANGES_HANDLING) {
						return;
					}

					state = STATE_CHILDREN_RECALCULATION;

					break;
				}
			}
		}

		state = STATE_CHANGES_ACCUMULATION;
		circularityDetectionCounter = {};
	}

	/**
	 * @private
	 *
	 * @param {Rift.DataCell} dc
	 * @param {Object|undefined} diff
	 * @param {Rift.Event|undefined} [evt]
	 * @param {boolean} [cancellable=true]
	 */
	function addChange(dc, diff, evt, cancellable) {
		if (!evt) {
			evt = new Event('change');
			evt.target = dc;
			evt.timestamp = Date.now();

			if (diff) {
				evt.detail = { diff: diff };
			}
		}

		var id = getUID(dc);

		if (changeCount) {
			if (hasOwn.call(changes, id)) {
				var change = changes[id];

				(evt.detail || (evt.detail = {})).prevEvent = change.event;
				change.event = evt;

				if (cancellable === false) {
					change.cancellable = false;
				}

				return;
			}
		} else {
			if (state == STATE_CHANGES_ACCUMULATION) {
				nextTick(releaseChanges);
			}
		}

		changes[id] = {
			dataCell: dc,
			event: evt,
			cancellable: cancellable !== false
		};

		changeCount++;
	}

	var detectedParents = [];

	/**
	 * @class Rift.DataCell
	 * @extends {Rift.EventEmitter}
	 *
	 * @example
	 * var a = new DataCell(1);
	 * var b = new DataCell(2);
	 *
	 * var c = new DateCell(function() {
	 *     return a.value + b.value;
	 * }, {
	 *     onchange: function() {
	 *         console.log('c.value: ' + c.value);
	 *     }
	 * });
	 *
	 * console.log(c.value);
	 * // => 3
	 *
	 * a.value = 5;
	 * b.value = 10;
	 * // => 'c.value: 15'
	 *
	 * @param {*|Function} [value] - Значение или функция для его вычисления.
	 * @param {Object} [opts] - Опции.
	 * @param {Function} [opts.get] - Будет использоваться при получении значения.
	 * @param {Function} [opts.set] - Будет использоваться при установке значения.
	 * @param {Object} [opts.owner]
	 * @param {boolean} [opts.computable]
	 * @param {Function} [opts.onchange] - Инлайновый обработчик изменения значения.
	 * @param {Function} [opts.onerror] - Инлайновый обработчик ошибки.
	 */
	var DataCell = EventEmitter.extend(/** @lends Rift.DataCell# */{
		/**
		 * @type {*}
		 */
		initialValue: undef,

		_value: undef,
		_fixedValue: undef,

		_formula: null,

		_get: null,
		_set: null,

		/**
		 * @type {?Object}
		 */
		owner: null,

		/**
		 * Родительские ячейки.
		 *
		 * @type {Object<Rift.DataCell>}
		 * @protected
		 */
		_parents: null,

		/**
		 * Дочерние ячейки.
		 *
		 * @type {Object<Rift.DataCell>}
		 * @protected
		 */
		_children: null,

		/**
		 * @type {int}
		 * @protected
		 */
		_maxParentDepth: 0,

		/**
		 * @type {?Rift.Event}
		 * @protected
		 */
		_lastErrorEvent: null,

		/**
		 * Является ли ячейка вычисляемой.
		 *
		 * @type {boolean}
		 */
		computable: false,

		_changed: false,

		/**
		 * @type {boolean}
		 */
		get changed() {
			if (changeCount) {
				releaseChanges();
			}

			return this._changed;
		},

		/**
		 * @type {boolean}
		 */
		disposed: false,

		_onChange: null,

		/**
		 * Инлайновый обработчик изменения значения.
		 *
		 * @type {?Function}
		 * @writable
		 */
		get onchange() {
			return this._onChange;
		},
		set onchange(onChange) {
			if (changeCount) {
				releaseChanges();
			}

			this._onChange = onChange;
		},

		_onError: null,

		/**
		 * Инлайновый обработчик ошибки.
		 *
		 * @type {?Function}
		 * @writable
		 */
		get onerror() {
			return this._onError;
		},
		set onerror(onError) {
			if (changeCount) {
				releaseChanges();
			}

			this._onError = onError;
		},

		constructor: function(value, opts) {
			EventEmitter.call(this);

			if (!opts) {
				opts = {};
			}

			if (opts.get) { this._get = opts.get; }
			if (opts.set) { this._set = opts.set; }

			if (opts.owner) { this.owner = opts.owner; }

			if (opts.onchange) {
				this._onChange = this.owner ? opts.onchange.bind(this.owner) : opts.onchange;
			}
			if (opts.onerror) {
				this._onError = this.owner ? opts.onerror.bind(this.owner) : opts.onerror;
			}

			this._children = {};

			if (
				typeof value == 'function' &&
					(opts.computable !== undef ? opts.computable : value.constructor == Function)
			) {
				this.computable = true;
			}

			if (this.computable) {
				this._formula = value;

				detectedParents.unshift({});

				try {
					this._value = this._fixedValue = this._formula.call(this.owner || this);
				} catch (err) {
					this._handleError(err);
				}

				var parents = this._parents = detectedParents.shift();
				var maxParentDepth = 1;

				for (var id in parents) {
					var parent = parents[id];

					parent._children[getUID(this)] = this;

					if (maxParentDepth <= parent._maxParentDepth) {
						maxParentDepth = parent._maxParentDepth + 1;
					}
				}

				this._maxParentDepth = maxParentDepth;
			} else {
				this.initialValue = this._value = this._fixedValue = value;

				if (value instanceof EventEmitter) {
					value.on('change', this._onValueChange, this);
				}
			}
		},

		/**
		 * @type {*}
		 * @writable
		 */
		get value() {
			if (detectedParents.length) {
				detectedParents[0][getUID(this)] = this;
			}

			if (changeCount || state == STATE_CHANGES_HANDLING) {
				releaseChanges();
			}

			if (this._get) {
				return this.computable ? this._get.call(this.owner || this, this._value) : this._get(this._value);
			}

			return this._value;
		},
		set value(value) {
			if (this.computable) {
				if (!this._set) {
					throw new TypeError('Cannot write to read-only dataСell');
				}

				this._set.call(this.owner || this, value);
			} else {
				var oldValue = this._value;

				if (this._set) {
					var change = {};

					if (oldValue instanceof EventEmitter) {
						oldValue.off('change', this._onValueChange, this);
					}

					this._set(value, change);

					value = this._value;

					if (value instanceof EventEmitter) {
						value.on('change', this._onValueChange, this);
					}

					if (!svz(oldValue, value)) {
						change.type = 'update';
						change.oldValue = oldValue;
						change.value = value;

						addChange(this, { value: change });
					} else {
						if (!isEmpty(change)) {
							addChange(this, { value: change }, undef, value !== this._fixedValue);
						}
					}
				} else {
					if (!svz(oldValue, value)) {
						this._value = value;

						if (svz(value, this._fixedValue)) {
							var id = getUID(this);

							if (changes[id].cancellable) {
								delete changes[id];
								changeCount--;

								return;
							}
						}

						if (oldValue instanceof EventEmitter) {
							oldValue.off('change', this._onValueChange, this);
						}
						if (value instanceof EventEmitter) {
							value.on('change', this._onValueChange, this);
						}

						addChange(this, {
							value: {
								type: 'update',
								oldValue: oldValue,
								value: value
							}
						});
					}
				}
			}
		},

		/**
		 * Обработчик внутреннего изменения значения.
		 *
		 * @protected
		 *
		 * @param {Rift.Event} evt
		 * @param {Object} [evt.detail.diff]
		 */
		_onValueChange: function(evt) {
			addChange(this, undef, evt, this._value !== this._fixedValue);
		},

		/**
		 * @protected
		 */
		_recalc: function() {
			var id = getUID(this);

			if (hasOwn.call(circularityDetectionCounter, id)) {
				if (++circularityDetectionCounter[id] == 10) {
					this._handleError(new RangeError('Circular dependency detected'));
					return;
				}
			} else {
				circularityDetectionCounter[id] = 1;
			}

			var oldValue = this._value;
			var oldParents = this._parents;

			var err;

			detectedParents.unshift({});

			try {
				var value = this._formula.call(this.owner || this);
			} catch (error) {
				err = error;
			}

			if (state != STATE_CHILDREN_RECALCULATION) {
				detectedParents.shift();
				return;
			}

			var parents = this._parents = detectedParents.shift();
			var maxParentDepth = 1;

			for (var parentId in oldParents) {
				if (!hasOwn.call(parents, parentId)) {
					delete oldParents[parentId]._children[id];
				}
			}

			for (var parentId in parents) {
				var parent = parents[parentId];

				if (!hasOwn.call(oldParents, parentId)) {
					parent._children[id] = this;
				}

				if (maxParentDepth <= parent._maxParentDepth) {
					maxParentDepth = parent._maxParentDepth + 1;
				}
			}

			if (this._maxParentDepth != maxParentDepth) {
				if (this._maxParentDepth < maxParentDepth) {
					this._maxParentDepth = maxParentDepth;
					addOutdatedDataCell(this);

					return;
				} else {
					this._maxParentDepth = maxParentDepth;
				}
			}

			if (err) {
				this._handleError(err);
			} else if (!svz(oldValue, value)) {
				this._value = value;

				addChange(this, {
					value: {
						type: 'update',
						oldValue: oldValue,
						value: value
					}
				});
			}
		},

		/**
		 * @protected
		 *
		 * @param {*} err
		 */
		_handleError: function(err) {
			this._logError(err);

			var evt = this.emit('error', { error: err });
			this._handleErrorEvent(evt);
		},

		/**
		 * @protected
		 *
		 * @param {Rift.Event} evt
		 */
		_handleErrorEvent: function(evt) {
			if (this._lastErrorEvent !== evt) {
				this._lastErrorEvent = evt;

				if (evt.target != this) {
					this._handleEvent(evt);
				}

				var children = this._children;

				for (var id in children) {
					if (evt.isPropagationStopped) {
						break;
					}

					children[id]._handleErrorEvent(evt);
				}
			}
		},

		on: function() {
			if (changeCount) {
				releaseChanges();
			}

			DataCell.$super.on.apply(this, arguments);
		},

		off: function() {
			if (changeCount) {
				releaseChanges();
			}

			DataCell.$super.off.apply(this, arguments);
		},

		/**
		 * Уничтожает ячейку данных освобождая занятые ей ресурсы.
		 */
		dispose: function() {
			if (this.disposed) {
				return;
			}

			var id = getUID(this);

			if (id in changes) {
				delete changes[id];
				changeCount--;
			}

			removeOutdatedDataCell(this);

			if (this.computable) {
				var parents = this._parents;

				for (var parentId in parents) {
					delete parents[parentId]._children[id];
				}
			} else {
				if (this._value instanceof EventEmitter) {
					this._value.off('change', this._onValueChange, this);
				}
			}

			var children = this._children;

			for (var childId in children) {
				children[childId].dispose();
			}

			this.disposed = true;
		}
	});

	rt.DataCell = DataCell;

})();
