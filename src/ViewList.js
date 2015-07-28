(function() {
	var include = rt.template.defaults.include;
	var getViewClass = rt.getViewClass;
	var BaseView = rt.BaseView;

	BaseView.extend('ViewList', {
		tagName: 'ul',

		/**
		 * @override Rift.BaseView#model
		 * @type {Rift.cellx<Array|Rift.ActiveList>}
		 */
		model: null,

		itemViewClass: null,

		getItemParams: null,

		constructor: function(params) {
			BaseView.call(this, params);

			this.itemViewClass = getViewClass(params.itemViewClass);

			if (params.getItemParams) {
				this.getItemParams = params.getItemParams;
			}
		},

		template: function() {
			var model = this.model();

			if (!model) {
				return '';
			}

			var itemViewClass = this.itemViewClass;
			var getItemParams = this.getItemParams;

			return model.map(function(itemModel, index) {
				var params = getItemParams ? getItemParams(itemModel, index, model) : {};

				params.name = 'item';
				params.model = itemModel;
				params.$index = index;

				return '<li class="ViewList_item">' + include.call(this, itemViewClass, params) + '</li>';
			}, this).join('');
		},

		_initClient: function() {
			this.listenTo(this, 'change', { model: this._onModelChange });
		},

		_onModelChange: function() {
			var model = this.model() || [];
			var itemViewClass = this.itemViewClass;
			var getItemParams = this.getItemParams;
			var items = this.children.item || (this.children.item = []);
			var block = this.block[0];

			var currentItemModels = items.map(function(item) {
				return item.model;
			});
			var newItemModels = Array.isArray(model) ? model.slice() : model.toArray();

			newItemModels.forEach(function(itemModel, index) {
				if (itemModel === currentItemModels[index]) {
					return;
				}

				var itemModelIndex = currentItemModels.indexOf(itemModel, index + 1);

				if (itemModelIndex == -1) {
					var params = getItemParams ? getItemParams(itemModel, index, model) : {};

					params.name = 'item';
					params.model = itemModel;
					params.parent = this;
					params.$index = index;

					new itemViewClass(params);

					var item = items.pop();
					var li = document.createElement('li');

					li.className = 'ViewList_item';
					li.appendChild(item.block[0]);

					if (index < items.length) {
						block.insertBefore(li, items[index].block[0].parentNode);
					} else {
						block.appendChild(li);
					}

					items.splice(index, 0, item);
					currentItemModels.splice(index, 0, item.model);

					item.initClient();
				} else {
					block.insertBefore(items[itemModelIndex].block[0].parentNode, items[index].block[0].parentNode);

					items.splice(index, 0, items.splice(itemModelIndex, 1)[0]);
					currentItemModels.splice(index, 0, currentItemModels.splice(itemModelIndex, 1)[0]);
				}
			}, this);

			items.slice(newItemModels.length).forEach(function(item) {
				var li = item.block[0].parentNode;
				li.parentNode.removeChild(li);

				item.dispose();
			});
		}
	});
})();
