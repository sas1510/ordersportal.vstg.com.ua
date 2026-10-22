import { useState } from 'react';
import './ConstructorPage.css';

const CONSTRUCTOR_URL = 'https://viknastyle.com.ua/constructor';

export default function ConstructorPage() {
  const [frameKey, setFrameKey] = useState(0);
  return <section className="constructor-page">
    <header className="constructor-page-toolbar">
      <h1>Конструктор дверей</h1>
      <div>
        <button type="button" onClick={() => setFrameKey((value) => value + 1)}>Оновити</button>
        <a href={CONSTRUCTOR_URL} target="_blank" rel="noopener noreferrer">Відкрити окремо ↗</a>
      </div>
    </header>
    <p className="constructor-page-hint">Якщо конструктор не відображається, відкрийте його окремо.</p>
    <iframe
      key={frameKey}
      className="constructor-page-frame"
      src={CONSTRUCTOR_URL}
      title="Конструктор дверей Вікна Стиль"
      sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  </section>;
}
