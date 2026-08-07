const now = new Date();
const currentYear = now.getFullYear();
const currentMonthConst = now.getMonth() + 1;
const currentMonth = now.getMonth() + 1;
const currentDate = now.toLocaleDateString('en-CA', {year: 'numeric', month: '2-digit', day: '2-digit'});
const colors = {
    "text-color": "#606060",
    "info-color": "#5e83bf",
    "info-ap-color": "#5e83bf",
    "success-color": "#76b448",
    "success-ap-color": "#0f8d46",
    "warning-color": "#d3c527",
    "warning-ap-color": "#ec9a29",
    "danger-color": "#e46321",
    "danger-ap-color": "#e50046",
    "brown-color": "#7C5747",
    "purple-color": "#645388",
    "grey-color": "#959595",
    "grey-text-color": "#b9b9b9",
    "info-bg-color": "#cfdcef",
    "success-bg-color": "#e9f3e1",
    "warning-bg-color": "#f3f1d5",
    "danger-bg-color": "#fae4d9",
    "cream-bg-color": "#FFF9EC",
    "purple-bg-color": "#EDE7F6",
    "shadow-color": "#00000050",
    "vs-green-color": "#d4d947",
    "vs-blue-color": "#6b98bf",
    "grey-border-color": "#95959563"
}

/** * Функция для получения названия месяца по его номеру
 * @param {number} monthNumber - Номер месяца (от 1 до 12)
 * @param monthNumber
 * @returns {string|null}
 */
function getMonthName(monthNumber) {
    const months = [
        'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
        'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
    ];
    return months[monthNumber - 1] || null;
}

/** * Функция для конвертации минут в формат "дни, часы, минуты"
 * @param {number} totalMinutes - Общее количество минут
 * @param totalMinutes
 * @returns {string}
 */
function convertMinutesToTimeFormat(totalMinutes) {
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = Math.floor(totalMinutes % 60);
    let result = '';

    if (days > 0) {
        result += `${days} д. `;
    }
    if (hours > 0) {
        result += `${hours} год. `;
    }
    if (minutes > 0) {
        result += `${minutes} хв.`;
    }

    return result.trim(); // Обрізаємо зайві пробіли на кінцях
}

/** * Функция для конвертации секунд в формат "дни, часы, минуты, секунды"
 * @param {number} totalSeconds - Общее количество секунд
 * @param title
 * @param message
 * @param color
 */
function dropAlert(title = 'База даних в процесі оновлення, спробуйте через кілька хвилин', message, color = '#e46321') {
    if ($('#alert').length === 0) {
        $('body').append('<div id="alert"></div>');
    }
    $('#alert').iziModal('destroy'); // пытаемся удалить, если окно с таким ID уже существует
    $('#alert').iziModal({ // устанавливаем параметры окна
        title: title,
        subtitle: message,
        width: 700,
        headerColor: color,
        fullscreen: false,
        closeButton: false,
        icon: 'icon-rocket',
        timeout: 5000,
        timeoutProgressbar: true,
    });
    $('#alert').iziModal('open'); // открываем окно
}

/** * Функция для конвертации секунд в формат "дни, часы, минуты, секунды"
 * @param {number} totalSeconds - Общее количество секунд
 * @param timestamp
 * @returns {number}
 */
function timestampToDays(timestamp) {
    return Math.floor(timestamp / 86400000);
}

/** * Функция для конвертации даты в строку формата "дд.мм.гггг"
 * @param {string} dateString - Дата в формате ISO или любой другой формат, поддерживаемый конструктором Date
 * @returns {number} - Временная метка (timestamp) в миллисекундах
 */
function dateStringToTimestamp(dateString) {
    const date = new Date(dateString);
    return date.getTime();
}

/** * Функция для конвертации временной метки (timestamp) в строку формата "дд-мм-гггг"
 * @param {number} timestamp - Временная метка в миллисекундах
 * @param timestamp
 * @returns {string}
 */
function timestampToString(timestamp) {
    result = '';

    if (timestamp) {
        const date = new Date(timestamp);
        let year = date.toLocaleString("default", {year: "numeric"});
        let month = date.toLocaleString("default", {month: "2-digit"});
        let day = date.toLocaleString("default", {day: "2-digit"});
        result = day + '-' + month + '-' + year;
    }
    return result;
}

/** * Функция для загрузки скрипта по указанному URL
 * @param {string} url - URL скрипта, который нужно загрузить
 * @param url
 */
function require(url) {
    var script = document.createElement('script');
    script.src = url;
    document.getElementsByTagName('head')[0].appendChild(script);
}

/**
 * Функция генерирует случайную строку длинной "i" символов
 * @param i
 * @returns {string}
 */
function randomString(i) {
    var rnd = '';
    while (rnd.length < i)
        rnd += Math.random().toString(36).substring(2);
    return rnd.substring(0, i);
}

/** * Функция для сохранения текста в файл
 * @param {string} text - Текст, который нужно сохранить в файл
 * @param text
 * @param name
 */
function textToFile(text, name) {
    const b = new Blob([text], {type: 'text/plain'});
    const url = window.URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = url;
    a.download = name || 'bi_settings.json';
    a.type = 'text/plain';
    a.addEventListener('click', () => {
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    })
    a.click()
}

/**
 * Асинхронная функция получения данных с сервера по указанному URI
 * @returns {Promise<any|boolean>}
 * @param title
 * @param dataType
 * @param dataKey
 * @param dataValue
 * @param dataFilter
 */
async function getData(title = 'Завантаження... ', dataType, dataKey = '', dataValue = '', dataFilter = '') {
    if (dataType === 'local') { // pick data from local variable 'response'
        if (responce.hasOwnProperty(dataKey)) {
            return responce[dataKey][currentMonth][dataValue];
        } else {
            return {};
        }
    } else {
        let url = '';
        url = baseAPIUri + dataType;
        $('body').append('<div id="spinner">' + title + '</div>')
        try {
            let res = await fetch(url);
            $('#spinner').remove();
            return await res.json();
        } catch (e) {
            $('#spinner').remove();
            return [];
        }
    }
}

