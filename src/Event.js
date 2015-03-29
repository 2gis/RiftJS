(function() {

	/**
	 * @class Rift.Event
	 * @extends {Object}
	 *
	 * @param {string} type - Тип.
	 * @param {boolean} [canBubble=false] - Может ли событие всплывать.
	 */
	function Event(type, canBubble) {
		this.type = type;

		if (canBubble) {
			this.bubbles = true;
		}
	}

	Event.extend = rt.Class.extend;

	Object.assign(Event.prototype, /** @lends Rift.Event# */{
		/**
		 * Объект, к которому применено событие.
		 *
		 * @type {?Object}
		 * @writable
		 */
		target: null,

		/**
		 * @type {int|undefined}
		 * @writable
		 */
		timestamp: undef,

		/**
		 * Тип события.
		 *
		 * @type {string}
		 */
		type: undef,

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

		/**
		 * Дополнительная информация по событию.
		 *
		 * @type {?Object}
		 * @writable
		 */
		detail: null,

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
