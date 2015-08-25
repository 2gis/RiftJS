# RiftJS

[![Dependency Status](https://david-dm.org/2gis/RiftJS.svg)](https://david-dm.org/2gis/RiftJS#info=dependencies)
[![DevDependency Status](https://david-dm.org/2gis/RiftJS/dev-status.svg)](https://david-dm.org/2gis/RiftJS#info=devDependencies)

RiftJS — js-фреймворк для написания изоморфных приложений со сложной бизнес-логикой и высокосвязными интерфейсами.

Основные фичи:
* удобное разделение на модули с их полной изоляцией;
* развитые способы взаимодействия модулей между собой;
* продуманная система очистки памяти;
* реактивное программирование на всех уровнях с использованием [сверхбыстрого движка](https://github.com/Riim/cellx);
* привязка данных к представлению;
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
```

Соберите и запустите приложение:
```
gulp --dev
```

Откройте в браузере `localhost:8090`
