import React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import "./InvalidLinkPage.css"; // Використовуємо ваші існуючі стилі
import "./FilePreviewErrorPage.css"; // Використовуємо ваші існуючі стилі

const ERROR_CONFIG = {
  invalid: {
    icon: "🔒",
    title: "Посилання недійсне",
    message: "недоступний або термін дії посилання закінчився.",
  },
  "not-found": {
    icon: "📁",
    title: "Файл не знайдено",
    message: "відсутній у сховищі або був видалений.",
  },
  corrupted: {
    icon: "⚠️",
    title: "Помилка файлу",
    message: "пошкоджений або має невірний формат завантаження.",
  },
};

export default function FilePreviewErrorPage() {
  // Дістаємо тип помилки з URL (наприклад, /file-preview/:errorType)
  const { errorType } = useParams();
  const [searchParams] = useSearchParams();
  const filename = searchParams.get("filename");

  // Беремо налаштування для конкретної помилки або за замовчуванням "invalid"
  const config = ERROR_CONFIG[errorType] || ERROR_CONFIG.invalid;

  return (
    <div className="preview-error-page">
      <div className="preview-error-card">
        <div className="preview-error-icon">{config.icon}</div>
        <h1>{config.title}</h1>

        <p>
          {filename ? (
            <>
              Файл <span className="filename-highlight">{filename}</span>{" "}
              {config.message}
            </>
          ) : (
            "Запитаний ресурс недоступний."
          )}
        </p>

        <div className="preview-error-actions">
          <a href="/complaints" className="btn-portal">
            Повернутися в портал
          </a>
        </div>
      </div>
    </div>
  );
}
