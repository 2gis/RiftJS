(function() {

	/**
	 * @class Rift.Event
	 * @extends {Object}
	 *
	 * @param {string} type - Тип.
	 * @param {boolean} [canBubble=true] - Может всплывать.
	 */
	var Event = rt.Class.extend(/** @lends Rift.Event# */{
		/**
		 * Объект, к которому применено событие.
		 *
		 * @type {?Object}
		 * @writable
		 */
		target: null,

		/**
		 * Тип события.
		 *
		 * @type {string}
		 */
		type: undefined,

		/**
		 * @type {int|undefined}
		 * @writable
		 */
		timestamp: undefined,

		/**
		 * Дополнительная информация по событию.
		 *
		 * @type {?Object}
		 * @writable
		 */
		detail: null,

		/**
		 * Является ли событие всплывающим.
		 *
		 * @type {boolean}
		 */
		bubbles: true,

		/**
		 * Распространение события на другие объекты остановлено.
		 *
		 * @type {boolean}
		 */
		isPropagationStopped: false,

		/**
		 * Распространение события на другие объекты и его обработка на текущем остановлены.
		 *
		 * @type {boolean}
		 */
		isImmediatePropagationStopped: false,

		constructor: function(type, canBubble) {
			this.type = type;

			if (canBubble === false) {
				this.bubbles = false;
			}
		},

		/**
		 * Останавливает распространение события на другие объекты.
		 */
		stopPropagation: function() {
			this.isPropagationStopped = true;
		},

		/**
		 * Останавливает распространение события на другие объекты, а также его обработку на текущем.
		 */
		stopImmediatePropagation: function() {
			this.isPropagationStopped = true;
			this.isImmediatePropagationStopped = true;
		}
	});

	rt.Event = Event;

})();
