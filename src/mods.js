(function() {

	/**
	 * @function push
	 * @memberOf Rift.mods
	 *
	 * @param {Array<string>} cls
	 * @param {Object} mods
	 * @returns {Array<string>}
	 */
	function pushMods(cls, mods) {
		for (var name in mods) {
			var value = mods[name];

			if (value != null && value !== false) {
				cls.push('__' + name + (value === true ? '' : '_' + value));
			}
		}

		return cls;
	}

	/**
	 * @namespace Rift.mods
	 */
	_.mods = {
		push: pushMods
	};

})();
