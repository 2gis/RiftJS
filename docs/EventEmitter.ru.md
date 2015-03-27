# Rift.EventEmitter

Почти простейшая реализация EventEmitter-а. Из отличительных особенностей:

* Кроме основных обработчиков запускает инлайновый (при наличии):

```js
var User = Rift.EventEmitter.extend({});

var user = new User();

user.onchange = function() {
	console.log('inline listener');
};

user.on('change', function() {
	console.log('simple listener');
});

user.emit('change');
// => 'simple listener'
// => 'inline listener'
```

Инлайновый обработчик всегда запускается после основных.

* После вызова собственных обработчиков, передаёт дальнейшую обработку по ссылке `parent`, которая должна быть либо `null`, либо другим EventEmitter-ом. Получается что-то вроде всплытия события. Эта особенность активно используется в [Rift.BaseView](https://github.com/2gis/RiftJS/blob/master/docs/BaseView.ru.md)

Пример:

```js
var View = Rift.EventEmitter.extend({});

var parent = new View();
var child = new View();

child.parent = parent;

parent.on('change', function(evt) {
	console.log('parent', evt.target == child);
});

child.on('change', function(evt) {
	console.log('child', evt.target == child);
});

child.emit('change');
// => 'child' true
// => 'parent' true
```

* При установке свойства `silent` в `true`, пропускает вызов своих обработчиков, но как обычно передаёт дальнейшую обработку по ссылке `parent`. Пример:

```js
var View = Rift.EventEmitter.extend({});

var parent = new View();
var child = new View();

child.parent = parent;

parent.on('change', function(evt) {
	console.log('parent');
});

child.on('change', function(evt) {
	console.log('child');
});

parent.silent = true;
child.silent = true;

child.emit('change');
// => 'parent'
```

Передача данных в обработчики делается через `evt.detail`:

```js
var User = Rift.EventEmitter.extend({});

var user = new User();

user.onchange = function(evt) {
	console.log(evt.detail.value);
};

user.emit('change', { value: 1 });
// => 1
```
