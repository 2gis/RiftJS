# Rift.Cleanable

Наследует от [Rift.EventEmitter](https://github.com/2gis/RiftJS/blob/master/docs/EventEmitter.ru.md).  
Автоматизирует очистку памяти при уничтожении инстансов классов. Стандартный подход может выглядеть примерно так:
```js
// псевдокод
function MyModule() {
	// Для сохранения контекста в обработчиках.
	// Делать bind прямо при добавлении обработчиков не получится,
	// т. к. этот обработчик нужно ещё снять и сделать это нужно по его забинденной копии,
	// которую здесь и сохраняем.
	// Таких строк получается по числу добавляемых обработчиков,
	// либо юзаем что-нибудь вроде bindAll (http://habrahabr.ru/post/231411/),
	// который несколько сокращает запись.
	this._onWindowLoad = this._onWindowLoad.bind(this);

	this._timerId = setTimeout(this._onTimerTick.bind(this), 1000); // устанавливаем какой-то таймер
	this._request = sendRequest(this._onRequestComplete.bind(this)); // посылаем какой-то запрос
	this._bindEvents(); // добавляем всяких обработчиков
}

MyModule.prototype._bindEvents = function() {
	window.addEventListener('load', this._onWindowLoad, false);
	// здесь
	// ещё
	// много
	// добавлений
	// обработчиков
};

MyModule.prototype._unbindEvents = function() {
	window.removeEventListener('load', this._onWindowLoad, false);
	// здесь
	// ещё
	// много
	// снятий
	// обработчиков
};

MyModule.prototype._onWindowLoad = function() {
	console.log('_onWindowLoad');
};

MyModule.prototype._onTimerTick = function() {
	console.log('_onTimerTick');
};

MyModule.prototype._onRequestComplete = function() {
	console.log('_onRequestComplete');
};

// очищаем всё, что накопилось
MyModule.prototype.dispose = function() {
	clearTimeout(this._timerId); // а вдруг он ещё не сработал и сработает на убитом инстансе

	// запрос тоже мог ещё не отработать
	if (!this._request.completed) {
		this._request.abort();
	}

	this._unbindEvents(); // ну и обработчики тоже не забываем снять
};

var m = new MyModule();

m.dispose();
```

Постоянное ручное написание `_unbindEvents` и `dispose` для каждого класса быстро утомляет. Пример выше переписанный с использованием класса `Rift.Cleanable` получается заметно проще:

```js
// псевдокод
var MyModule = rt.Cleanable.extend({
	constructor: function() {
		this.setTimeout(this._onTimerTick, 1000); // устанавливаем какой-то таймер
		sendRequest(this.regCallback(this._onRequestComplete)); // посылаем какой-то запрос
		this._bindEvents(); // добавляем всяких обработчиков
	},

	_bindEvents: function() {
		this.listen(window, 'load', this._onWindowLoad);
		// здесь
		// ещё
		// много
		// добавлений
		// обработчиков
	},

	_onWindowLoad: function() {
		console.log('_onWindowLoad');
	},

	_onTimerTick: function() {
		console.log('_onTimerTick');
	},

	_onRequestComplete: function() {
		console.log('_onRequestComplete');
	}
});

var m = new MyModule();

m.dispose();
```

При добавлении таймеров, коллбэков и обработчиков используются не оригинальные методы, а их обёртки (в случае с коллбэками, они просто заворачиваются в `regCallback`), которые где-то запоминают, что они добавили. Далее в унаследованном `dispose` происходит вызов методов типа `cancelAllCallbacks`, `clearAllTimeouts` и т. д., которые по запомненному всё подчищают. Также в `dispose` происходит отвязка всех [активных свойств](https://github.com/2gis/RiftJS/blob/master/docs/ActiveProperty.ru.md) от их зависимостей (у активных свойств для этого тоже есть свой `dispose`). Также рекурсивно очищаются зависимые (дочерние) активные свойства. Никаких проверок на уничтоженность инстанса нигде не делается (очень уж много их делать прийдётся), здесь предполагается, что программист сам не будет какашкой и после вызова `dispose` не будет как-то использовать труп.

Подробнее по каждому методу:

#### Rift.Cleanable#listen

Добавляет обработчик события.
```js
var AuthForm = rt.BaseView.extend('AuthForm', {
	_bindEvents: function() {
		this.listen(this.$('btnSend'), 'click', this._onBtnSendClick);
	}
});

module.exports = AuthForm;
```
Первый аргумент — цель события — может быть инстансом [EventEmitter](https://github.com/2gis/RiftJS/blob/master/docs/EventEmitter.ru.md)-а, dom-элементом, $-коллекцией или массивом. В последних двух случаях `listen` применяется к каждому элементу.

Второй аргумент — тип события.  
Третий — обработчик — может быть массивом из нескольких обработчиков:
```js
this.listen(this.$('btnSend'), 'click', [this._onBtnSendClick, this._onBtnSendClick2]);
```
Возможна запись, при которой вторым аргументом передаётся объект, ключи которого будут типами событий, а значения обработчиками:
```js
this.listen(this.$('btnSend'), {
	dblclick: this._onBtnSendDblClick,
	click: [this._onBtnSendClick, this._onBtnSendClick2]
});
```
На изменение [активного свойства](https://github.com/2gis/RiftJS/blob/master/docs/ActiveProperty.ru.md) можно подписаться так:
```js
this.listen(this.model.viewer.name, 'change', this._onViewerNameChange);
```
Также возможна запись, при которой третьим аргументом передаётся объект, ключи которого будут именами активных свойств, а значения обработчиками. Цель события (первый аргумент) при этом не сами свойства, а содержащий их объект:
```js
this.listen(this.model.viewer, 'change', {
	firstName: this._onViewerFirstNameChange,
	lastName: [this._onViewerLastNameChange, this._onViewerLastNameChange2]
});
```

#### Rift.Cleanable#stopListening

Снимает обработчик события. По аргументам всё то же самое, что и у `listen`. 

#### Rift.Cleanable#stopAllListening

???

#### Rift.Cleanable#regCallback

???

#### Rift.Cleanable#cancelCallback

???

#### Rift.Cleanable#cancelAllCallbacks

???

#### Rift.Cleanable#setTimeout

???

#### Rift.Cleanable#clearTimeout

???

#### Rift.Cleanable#clearAllTimeouts

???

#### Rift.Cleanable#clean

???

#### Rift.Cleanable#dispose

???
