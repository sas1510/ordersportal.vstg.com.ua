$(document).ready(function () {
    $('#burger-menu-button').click(function (event) {
        event.stopPropagation();
        $('#burger-menu').toggleClass('burger-hidden');
    });

    $('.burger-item-has-group').click(function (event) {
        event.stopPropagation();
        $(this).find('.items-group').toggleClass('_hidden');
    });

    $('.fullscreen-btn').on('click', function (event) {
        event.stopPropagation();
        event.preventDefault();
        const link = $(this).closest('.item').attr('data-target') + '?key=regional-5ABvgGQPOGy5SgJAVkV6K5LcAkFjx2Zxeandvmx6Zu7sfw4oQTRKTfz';
        window.open(link, '_blank');
    })

    $('.item').on('click', function (event) {
        event.stopPropagation();
        const timestamp = new Date().getTime(); // Получаем текущее время
        let target = $(this).attr('data-target');

        if(target) {

            let $iframe = $('#content');

            // Очищаем содержимое iframe
            $iframe.prop('src', 'about:blank'); // Задаем пустой src для очистки содержимого

            $iframe.attr('src', target + `?timestamp=${timestamp}`);
            $('#burger-menu').addClass('burger-hidden');
            $('.window-title').html('<span class="icon-full-moon text-info" style="margin: 10px; bottom: -2px; position: relative;"></span><span>' + $(this).find('.item-title').text() + '</span>');
            document.title = 'Портал аналітики - ' + $(this).find('.item-title').text();
        }
    });

    $('body').click(function (event) {
       event.stopPropagation();
       $('#burger-menu').addClass('burger-hidden');
    });
})