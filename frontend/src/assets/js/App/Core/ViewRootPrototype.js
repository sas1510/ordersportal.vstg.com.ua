class ViewRootPrototype {
    id = '';
    uuid = '';
    parent = {};
    tableRowTmpl = {
        "id": {
            title: '',
            type: 'hidden',
            isTrue: '',
            isFalse: '',
            isNull: '',
            isNil: '',
            isEmpty: '',
            style: ''
        },
        "timeAlarm": {
            title: '<span class="icon-stop-watch3 table-ico"></span>',
            type: 'flag',
            isTrue: '<span class="icon-fire text-warning" title="Горящий"></span>',
            isFalse: '<span class="icon-clock3 text-danger" title="Протермінований"></span>',
            isNull: '',
            isNil: '',
            isEmpty: '',
            style: 'table-ico'
        },
        "isРrovided": {
            title: '<span class="icon-stats2 table-ico"></span>',
            type: 'bool',
            isTrue: '<span class="icon-checkmark text-success font-16" title="Забезпечений"></span>',
            isFalse: '<span class="icon-cancel text-danger" title="Не забезпечений"></span>',
            isNull: '',
            isNil: '',
            isEmpty: '',
            style: 'table-ico'
        },
        "OrderStatus": {
            title: 'Стан',
            type: 'ico',
            isTrue: '',
            Ready: '<span class="icon-flag2 text-success" title="Готовий"></span>',
            inProduction: '<span class="icon-cogs text-info" title="У виробництві"></span>',
            inBuffer: '<span class="icon-layers2 text-grey" title="Не запланований"></span>',
            Planned: '<span class="icon-clipboard text-warning" title="Запланований у виробництво"></span>',
            notConfirmed: '<span class="icon-warning3 text-danger" title="Не підтверджений"></span>',
            isFalse: '',
            isNull: '',
            isNil: '',
            isEmpty: '',
            style: 'table-ico'
        },
        "rowStatus": {
            title: 'Стан',
            type: 'rowStatus',
            isTrue: '',
            isFalse: '',
            isNull: '',
            isNil: '',
            isEmpty: '',
            style: 'background-success-light'
        },
        "Customer": {
            title: 'Контрагент',
            type: 'string',
            isTrue: '',
            isFalse: '',
            isNull: '',
            isNil: '',
            isEmpty: '',
            style: ''
        },
        "DeliverySector": {
            title: 'Сектор',
            type: 'string',
            isTrue: '',
            isFalse: '',
            isNull: '',
            isNil: '',
            isEmpty: '',
            style: ''
        },
        "HalfStuffProdDate": {
            title: 'Дата гот. напівф.',
            type: 'date',
            isTrue: '',
            isFalse: '',
            isNull: '',
            isNil: '',
            isEmpty: '',
            style: 'modal-cel-type-date'
        },
        "HalfStuffIsReady": {
            title: 'Гот. напівф.',
            type: 'bool',
            isTrue: '',
            isFalse: '',
            isNull: '',
            isNil: '',
            isEmpty: '',
            style: ''
        },
        "CustomerOrderNum": {
            title: 'Номер замовл.',
            type: 'string',
            isTrue: '',
            isFalse: '',
            isNull: '',
            isNil: '',
            isEmpty: '',
            style: ''
        },
        "CustomerOrderDate": {
            title: 'Дата замовл.',
            type: 'date',
            isTrue: '',
            isFalse: '',
            isNull: '',
            isNil: '',
            isEmpty: '',
            style: 'modal-cel-type-date'
        },

        "ConstQuantity": {
            title: 'Конст.',
            type: 'quantity',
            isTrue: '',
            isFalse: '',
            isNull: '',
            isNil: '',
            isEmpty: '',
            style: ''
        },
        "ProductionDate": {
            title: 'Дата вир.',
            type: 'date',
            isTrue: '',
            isFalse: '',
            isNull: '',
            isNil: '',
            isEmpty: '',
            style: 'modal-cel-type-date'
        },
        "FinalProdDate": {
            title: 'Остаточна дата вир.',
            type: 'date',
            isTrue: '',
            isFalse: '',
            isNull: '',
            isNil: '',
            isEmpty: '',
            style: 'label label-info label-bdr'
        },
        "DelayDate": {
            title: 'Затримка',
            type: 'date',
            isTrue: '',
            isFalse: '',
            isNull: '',
            isNil: '',
            isEmpty: '',
            style: 'modal-cel-type-date'
        },
        "DefermentDate": {
            title: 'Відстрочка',
            type: 'date',
            isTrue: '',
            isFalse: '',
            isNull: '',
            isNil: '',
            isEmpty: '',
            style: 'modal-cel-type-date'
        },
        "CustomerOrdersBundleID": {
            title: 'ID зв`язки',
            type: 'hidden',
            isTrue: '',
            isFalse: '',
            isNull: '',
            isNil: '',
            isEmpty: '',
            style: ''
        },
        "CustomerOrdersBundle": {
            title: 'Зв`язка',
            type: 'string',
            isTrue: '',
            isFalse: '',
            isNull: '',
            isNil: '',
            isEmpty: '',
            style: ''
        },
        "BundledOrdersQuantity": {
            title: 'Конст у зв.',
            type: 'quantity',
            isTrue: '',
            isFalse: '',
            isNull: '',
            isNil: '',
            isEmpty: '',
            style: ''
        },

    }

    constructor(parent) {
        this.uuid = 'View-' + parent.uuid;
        this.parent = parent;
    }

    /*======================================= ИНСТРУМЕНТЫ ==============================================*/
    isEven(num) {
        return num % 2 === 0;
    }

    needsScroll(elementID) {
        const element = document.getElementById(elementID);
        return element.scrollHeight > element.clientHeight ? elementID : null;
    }

    autoScrollY(elementId, speed = 1, delaySeconds = 2) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Елемент з id="${elementId}" не знайдено`);
            return;
        }

        let scrollAmount = 0;
        const maxScroll = element.scrollHeight - element.clientHeight;
        let direction = 1; // 1 - вниз, -1 - вгору
        let isWaiting = false;

        function step() {
            if (isWaiting) return;

            scrollAmount += speed * direction;
            element.scrollTop = scrollAmount;

            if (scrollAmount >= maxScroll) {
                scrollAmount = maxScroll;
                isWaiting = true;
                setTimeout(() => {
                    direction = -1;
                    isWaiting = false;
                    requestAnimationFrame(step);
                }, delaySeconds * 1000);
            } else if (scrollAmount <= 0) {
                scrollAmount = 0;
                isWaiting = true;
                setTimeout(() => {
                    direction = 1;
                    isWaiting = false;
                    requestAnimationFrame(step);
                }, delaySeconds * 1000);
            } else {
                requestAnimationFrame(step);
            }
        }

        step();
    }

    PrityDate(date, tmpl) {
        return `<div class="PrityDate ${tmpl}"><div class="time">${date.slice(11, 16)}</div><div class="date">${date.slice(0, 10)}</div></div>`;
    }

    formatDate(dateString, shortMonth = false) {
        // Проверяем на null или пустую строку
        if (!dateString) {
            return null;
        }

        // Создаем объект даты из строки
        const date = new Date(dateString);

        // Проверяем, является ли дата валидной
        if (isNaN(date.getTime())) {
            return null;
        }

        // Определяем массив с названиями месяцев
        const months = [
            "січня", "лютого", "березня", "квітня", "травня", "червня",
            "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"
        ];

        // Определяем массив с сокращенными названиями месяцев
        const shortMonths = [
            "січ", "лют", "бер", "квіт", "трав", "черв",
            "лип", "серп", "вер", "жовт", "лис", "груд"
        ];

        // Получаем день, месяц и год
        const day = date.getUTCDate(); // День месяца
        const month = shortMonth ? shortMonths[date.getUTCMonth()] : months[date.getUTCMonth()]; // Месяц
        const year = date.getUTCFullYear(); // Год

        // Формируем строку и возвращаем
        return `${day} ${month} ${year} р.`;
    }

    ifZerro(value) {
        return (value ? value : `<span class="icon-dots-three-horizontal text-grey"></span>`);
    }

    numToUAMoneyFormat(num, currencyName = 'грн') {
        let formatted = 0
        let currencies = {
            'грн': 'UAH',
            'USD': 'USD',
            'Леи': 'RON',
            'EUR': 'EUR'
        };

        const currency = (currencyName in currencies) ? currencies[currencyName] : 'UAH';

        formatted = new Intl.NumberFormat('uk-UA', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(num);
        return formatted;
    }

    numToEUMoneyFormat(num) {
        return new Intl.NumberFormat('uk-UA', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(num);
    }

    getTextColor(element) {
        var color = $(element).css("color");
        return this.parseColor(color).hex;
    }

    parseColor(color) {
        var arr = [];
        color.replace(/[\d+\.]+/g, function (v) {
            arr.push(parseFloat(v));
        });
        return {
            hex: "#" + arr.slice(0, 3).map(this.toHex).join(""),
            opacity: arr.length == 4 ? arr[3] : 1
        };
    }

    toHex(int) {
        var hex = int.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    /**
     * возвращает только internals
     */
    getSpread(data = {}) {
        let result = {};
        for (let key in data) {
            if (data[key].hasOwnProperty('internals')) {
                result[key] = data[key].internals;
            }
        }

        return result;
    }

    /*==================================================================================================*/
    templateBuilding() {

    }

    eventHandlerClickTrigger(_this = this.parent) {
        $(document).off('click', '.clickTrigger');
        $(document).on('click', '.clickTrigger', function (event) {
            event.preventDefault();
            event.stopPropagation();
            let modalID = '';

            const arg = $(this).data('arg');
            const action = $(this).data('action');

            const modalWidth = $(this).data('width') ?? 1400;
            const modalColor = $(this).data('color') ?? colors['danger-color'];

            console.log($(this).data());


            modalID = _this.view.renderModal($(this).attr('title'), _this.internals.name ?? '', modalColor, modalWidth);

            const result = eval(`_this.view.${action}()`);
            result.callback(modalID, arg, _this);
        });
    }

    rowFormatting(data = {}, template) {

        const cellFormatting = {
            'bool': (value, tmpl) => {
                let result = '';
                if (parseInt(value)) {
                    result = tmpl.isTrue;
                } else {
                    result = tmpl.isFalse;
                }
                return `<td class="modal-cel-type-bool"><span class="${tmpl.style}">${result}</span></td>`;
            },
            'flag': (value, tmpl) => {
                let result = '';
                if (parseInt(value) > 0) {
                    result = tmpl.isTrue;
                } else if (parseInt(value) < 0) {
                    result = tmpl.isFalse;
                } else {
                    result = tmpl.isNil;
                }
                return `<td class="modal-cel-type-flag"><span class="${tmpl.style}">${result}</span></td>`;
            },
            'ico': (value, tmpl) => {
                let result = '';
                if (tmpl.hasOwnProperty(value)) {
                    result = tmpl[value];
                } else {
                    result = tmpl.isNil;
                }
                return `<td class="modal-cel-type-flag"><span class="${tmpl.style}">${result}</span></td>`;
            },
            'string': (value, tmpl) => {
                let result = '';

                if (value == null) {
                    result = tmpl.isNull;
                } else if (value == '0') {
                    result = tmpl.isNil;
                } else if (value == '') {
                    result = tmpl.isEmpty;
                } else {
                    result = value.length > 32 ? value.slice(0, 32) + '...' : value; // берем только первые 32 символов
                }

                return `<td class="modal-cel-type-string"><span class="${tmpl.style}">${result}</span></td>`;
            },
            'text': (value, tmpl) => {
                let result = '';

                if (value == null) {
                    result = tmpl.isNull;
                } else if (value == '0') {
                    result = tmpl.isNil;
                } else if (value == '') {
                    result = tmpl.isEmpty;
                } else {
                    result = value.length > 128 ? value.slice(0, 128) + '...' : value; // берем только первые 128 символов
                }

                return `<td class="modal-cel-type-string"><span class="${tmpl.style}">${result}</span></td>`;
            },
            'integer': (value, tmpl) => {
                let result = 0;

                if (value == null || isNaN(value)) {
                    result = tmpl.isNull;
                } else if (parseInt(value) == 0) {
                    result = tmpl.isNil;
                } else if (value == '') {
                    result = tmpl.isEmpty;
                } else {
                    result = parseInt(value);
                }

                return `<td class="modal-cel-type-integer"><span class="${tmpl.style}">${result}</span></td>`;
            },
            'quantity': (value, tmpl) => {
                let result = 0;

                if (value == null || isNaN(parseInt(value))) {
                    result = tmpl.isNull;
                } else if (parseInt(value) == 0) {
                    result = tmpl.isNil;
                } else if (value == '') {
                    result = tmpl.isEmpty;
                } else {
                    result = parseInt(value);
                }

                return `<td class="modal-cel-type-integer"><span class="${tmpl.style}">${result}</span></td>`;
            },
            'money': (value, tmpl) => {
                let result = '';

                if (value == null) {
                    result = `<td><span>${tmpl.isNull}</span></td>`
                } else if (parseInt(value) == 0) {
                    result = `<td><span>${tmpl.isNil}</span></td>`
                } else if (value == '') {
                    result = `<td><span>${tmpl.isEmpty}</span></td>`
                } else {
                    result = `<td><span class="${tmpl.style}">${this.numToUAMoneyFormat(value)}</span></td>`
                }

                return result;
            },
            'date': (value, tmpl) => {
                let result = '';

                if (value == null) {
                    result = tmpl.isNull;
                } else if (value == '0001-01-01') {
                    result = tmpl.isNil;
                } else if (value == '') {
                    result = tmpl.isEmpty;
                } else {
                    result = value.slice(0, 10); // берем только дату без времени
                }

                return `<td class="modal-cel-type-date"><span class="${tmpl.style}">${result}</span></td>`;
            },
            'rowStatus': (value, tmpl) => {
                /*                let statusList = {
                                    'Ready': ''
                                }*/
                return 'modal-row-status-' + value;
            },
        }

        let rowStyle = '';
        let tdChain = '';

        for (let key in template) {
            if (data.hasOwnProperty(key)) {
                let val = data[key];
                let funcParams = template[key];
                let funcName = template[key].type;

                if (funcName !== 'hidden' && funcName !== 'rowStatus') {
                    tdChain += cellFormatting[funcName](val, funcParams);
                } else if ((funcName === 'rowStatus')) {
                    rowStyle = cellFormatting[funcName](val, funcParams);
                }

            } else {
                tdChain += `<span>Дані відсутні</span>`;
            }
        }

        return `<tr class="${rowStyle}">${tdChain}</tr>`;
    }

    renderTableHeader(template) {
        let header = `<tr role="row">`;

        for (let key in template) {
            if (template[key].type !== 'hidden' && template[key].type !== 'rowStatus') {
                header += `<th class="">${template[key].title}</th>`;
            }
        }

        return header + '</tr>';
    }

    renderTable(data = {}, tmpl = this.tableRowTmpl, tableID, beforeContent = `<div class="modal-before-wrapper"></div>`, afterContent = `<div class="modal-after-wrapper"></div>`) {
        let rowChain = '';
        for (let key in data) {
            rowChain += this.rowFormatting(data[key], tmpl);
        }

        let tableContent = `
        <div class="modal-table-wrapper">
            <table id="${tableID}" class="no-margin dataTable">
                <thead>
                    ${this.renderTableHeader(tmpl)}
                </thead>
                <tbody>
                    ${rowChain}
                </tbody>
                <tfoot></tfoot>
            </table>
        </div>
        `;

        return beforeContent + tableContent + afterContent;
    }

    renderModal(title = 'Title', subTitle = '', color = '#5e83bf', width = 1650) {
        $('body').css('overflow', 'hidden'); // отключаем скролл в body
        const modalId = this.uuid + '-' + randomString(8); // генерируем уникальный компонент ID для использования в рамках данного модального окна
        const modalWrapperId = 'modal-' + modalId; // ID для обертки контента

        const content = `<div class="modal-css-content" style="width: 100%; min-height: 200px" id="wrapper-${modalId}" ></div>`; // формируем контент

        $('body').append(`<div id="${modalWrapperId}"></div>`); // добавляем в body стартовый блок для модального окна

        // формируем окно iziModal
        $('#' + modalWrapperId).iziModal('destroy'); // пытаемся удалить, если окно с таким ID уже существует
        //console.log(modalWrapperId);
        $('#' + modalWrapperId).iziModal({ // устанавливаем параметры окна
            title: title,
            subtitle: subTitle,
            width: width,
            headerColor: color,
            fullscreen: false
        });

        //$('#' + modalWrapperId).iziModal('setContent', this.renderTable(data)); // устанавливаем контент в модальное окно для отображения спинера загрузки
        $('#' + modalWrapperId).iziModal('setContent', content); // устанавливаем контент в модальное окно для отображения спинера загрузки
        $('#' + modalWrapperId).iziModal('open'); // открываем окно

        $(document).on('closed', '#' + modalWrapperId, function (exeption) {
            $('#' + modalWrapperId).remove();
            $('body').css('overflow', 'auto'); // отключаем скролл в body
        });

        return `wrapper-${modalId}`;
    }

    dataTableInit(tableID) {
        // DataTable init
        let table = new DataTable('#' + tableID, {
            language: {
                info: 'Сторінка _PAGE_ з _PAGES_',
                infoEmpty: 'Дані відсутні',
                infoFiltered: '(з _MAX_ записів)',
                lengthMenu: ' _MENU_ ',
                zeroRecords: 'Нічого не знайдено',
                search: "",
            },
            lengthMenu: [
                [10, 25, 50, -1],
                [10, 25, 50, 'Усі']
            ],
            layout: {
                topEnd: {
                    search: {placeholder: 'Швидкий пошук ...'},
                    buttons: ['pdfHtml5', 'excelHtml5', 'print']
                }
            }
        });
        return table;
    }

    render() {

    }

    update() {
    }

    updateData(data = {}) {

        let obj = $('#' + this.uuid);
        for (let key in data) {
            obj.find('.' + key).html(data[key]);
        }
    }


}