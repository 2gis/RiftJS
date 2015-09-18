var cellx = require('cellx');
var uid = require('./uid');
var BaseView = require('./BaseView');

var ObservableMap = cellx.ObservableMap;
var ObservableList = cellx.ObservableList;
var nextUID = uid.next;
var getViewClass = BaseView.getViewClass;

var hasOwn = Object.prototype.hasOwnProperty;

/**
 * @typesign (viewClass: Function|string, viewParams?: Object): string;
 */
function include(viewClass, viewParams) {
	if (typeof viewClass == 'string') {
		viewClass = getViewClass(viewClass);
	}

	if (viewParams) {
		viewParams.parent = this;
		viewParams.block = null;
	} else {
		viewParams = {
			parent: this,
			block: null
		};
	}

	var childRenderings = this._childRenderings;
	var index = childRenderings.count++;
	var childTrace = childRenderings.childTraces[index] = '{{' + nextUID() + '}}';

	new viewClass(viewParams).render(function(html) {
		childRenderings.results[index] = html;

		if (childRenderings.count == ++childRenderings.readyCount && childRenderings.onallready) {
			childRenderings.onallready();
		}
	});

	return childTrace;
}

/**
 * @typesign (obj?: Object|Array|Rift.ObservableMap|Rift.ObservableList, cb: (value, key), context: Object);
 */
function each(obj, cb, context) {
	if (!obj) {
		return;
	}

	if (obj instanceof ObservableMap) {
		obj = obj.toObject();
	} else if (obj instanceof ObservableList) {
		obj = obj.toArray();
	}

	if (Array.isArray(obj)) {
		for (var i = 0, l = obj.length; i < l; i++) {
			if (i in obj) {
				cb.call(context, obj[i], i);
			}
		}
	} else {
		for (var name in obj) {
			if (hasOwn.call(obj, name)) {
				cb.call(context, obj[name], name);
			}
		}
	}
}

exports.defaults = {
	include: include,
	helpers: {},
	each: each
};
