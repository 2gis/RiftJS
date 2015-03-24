(function() {

	var getUID = _.object.getUID;
	var createNamespace = _.namespace.create;
	var forEachMatch = _.regex.forEach;
	var DataCell = _.DataCell;

	/**
	 * @namespace Rift.domBinding.helpers
	 */
	var helpers = {
		html: function(el, value) {
			el.innerHTML = value;
		},

		text: function(el, value, targetNode) {
			switch (targetNode) {
				case 'first': {
					var node = el.firstChild;

					if (node && node.nodeType == 3) {
						node.nodeValue = value;
					} else {
						el.insertBefore(document.createTextNode(value), node);
					}

					break;
				}
				case 'last': {
					var node = el.lastChild;

					if (node && node.nodeType == 3) {
						node.nodeValue = value;
					} else {
						el.appendChild(document.createTextNode(value));
					}

					break;
				}
				case 'prev': {
					var node = el.previousSibling;

					if (node && node.nodeType == 3) {
						node.nodeValue = value;
					} else {
						el.parentNode.insertBefore(document.createTextNode(value), el);
					}

					break;
				}
				case 'next': {
					var node = el.nextSibling;

					if (node && node.nodeType == 3) {
						node.nodeValue = value;
					} else {
						el.parentNode.insertBefore(document.createTextNode(value), node);
					}

					break;
				}
				default: {
					if (el.childNodes.length == 1 && el.firstChild.nodeType == 3) {
						el.firstChild.nodeValue = value;
					} else {
						while (el.lastChild) {
							el.removeChild(el.lastChild);
						}

						el.appendChild(document.createTextNode(value));
					}

					break;
				}
			}
		},

		prop: function(el, value, id) {
			id = id.split('.');
			var name = id.pop();
			createNamespace(id, el)[name] = value;
		},

		attr: function(el, value, name) {
			el.setAttribute(name, value);
		},

		value: function(el, value) {
			if (el.value != value) {
				el.value = value;
			}
		},

		css: function(el, value, name) {
			el.style[name || 'cssText'] = value;
		},

		show: function(el, value) {
			el.style.display = value ? '' : 'none';
		}
	};

	var reName = '[$_a-zA-Z][$\\w]*';
	var reBindingExpr = RegExp(
		'(' + reName + ')(?:\\(([^)]*)\\))?:\\s*(\\S[\\s\\S]*?)(?=\\s*(?:,\\s*' + reName +
			'(?:\\([^)]*\\))?:\\s*\\S|$))',
		'g'
	);
	var keyDataCells = '_rt-dataCells';

	/**
	 * Привязывает элемент к активным свойствам по атрибуту `rt-bind`.
	 *
	 * @memberOf Rift.domBinding
	 *
	 * @param {HTMLElement} el
	 * @param {Object} context
	 * @param {Object} [opts]
	 * @param {boolean} [opts.applyValues=true]
	 * @returns {Object<Rift.DataCell>}
	 */
	function bindElement(el, context, opts) {
		if (hasOwn.call(el, keyDataCells)) {
			return el[keyDataCells];
		}

		var dcs = el[keyDataCells] = {};

		if (el.hasAttribute('rt-bind')) {
			var applyValues = !opts || opts.applyValues !== false;

			forEachMatch(reBindingExpr, el.getAttribute('rt-bind'), function(match, helper, meta, js) {
				var dc = new DataCell(Function('return ' + js + ';').bind(context), {
					onchange: function() {
						helpers[helper](el, this.value, meta);
					}
				});

				dcs[getUID(dc)] = dc;

				if (applyValues) {
					helpers[helper](el, dc.value, meta);
				}
			});
		}

		return dcs;
	}

	/**
	 * Отвязывает элемент от привязанных к нему активных свойств.
	 *
	 * @memberOf Rift.domBinding
	 *
	 * @param {HTMLElement} el
	 */
	function unbindElement(el) {
		if (hasOwn.call(el, keyDataCells)) {
			var dcs = el[keyDataCells];

			if (dcs) {
				for (var id in dcs) {
					dcs[id].dispose();
				}

				delete el[keyDataCells];
			}
		}
	}

	/**
	 * Привязывает элементы dom-дерева к активным свойствам по атрибуту `rt-bind`.
	 *
	 * @function bind
	 * @memberOf Rift.domBinding
	 *
	 * @param {HTMLElement} el
	 * @param {Object} context
	 * @param {Object} [opts]
	 * @param {boolean} [opts.bindRootElement=true]
	 * @param {boolean} [opts.applyValues=true]
	 * @param {boolean} [opts.removeAttr=false]
	 * @returns {Object<Rift.DataCell>}
	 */
	function bindDOM(el, context, opts) {
		if (!opts) {
			opts = {};
		}

		var removeAttr = opts.removeAttr === true;
		var elementBindingOptions = {
			applyValues: opts.applyValues !== false
		};
		var dcs = {};

		if (opts.bindRootElement !== false && el.hasAttribute('rt-bind')) {
			Object.assign(dcs, bindElement(el, context, elementBindingOptions));

			if (removeAttr) {
				el.removeAttribute('rt-bind');
			}
		}

		var els = el.querySelectorAll('[rt-bind]');

		for (var i = 0, l = els.length; i < l; i++) {
			Object.assign(dcs, bindElement(els[i], context, elementBindingOptions));

			if (removeAttr) {
				el.removeAttribute('rt-bind');
			}
		}

		return dcs;
	}

	/**
	 * @namespace Rift.domBinding
	 */
	_.domBinding = {
		helpers: helpers,
		bindElement: bindElement,
		unbindElement: unbindElement,
		bind: bindDOM
	};

})();
