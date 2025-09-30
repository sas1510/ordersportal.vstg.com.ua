class ControllerRootPrototype {

    uuid = '';
    className = '';
    /*    childClass = {
            'RootController': BatchController
        };*/
    root = {};
    parent = {};
    owner = {};
    internals = {};
    items = {};
    view = {};

    constructor(data = {}, parent = this, root = this) {
        this.uuid = data.uuid;
        this.parent = parent;
        this.owner = parent;
        this.root = root;
        this.className = this.constructor.name;
        let viewClass = this.className.replace('Controller', 'View');
        let modelClass = this.className.replace('Controller', 'Model');
        eval(`this.view = new ${viewClass}(this)`);
        eval(`this.model = new ${modelClass}(this)`);

        for (let key in data) {
            if (key !== 'items') {
                this.internals[key] = data[key];
            }
        }

        if (Object.keys(data).length > 0 && data.hasOwnProperty('items')) {
            for (let key in data.items) {
                try {
                    eval(`this.items[key] = new ${data.items[key].class}(data.items[key], this, root)`);
                } catch (e) {
                    console.error(this.className = this.constructor.name + ' - ' + data.items[key].class + ' - ' + e)
                }
            }
        }
    }

    getUuid() {
        return this.uuid;
    }

    /**
     * СУММИРУЕТ ДВА ОБЪЕКТА
     * @param obj1
     * @param obj2
     * @returns {{}}
     */
    aggregate(obj1, obj2) {
        let result = {};
        const processObject = (obj) => {
            for (let key in obj) {

                if (typeof obj[key] !== 'object') {

                    if (result.hasOwnProperty(key)) {
                        result[key] += isNaN(parseFloat(obj[key])) ? 0 : parseFloat(obj[key]);
                    } else {
                        result[key] = isNaN(parseFloat(obj[key])) ? 0 : parseFloat(obj[key]);
                    }
                } else {

                    if (result.hasOwnProperty(key)) {
                        result[key] = this.aggregate(result[key], obj[key]);
                    } else {
                        result[key] = obj[key];
                    }
                }
            }
        }

        processObject(obj1);
        processObject(obj2);

        return result;
    }

    /**
     * Функция для вычитания одного объекта из другого. На выходе получаем объект с уникальными свойствами исходный объектов
     * @param obj1
     * @param obj2
     * @returns {{}}
     */
    subtract(obj1, obj2) {
        let result = {};

        // Добавляем свойства из obj1, которых нет в obj2
        for (const key in obj1) {
            if (!(key in obj2)) {
                result[key] = obj1[key];
            }
        }

        // Добавляем свойства из obj2, которых нет в obj1
        for (const key in obj2) {
            if (!(key in obj1)) {
                result[key] = obj2[key];
            }
        }

        return result;
    }

    /** Метод осуществляет фильтрацию объектов по указанным свойствам в internals
     * @param source - исходный объект, который нужно отфильтровать
     * @param filter - объект с ключами и значениями, по которым нужно фильтровать
     */
    filterByInternals(source = {}, filter = {}) {
        let result = {};
        const filterCount = Object.keys(filter).length;

        //console.log('filterByInternals', source, filter);

        for (let key in source) {
            const sourceItem = source[key];
            let matchCount = 0;

            for (let key in filter) {
                const filterValue = filter[key];
                // Проверяем, что ключ существует в internals и значение совпадает с фильтром
                if (sourceItem.internals.hasOwnProperty(key) && sourceItem.internals[key] == filterValue) {
                    matchCount++;
                }
            }
            // Если количество совпадений равно количеству фильтров, добавляем объект в результат
            if (matchCount === filterCount) {
                result[key] = sourceItem;
            }
        }

        return result;
    }

    /**
     * Функция для проверки и преобразования значения в положительное число
     * @param value
     * @returns {number}
     */
    positiveValue(value) {
        return (parseFloat(value) > 0) ? parseFloat(value) : 0;
    }

    /**
     * Функция для поиска объекта по uuid
     * @param uuid
     * @returns {{}}
     */
    findObject(uuid = '') {
        let result = {};

        if (this.uuid === uuid) {
            result = this;
        } else {
            for (let key in this.items) {
                let res = this.items[key].findObject(uuid);

                if (Object.keys(res).length !== 0) {
                    result = res;
                    break;
                }
            }
        }

        return result;
    }

    /**
     * Функция для поиска объекта по имени
     * @param name
     * @returns {{}}
     */
    findObjectByName(name = '') {
        let result = {};

        if (this.internals.name === name) {
            let res = this;
            result[res.uuid] = res;
        } else {
            for (let key in this.items) {
                let res = this.items[key].findObjectByName(name);

                if (Object.keys(res).length !== 0) {
                    for (let k in res) {
                        result[res[k].uuid] = res[k];
                    }
                }
            }
        }

        return result;
    }

}