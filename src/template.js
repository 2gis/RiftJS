(function() {

	var nextUID = rt.uid.next;
	var ActiveDictionary = rt.ActiveDictionary;
	var ActiveArray = rt.ActiveArray;

	/**
	 * @typesign (viewClass: Function|string, viewParams?: Object): string;
	 */
	function include(viewClass, viewParams) {
		if (typeof viewClass == 'string') {
			viewClass = rt.BaseView.getViewClassOrError(viewClass);
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
		var mark = childRenderings.marks[index] = '{{_' + nextUID() + '}}';

		new viewClass(viewParams).render(function(html) {
			childRenderings.results[index] = html;

			if (childRenderings.count == ++childRenderings.readyCount && childRenderings.onallready) {
				childRenderings.onallready();
			}
		});

		return mark;
	}

	/**
	 * @param {Object|Array|Rift.ActiveDictionary|Rift.ActiveArray} [target]
	 * @param {Function} cb
	 * @param {Object} context
	 */
	function each(target, cb, context) {
		if (!target) {
			return;
		}

		if (target instanceof ActiveDictionary) {
			target = target.toObject();
		} else if (target instanceof ActiveArray) {
			target = target.toArray();
		}

		if (Array.isArray(target)) {
			for (var i = 0, l = target.length; i < l; i++) {
				if (i in target) {
					cb.call(context, target[i], i);
				}
			}
		} else {
			for (var name in target) {
				if (hasOwn.call(target, name)) {
					cb.call(context, target[name], name);
				}
			}
		}
	}

	/**
	 * @namespace Rift.template
	 */
	rt.template = {
		defaults: {
			include: include,
			each: each
		}
	};

})();
