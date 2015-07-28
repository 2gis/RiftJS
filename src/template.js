(function() {
	var nextUID = rt.uid.next;
	var ActiveMap = rt.ActiveMap;
	var ActiveList = rt.ActiveList;
	var getViewClass = rt.getViewClass;

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
	 * @typesign (obj?: Object|Array|Rift.ActiveMap|Rift.ActiveList, cb: (value, key), context: Object);
	 */
	function each(obj, cb, context) {
		if (!obj) {
			return;
		}

		if (obj instanceof ActiveMap) {
			obj = obj.toObject();
		} else if (obj instanceof ActiveList) {
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

	rt.template = {
		defaults: {
			include: include,
			helpers: {},
			each: each
		}
	};
})();
