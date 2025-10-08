import React, { useEffect, useRef } from 'react';
import './NewCalculationModal.css';
import axiosInstance from '../../api/axios';
import { useNotification } from '../notification/Notifications.jsx';

const NewCalculationModal = ({ isOpen, onClose, onSave }) => {
  const { addNotification } = useNotification();
  const modalId = 'new-calc-modal';
  const isInitialized = useRef(false);

  const checkLibraries = () => window.$ && window.jQuery && window.$.fn && window.$.fn.iziModal;

  const fetchLastOrderNumber = async () => {
    try {
      const response = await axiosInstance.get("/last-order-number/");
      const lastNumber = response.data?.LastOrderNumber || 0;
      window.$('#order-id').val(lastNumber + 1);
    } catch (error) {
      console.error("Не вдалося отримати останній номер замовлення:", error);
      addNotification('Не вдалося отримати останній номер замовлення ❌', 'error');
    }
  };

  useEffect(() => {
    if (!document.getElementById(modalId)) {
      const modalDiv = document.createElement('div');
      modalDiv.id = modalId;
      document.body.appendChild(modalDiv);
    }

    const initialize = () => {
      if (!checkLibraries() || isInitialized.current) return;

      try {
        const $modal = window.$(`#${modalId}`);

        const modalContent = `
          <div class="new-calc-form column gap-14">
            <div class="column gap-18 align-center w-100">
              <label for="order-id" class="row align-center gap-16 w-100">
                <span>№:</span>
                <input type="text" id="order-id" name="order-id" placeholder="ID замовлення" class="w-100">
              </label>

              <span class="column align-center background-warning-light border-grey cursor-pointer w-100" title="Завантажити файл прорахунку">
                <label for="upload-calc-file" class="row cursor-pointer gap-16 text-grey p-14">
                  <span class="icon icon-upload font-size-24"></span>
                  <span>Завантажити файл прорахунку</span>
                  <input type="file" id="upload-calc-file" name="upload-calc-file" accept=".zkz" style="display: none;">
                </label>
                <div class="row align-center gap-16 w-100 p-14 border-top">
                  <span id="uploaded-calc-file-name" class="text-grey font-size-14">Файл не обрано</span>
                  <span class="icon icon-cancel2 font-size-18 text-grey cursor-pointer" title="Очистити вибір файлу" id="clear-file-button"></span>
                </div>
              </span>

              <label for="items-count" class="row align-center gap-16">
                <span>Кількість конструкцій:</span>
                <input type="number" id="items-count" name="items-count" value="1" min="1" style="width: 60px; text-align: center;">
              </label>

              <label for="calc-comment" class="row align-center gap-16 w-100">
                <textarea id="calc-comment" name="calc-comment" placeholder="Введіть коментар" class="w-100" style="height: 100px;"></textarea>
              </label>
            </div>

            <div class="buttons-wrapper row gap-16 w-100 border-top p-14 align-center">
              <span class="right btn btn-danger btn-cancel row gap-14 align-center" title="Відмінити">
                <span class="icon-cancel font-size-18"></span>
                <span>Відмінити</span>
              </span>
              <span class="right btn btn-success btn-save row gap-14 align-center" title="Зберегти">
                <span class="icon-save font-size-18"></span>
                <span>Зберегти</span>
              </span>
            </div>
          </div>
        `;

        
        $modal.iziModal({
          icon: 'icon-calculator',
          iconColor: '#e9f3e1',
          title: 'Створити новий прорахунок',
          headerColor: '#76b448',
          width: 500,
          padding: 15,
          transitionIn: 'comingIn',
          transitionOut: 'comingOut',
          setTop: false,
          startEvent: false,
          onOpening: function() {
            resetForm();
            setupHandlers();
            fetchLastOrderNumber();
          },
          onClosed: function() {
            resetForm();
            if (onClose) onClose();
          }
        });

        $modal.iziModal('setContent', modalContent);
        isInitialized.current = true;
      } catch (error) {
        console.error('Error initializing modal:', error);
      }
    };

    initialize();
  }, []);

  const resetForm = () => {
    if (!checkLibraries()) return;

    window.$('#order-id').val('');
    window.$('#upload-calc-file').val('');
    window.$('#uploaded-calc-file-name')
      .text('Файл не обрано')
      .removeClass('text-danger')
      .addClass('text-grey');
    window.$('#items-count').val(1);
    window.$('#calc-comment').val('');
  };

  const setupHandlers = () => {
    if (!checkLibraries()) return;

    window.$('#upload-calc-file').off('change').on('change', function() {
      const file = this.files[0];
      const filenameEl = window.$('#uploaded-calc-file-name');
      if (file) {
        filenameEl.text(file.name).removeClass('text-grey').addClass('text-danger');
      } else {
        filenameEl.text('Файл не обрано').removeClass('text-danger').addClass('text-grey');
      }
    });

    window.$('#clear-file-button').off('click').on('click', function(e) {
      e.stopPropagation();
      window.$('#upload-calc-file').val('');
      window.$('#uploaded-calc-file-name')
        .text('Файл не обрано')
        .removeClass('text-danger')
        .addClass('text-grey');
    });

    window.$('.btn-save').off('click').on('click', async function() {
      const $saveBtn = window.$(this);
      const orderNumber = window.$('#order-id').val();
      const fileInput = window.$('#upload-calc-file')[0];
      const constructionsCount = window.$('#items-count').val();
      const comment = window.$('#calc-comment').val();

      if (!orderNumber || !fileInput.files[0] || !constructionsCount || !comment.trim()) {
        addNotification('Будь ласка, заповніть усі поля та оберіть файл ❌', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('OrderNumber', orderNumber);
      formData.append('ConstructionsCount', constructionsCount);
      formData.append('file', fileInput.files[0]);
      formData.append('Comment', comment);

      try {
        $saveBtn.prop('disabled', true);

        const response = await axiosInstance.post('/create/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (onSave) onSave({
          id: response.data?.id,
          name: response.data?.name,
          dateRaw: response.data?.dateRaw,
          ConstructionsCount: constructionsCount,
          Comment: comment,
          file: fileInput.files[0]
        });

        addNotification(`Прорахунок №${orderNumber} успішно створено ✅`, 'success');
        window.$('#new-calc-modal').iziModal('close');
      } catch (error) {
        console.error('Помилка при відправці на сервер:', error);
        addNotification('Помилка при збереженні замовлення ❌', 'error');
      } finally {
        $saveBtn.prop('disabled', false);
      }
    });

    window.$('.btn-cancel').off('click').on('click', function() {
      window.$(`#${modalId}`).iziModal('close');
    });
  };

  useEffect(() => {
    if (!checkLibraries() || !isInitialized.current) return;

    try {
      if (isOpen) {
        window.$(`#${modalId}`).iziModal('open');
      } else {
        window.$(`#${modalId}`).iziModal('close');
      }
    } catch (error) {
      console.error('Error controlling modal:', error);
    }
  }, [isOpen]);

  return null;
};

export default NewCalculationModal;
