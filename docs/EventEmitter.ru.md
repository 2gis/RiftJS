# Rift.EventEmitter

Почти простейшая реализация EventEmitter-а. Из отличительных особенностей:

1. Кроме основных обработчиков запускает инлайновый (при наличии):

```js
var User = Rift.EventEmitter.extend({});

var user = new User();

user.onchange = function(evt) {
	console.log('inline listener', evt.detail.value);
};

user.on('change', function(evt) {
	console.log('simple listener', evt.detail.value);
});

user.emit('change', { value: 1 });
// => 'simple listener' 1
// => 'inline listener' 1
```

Инлайновый обработчик всегда запускается после основных.

2. После вызова собственных обработчиков, передаёт дальнейшую обработку по ссылке `parent`, которая должна быть либо `null`, либо другим EventEmitter-ом. Получается что-то вроде всплытия события. Эта особенность активно используется в [Rift.BaseView](https://github.com/2gis/RiftJS/blob/master/docs/BaseView.ru.md)

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

3. При установке свойства `silent` в `true`, пропускает вызов своих обработчиков, но как обычно передаёт дальнейшую обработку по ссылке `parent`. Пример:

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
