import "./InvalidLinkPage.css";

export default function InvalidLinkPage() {
  const params = new URLSearchParams(window.location.search);
  const filename = params.get("filename");

  return (
    <div className="preview-error-page">
      <div className="preview-error-card">
        <div className="preview-error-icon">🔒</div>
        <h1>Посилання недійсне</h1>

        <p>
          {filename ? (
            <>
              Файл <span className="filename-highlight">{filename}</span> недоступний або термін дії посилання закінчився.
            </>
          ) : (
            "Посилання недійсне або застаріле."
          )}
        </p>

        <div className="preview-error-actions">
          <a href="/dashboard" className="btn-portal">
            Повернутися в портал
          </a>
        </div>
      </div>
    </div>
  );
}