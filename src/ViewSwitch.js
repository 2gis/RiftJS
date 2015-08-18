var BaseView = require('./BaseView');
var templateRuntime = require('./templateRuntime');

var getViewClass = BaseView.getViewClass;
var include = templateRuntime.defaults.include;

BaseView.extend('ViewSwitch', {
	states: null,
	stateSource: null,

	initialState: undefined,

	_currentState: undefined,

	constructor: function(params) {
		BaseView.call(this, params);

		this.states = params.states;

		if (params.stateSource) {
			this.stateSource = params.stateSource;
		}

		var initialState;

		if (params.initialState) {
			initialState = this.initialState = params.initialState;
		}

		var currentState = initialState || (this.stateSource ? this.stateSource() : undefined);

		if ((!currentState || !this.states[currentState]) && this.states.default) {
			currentState = 'default';
		}

		if (currentState && this.states[currentState]) {
			this._currentState = currentState;
		}
	},

	/**
	 * @type {string|undefined}
	 */
	get currentState() {
		return this._currentState;
	},
	set currentState(newState) {
		if ((!newState || !this.states[newState]) && this.states.default) {
			newState = 'default';
		}

		if (this._currentState === newState) {
			return;
		}

		if (this._currentState) {
			this.children[0].dispose();
		}

		if (newState && this.states[newState]) {
			var state = this.states[newState];
			var params = Object.create(state.viewParams || null);

			params.parent = this;

			var view = new (getViewClass(state.viewClass))(params);
			view.block.appendTo(this.block);
			view.initClient();

			this._currentState = newState;
		} else {
			this._currentState = undefined;
		}
	},

	template: function() {
		var currentState = this._currentState;

		if (currentState && this.states[currentState]) {
			var state = this.states[currentState];
			return include.call(this, state.viewClass, state.viewParams || null);
		}

		return '';
	},

	_initClient: function() {
		if (this.stateSource) {
			this.listenTo(this, 'change', { stateSource: this._onStateSourceChange });
		}
	},

	_onStateSourceChange: function() {
		this.currentState = this.stateSource();
	}
});
