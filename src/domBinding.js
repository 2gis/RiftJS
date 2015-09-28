var cellx = require('cellx');

var Cell = cellx.Cell;

var KEY_DATA_CELLS = '__rt_dataCells__';
if (global.Symbol && typeof Symbol.iterator == 'symbol') {
	KEY_DATA_CELLS = Symbol(KEY_DATA_CELLS);
}

exports.KEY_DATA_CELLS = KEY_DATA_CELLS;

var directiveHandlers = {
	prop: function(el, value, name) {
		if (el[name] !== value) {
			el[name] = value;
		}
	},

	attr: function(el, value, name) {
		if (value != null && value !== false) {
			if (value === true) {
				value = name;
			} else {
				value = value.toString();
			}

			if (el.getAttribute(name) !== value) {
				el.setAttribute(name, value);
			}
		} else {
			if (el.hasAttribute(name)) {
				el.removeAttribute(name);
			}
		}
	},

	value: function(el, value) {
		value = String(value);

		if (el.value != value) {
			el.value = value;
		}
	},

	checked: function(el, value) {
		value = !!value;

		if (el.checked != value) {
			el.checked = value;
		}
	},

	disabled: function(el, value) {
		if (el.disabled != !!value) {
			el.disabled = !!value;
		}
	},

	class: function(el, value, name) {
		$(el).toggleClass(name, !!value);
	},

	mod: function(el, value, name) {
		var mods = {};
		mods[name] = !!value;
		$(el).mods(mods);
	},

	show: function(el, value) {
		value = value ? '' : 'none';

		if (el.style.display != value) {
			el.style.display = value;
		}
	},

	html: function(el, value) {
		el.innerHTML = value;
	},

	text: function(el, value, target) {
		value = String(value);

		var node;

		switch (target) {
			case 'first': {
				node = el.firstChild;

				if (!node || node.nodeType != 3) {
					el.insertBefore(document.createTextNode(value), node);
					return;
				}

				break;
			}
			case 'last': {
				node = el.lastChild;

				if (!node || node.nodeType != 3) {
					el.appendChild(document.createTextNode(value));
					return;
				}

				break;
			}
			case 'prev': {
				node = el.previousSibling;

				if (!node || node.nodeType != 3) {
					el.parentNode.insertBefore(document.createTextNode(value), el);
					return;
				}

				break;
			}
			case 'next': {
				node = el.nextSibling;

				if (!node || node.nodeType != 3) {
					el.parentNode.insertBefore(document.createTextNode(value), node);
					return;
				}

				break;
			}
			default: {
				if (el.childNodes.length == 1 && el.firstChild.nodeType == 3) {
					node = el.firstChild;
				} else {
					while (el.lastChild) {
						el.removeChild(el.lastChild);
					}

					el.appendChild(document.createTextNode(value));

					return;
				}

				break;
			}
		}

		if (node.nodeValue != value) {
			node.nodeValue = value;
		}
	}
};

exports.directiveHandlers = directiveHandlers;

var reName = Object.keys(directiveHandlers).join('|');
var reDirective = RegExp(
	'\\s*(' + reName + ')(?:\\(([^)]*)\\))?:\\s*(\\S[\\s\\S]*?)(?=\\s*(?:,\\s*(?:' + reName +
		')(?:\\([^)]*\\))?:\\s*\\S|$))',
	'g'
);

/**
 * @typesign (
 *     el: HTMLElement,
 *     context: Object,
 *     opts?: { applyValues: boolean = true }
 * );
 */
function bindElement(el, context, opts) {
	if (el.hasOwnProperty(KEY_DATA_CELLS) && el[KEY_DATA_CELLS]) {
		return;
	}

	var applyValues = !opts || opts.applyValues !== false;
	var directives = el.getAttribute('rt-bind');
	var cells = el[KEY_DATA_CELLS] = [];

	reDirective.lastIndex = 0;

	for (var directive; directive = reDirective.exec(directives);) {
		(function(name, meta, expr) {
			var cell = new Cell(Function('var _ = this; return ' + expr + ';').bind(context), {
				onchange: function() {
					directiveHandlers[name](el, this.get(), meta);
				}
			});

			cells.push(cell);

			if (applyValues) {
				directiveHandlers[name](el, cell.get(), meta);
			}
		})(directive[1], directive[2], directive[3]);
	}

	el.removeAttribute('rt-bind');
	el.setAttribute('rt-binding', directives);
}

/**
 * @typesign (el: HTMLElement);
 */
function unbindElement(el) {
	if (!el.hasOwnProperty(KEY_DATA_CELLS)) {
		return;
	}

	var cells = el[KEY_DATA_CELLS];

	if (!cells) {
		return;
	}

	for (var i = cells.length; i;) {
		cells[--i].dispose();
	}

	el[KEY_DATA_CELLS] = null;

	el.setAttribute('rt-bind', el.getAttribute('rt-binding'));
	el.removeAttribute('rt-binding');
}

/**
 * @typesign (
 *     el: HTMLElement,
 *     opts?: { bindRootElement: boolean = true, applyValues: boolean = true }
 * ): HTMLElement;
 */
function bindDOM(el, context, opts) {
	if (!opts) {
		opts = {};
	}

	var applyValues = opts.applyValues;

	if (opts.bindRootElement !== false && el.hasAttribute('rt-bind')) {
		bindElement(el, context, { applyValues: applyValues });
	}

	var els = el.querySelectorAll('[rt-bind]');

	for (var i = els.length; i;) {
		bindElement(els[--i], context, { applyValues: applyValues });
	}

	return el;
}

exports.bind = bindDOM;

/**
 * @typesign (
 *     el: HTMLElement,
 *     opts?: { bindRootElement: boolean = true }
 * ): HTMLElement;
 */
function unbindDOM(el, opts) {
	if ((!opts || opts.bindRootElement !== false) && el.hasAttribute('rt-binding')) {
		unbindElement(el);
	}

	var els = el.querySelectorAll('[rt-binding]');

	for (var i = els.length; i;) {
		unbindElement(els[--i]);
	}

	return el;
}

exports.unbind = unbindDOM;
