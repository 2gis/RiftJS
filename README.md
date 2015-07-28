# RiftJS

[![DevDependency Status](https://img.shields.io/david/dev/2gis/RiftJS.svg?style=flat-square)](https://david-dm.org/2gis/RiftJS#info=devDependencies)

RiftJS — js-фреймворк для написания изоморфных приложений со сложной бизнес-логикой и высокосвязными интерфейсами.

Основные фичи:
* удобное разделение на модули с их полной изоляцией;
* развитые способы общения модулей между собой;
* автоматизированная очистка памяти;
* реактивное программирование на всех уровнях с использованием [сверхбыстрого движка](https://github.com/Riim/cellx);
* двунаправленный data-binding;
* роутинг с привязкой к вьюстейту и истории браузера (HTML5 history API);
* изоморфность (честное SEO и быстрая первоначальная загрузка со всеми преимуществати single-page приложения).

## Начало работы

Установите gulp и bower:
```
npm install -g gulp
npm install -g bower
```

Склонируйте заготовку приложения:
```
git clone https://github.com/Riim/BlankApp.git
cd BlankApp
```

Установите модули:
```
npm install
bower install
```

Соберите и запустите приложение:
```
gulp --dev
```

Откройте в браузере `localhost:8090`

## Пишем `Hello, {name}!`

Создадим карточку пользователя, принимающую инстанс пользователя из модели приложения и выводящую приветствие для него.  
Для начала создадим класс пользователя:

Добавьте файл `App/Model/User.js` со следующим содержимым:
```js
import rt from 'riftjs';

export default class User extends rt.BaseModel {
	_initAssets() {
		// имя пользователя
		this.name = rt.cell('');
	}
}

rt.registerClass('User', User);
```

Первый аргумент метода `extend` — имя класса — используется для разных целей, в первую очередь для передачи состояния с сервера на клиент. Имя может быть с пространством имён, например: `'2gis.ProjectName.User'`.  
`rt.observable` — создаёт активное свойство. Подробнее про активные свойства — [Rift.ActiveProperty](https://github.com/2gis/RiftJS/blob/master/docs/ActiveProperty.ru.md).

В файл `App/Model/Model.js` добавьте свойство `viewer` — текущий пользователь приложения. Должно получиться так:
```js
import rt from 'riftjs';

export default class Model extends rt.BaseModel {
	_initAssets() {
		// пользователь приложения
		this.viewer = rt.cell(null);
	}
}

rt.registerClass('Model', Model);
```

Теперь напишем модуль `UserCard` — карточка пользователя:

Добавьте файл `App/View/modules/UserCard/index.js` — класс карточки пользователя. Содержимое файла:
```js
import rt from 'riftjs';

class UserCard extends rt.BaseView {
	//
}

rt.registerClass('UserCard', UserCard);
```

Добавьте файл `App/View/modules/UserCard/index.rtt` — шаблон карточки пользователя. Содержимое файла:
```html
<span>Hello, {model.name}!</span>
```

Соединим всё вместе:

В файле `App/View/modules/App/index.js` наполним модель данными:
```js
import rt from 'riftjs';

import User from '../../Model/User.js';

export default class App extends rt.BaseView {
	_receiveData: function(done) {
		this.model.viewer(new User({ name: 'Петька' }));
		done();
	}
}

rt.registerViewClass('App', App);
```
Так делается только для примера, по хорошему метод `_receiveData` должен не записывать данные в модель, а попросить у модели подготовить нужные данные. Если данные уже есть, модель сообщает о готовности, если же нет, запрашивает их у соответствующего провайдера и сообщает о готовности после их получения. Подробнее про метод `_receiveData` — [Rift.BaseView#_receiveData](???).

Теперь используем модуль `UserCard` в шаблоне главного модуля (`App/View/modules/App/index.rtt`):
```html
{{// используем модуль UserCard }}
{{> 'UserCard', { model: model.viewer() } }}

{{// и ещё разок }}
{{> 'UserCard', { model: model.viewer() } }}

{{// просто выводим имя главного пользователя без использования модуля }}
<div>{model.viewer().name}</div>
```

Обновите страницу (возможно потребуется перезапустить сборку `gulp --dev`, т. к. watching ещё не идеален).

Попробуйте менять имя пользователя в консоли браузера:
```js
_app.model.viewer().name('Васька');
```
