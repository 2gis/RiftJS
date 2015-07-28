(function() {
	var include = rt.template.defaults.include;
	var getViewClass = rt.getViewClass;
	var BaseView = rt.BaseView;

	BaseView.extend('ViewSwitch', {
		_states: null,
		_stateSource: null,

		initialState: undefined,

		_currentState: undefined,

		constructor: function(params) {
			BaseView.call(this, params);

			this._states = params.states;

			if (params.stateSource) {
				this._stateSource = params.stateSource;
			}

			var initialState;

			if (params.initialState) {
				initialState = this.initialState = params.initialState;
			}

			var currentState = initialState || (this._stateSource ? this._stateSource() : undefined);

			if ((!currentState || !this._states[currentState]) && this._states.default) {
				currentState = 'default';
			}

			if (currentState && this._states[currentState]) {
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
			if ((!newState || !this._states[newState]) && this._states.default) {
				newState = 'default';
			}

			if (this._currentState === newState) {
				return;
			}

			if (this._currentState) {
				this.children[0].dispose();
			}

			if (newState && this._states[newState]) {
				var state = this._states[newState];
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

			if (currentState && this._states[currentState]) {
				var state = this._states[currentState];
				return include.call(this, state.viewClass, state.viewParams || null);
			}

			return '';
		},

		_initClient: function() {
			if (this._stateSource) {
				this.listenTo(this, 'change', { _stateSource: this._onStateSourceChange });
			}
		},

		_onStateSourceChange: function() {
			this.currentState = this._stateSource();
		}
	});
})();
