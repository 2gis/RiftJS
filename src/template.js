(function() {

	var nextUID = rt.uid.next;
	var classes = rt.Class.classes;
	var ActiveDictionary = rt.ActiveDictionary;
	var ActiveArray = rt.ActiveArray;
	var pushMods = rt.mods.push;

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
	 * @param {string} viewClass
	 * @param {Object} [opts]
	 * @returns {string}
	 */
	function include(viewClass, opts) {
		if (!hasOwn.call(classes, viewClass)) {
			throw new TypeError('View "' + viewClass + '" is not defined');
		}

		if (opts) {
			opts.parent = this;
			opts.block = null;
		} else {
			opts = { parent: this, block: null };
		}

		var view = this;
		var childRenderings = this._childRenderings;
		var index = childRenderings.count++;
		var mark = childRenderings.marks[index] = '{{_' + nextUID() + '}}';

		new classes[viewClass](opts).render(function(html) {
			childRenderings.results[index] = html;

			if (childRenderings.count == ++childRenderings.readyCount && childRenderings.onready) {
				view._childRenderings = null;
				childRenderings.onready();
			}
		});

		return mark;
	}

	var helpers = {
		/**
		 * @param {string} name
		 * @param {Object} [mods]
		 * @returns {string}
		 */
		el: function(name, mods) {
			var cls = [this.blockName + '_' + name, this._id + '--'];

			if (mods) {
				pushMods(cls, mods);
			}

			return cls.join(' ');
		}
	};

	/**
	 * @namespace Rift.template
	 */
	rt.template = {
		defaults: {
			include: include,
			helpers: helpers,
			each: each
		},

		templates: {}
	};

})();
