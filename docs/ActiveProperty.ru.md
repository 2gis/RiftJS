# Rift.ActiveProperty

Активное свойство — это обычная функция, которая в замыкании хранит своё значение и является одновременно геттером и сеттером к нему: при вызове без аргументов — возвращает хранимое значение, при вызове с одним аргументом — заменяет хранимое значение на значение переданного аргумента. Чтобы было понятнее, простой пример псевдокодом:
```js
function $value() {
	var value; // хранимое значение

	function _() {
		if (arguments.length == 0) { // если нет аргументов
			return value; // возвращаем хранимое значение
		} else {
			if (value !== arguments[0]) { // чтобы не эмиттить изменение лишний раз, когда на самом деле ничего не изменилось
				value = arguments[0]; // устанавливаем новое значение
				_.emit('change'); // и сообщаем о случившемся изменении
			}
		}
	}

	// делаем возвращаемую функцию эмиттером
	Object.assign(_, EventEmitter.prototype);

	return _;
}

var a = $value(1);

console.log(a());
// => 1

a(5);

console.log(a());
// => 5

a.on('change', function() {
	console.log(a());
});

a(10);
// => 10
```

На самом деле всё несколько сложнее и написанное выше относится скорее к геттеру/сеттеру `Rift.DataCell#value`, а активное свойство является легковесной обёрткой над классом `Rift.DataCell`, позволяющей использовать его как свойство. Такое усложнение позволяет объявлять такие свойства в прототипе, а не создавать каждый раз в конструкторе, что, во-первых удобнее в записи, а, во-вторых, в разы уменьшает объёмы съедаемой памяти.

В отличии от примера выше, методы активного свойства не примешиваются к нему, а просто лежат в `Rift.ActiveProperty.prototype` и их вызов происходит когда активное свойство вызывается с более чем одним аргументом (такой подход лучше тем, что в вызываемом методе сохраняется контекст и опять же меньше потребление памяти). При этом первый аргумент используется как имя метода, а остальные передаются как аргументы на прежних позициях. Нулевым аргументом в метод передаётся инстанс `Rift.DataCell`. Например, подписаться на изменения свойства можно так:
```js
function User(name) {
	this.name(name);
}

User.prototype.name = Rift.$prop('');

var user = new User('Димка');

user.name('subscribe', function(evt) {
	console.log(this.name());
	console.log(evt.detail.diff);
});

user.name('Юлька');
// => 'Юлька'
// => { "type: "update", oldValue: "Димка, value: "Юлька" }
```

Вы можете сами создавать методы активных свойств, например, метод `subscribe` реализован в пару строк:
```js
/**
 * @param {Rift.DataCell} dc
 * @param {Function} listener
 * @param {Object} [context]
 * @returns {Object}
 */
Rift.ActiveProperty.prototype.subscribe = function(dc, listener, context) {
	dc.on('change', listener, context || this);
	return this;
};
```

Активные свойство может быть вычисляемым. Для определения вычисляемого свойства нужно при инициализации передать функцию вместо значения. Функция будет формулой по которой будет происходить вычисление собственного значения:
```js
var $prop = Rift.$prop;

var User = Rift.BaseModel.extend('Model.User', {
	firstName: $prop(''),
	lastName: $prop(''),

	fullName: $prop(function() {
		return (this.firstName() + ' ' + this.lastName()).trim();
	}),

	name: $prop(function() {
		return this.firstName() || this.lastName();
	})
});

var user = new User({
	firstName: 'Вася',
	lastName: 'Пупкин'
});

console.log(user.fullName());
// => 'Вася Пупкин'

user.firstName('Петя');

console.log(user.fullName());
// => 'Петя Пупкин'

user.lastName('Дудкин');

console.log(user.fullName());
// => 'Петя Дудкин'
```

Вычисляемое свойство можно научить принимать значения при установке:
```js
var $prop = Rift.$prop;

var User = Rift.BaseModel.extend('Model.User', {
	firstName: $prop(''),
	lastName: $prop(''),

	fullName: $prop(function() {
		return (this.firstName() + ' ' + this.lastName()).trim();
	}, {
		set: function(fullName) {
			fullName = fullName.split(' ');

			if (fullName.length != 2) {
				throw new RangeError('Invalid fullName "' + fullName.join(' ') + '"');
			}

			this.firstName(fullName[0]);
			this.lastName(fullName[1]);
		}
	}),

	name: $prop(function() {
		return this.firstName() || this.lastName();
	}, {
		set: function(name) {
			this.firstName(name);
		}
	})
});

var user = new User({
	fullName: 'Вася Пупкин'
});

console.log(user.fullName());
// => 'Вася Пупкин'

user.fullName('Петя Дудкин');

console.log(user.fullName());
// => 'Петя Дудкин'
```

Вычисляемое активное свойство может быть не постоянно подписано на все свои зависимости, в примере выше свойство `name` будет постоянно подписано на свойство `firstName`, но на свойство `lastName` оно подпишется только когда значение `firstName` перестанет быть пустой строкой, и наоборот, как только `firstName` вновь станет пустой строкой (false, null и т. д.), произойдёт отписка от `lastName`. Другими словами вам не нужно беспокоится о лишних срабатываниях формулы вычисления собственного значения.

При установке [EventEmitter](https://github.com/2gis/RiftJS/blob/master/docs/EventEmitter.ru.md)-а в качестве значения активного свойства, последнее автоматически подписывается на его событие `change` и выдаёт его за своё (по evt.target можно отличить). Таким образом зависимые свойства могут реагировать и на внутренние изменения своих зависимостей. Пример с использованием [Rift.ActiveArray](https://github.com/2gis/RiftJS/blob/master/docs/ActiveArray.ru.md):

```js
var $prop = Rift.$prop;
var $arr = Rift.$arr;

var User = Rift.BaseModel.extend('Model.User', {
	name: $prop(''),
	age: $prop(-1),

	// массив друзей
	friends: $prop(null),

	// массив за кого не посадят
	friends18plus: $prop(function() {
		return this.friends().filter(function(friend) {
			return friend.age() >= 18;
		});
	})
});

var masha = new User({ name: 'Маша', age: 15 });
var katya = new User({ name: 'Катя', age: 23 });

var vasya = new User({
	name: 'Вася',
	friends: $arr([masha, katya])
});

console.log(vasya.friends18plus().length);
// => 1

console.log(vasya.friends18plus()[0].name());
// => 'Катя'

vasya.friends().push(
	new User({ name: 'Юля', age: 17 }),
	new User({ name: 'Марина', age: 25 })
);

console.log(vasya.friends().length);
// => 4

console.log(vasya.friends18plus().length);
// => 2

console.log(vasya.friends18plus()[1].name());
// => 'Марина'
```
