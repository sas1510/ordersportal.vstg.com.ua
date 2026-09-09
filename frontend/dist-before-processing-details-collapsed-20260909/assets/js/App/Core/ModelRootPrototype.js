class ModelRootPrototype {
    constructor(parent) {
        this.uuid = 'Model-' + parent.uuid;
        this.parent = parent;
        this.url = baseAPIUri + param;
    }
    /**
     * @description Метод для отримання даних з API
     * @param {string} argument - Додатковий параметр для запиту
     * @returns {Promise} - Проміс, який виконується при успішному отриманні даних
     */
    getData(argument = '') {
        $('body').append('<div id="spinner"> Завантаження... </div>');

        // Повертаємо проміс
        return $.get(this.url + '/' + argument)
            .done((data) => {
                $('#spinner').remove();
                if (data.status === 'success') {
                    //console.log('Дані отримані \n', data.data);
                } else {
                    dropAlert(data.message);
                    console.error(data.message);
                    // Відхиляємо проміс
                    return $.Deferred().reject(data.message);
                }
            })
            .fail((jqXHR, textStatus, errorThrown) => {
                $('#spinner').remove();
                console.error('Помилка завантаження даних', textStatus, errorThrown);
                dropAlert(textStatus);
                return $.Deferred().reject(textStatus);
            });
    }
}