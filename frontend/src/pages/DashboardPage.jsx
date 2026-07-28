import { useMemo, useState } from "react";
import DashboardGrid from "../widgets/DashboardGrid";
import { widgetRegistry } from "../widgets/widgetRegistry";
import "./DashboardPage.css";

const DASHBOARD_ACCENTS = [
  { value: "2", label: "активні віджети" },
  { value: "Portal", label: "стиль оформлення" },
  { value: "Live", label: "робоча панель" },
];

export default function DashboardPage() {
  const [editMode, setEditMode] = useState(false);
  const [widgets, setWidgets] = useState([
    { id: "1", type: "efficiency" },
    { id: "2", type: "volume" },
  ]);

  const availableWidgets = useMemo(() => Object.entries(widgetRegistry), []);

  const addWidget = (type) => {
    if (!type) return;

    const id = Date.now().toString();
    setWidgets((prev) => [...prev, { id, type }]);
  };

  const removeWidget = (id) => {
    setWidgets((prev) => prev.filter((widget) => widget.id !== id));
  };

  return (
    <main className="portal-dashboard-page">
      <section className="portal-dashboard-page__hero">
        <div className="portal-dashboard-page__hero-glow portal-dashboard-page__hero-glow--left" />
        <div className="portal-dashboard-page__hero-glow portal-dashboard-page__hero-glow--right" />

        <div className="portal-dashboard-page__hero-copy">
          <span className="portal-dashboard-page__eyebrow">Аналітична панель</span>
          <h1>Dashboard у стилі порталу</h1>
          <p>
            Керуйте віджетами в одному просторі з тією ж візуальною мовою, що і на
            головній сторінці: темна атмосфера, м&apos;які панелі та живі акценти.
          </p>
        </div>

        <div className="portal-dashboard-page__hero-stats">
          {DASHBOARD_ACCENTS.map((item) => (
            <div key={item.label} className="portal-dashboard-page__hero-stat">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="portal-dashboard-page__panel">
        <div className="portal-dashboard-page__toolbar">
          <div>
            <span className="portal-dashboard-page__toolbar-label">Робочий простір</span>
            <h2>Налаштування віджетів</h2>
          </div>

          <div className="portal-dashboard-page__toolbar-actions">
            {editMode && (
              <label className="portal-dashboard-page__select-wrap">
                <span>Додати віджет</span>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    addWidget(e.target.value);
                    e.target.value = "";
                  }}
                >
                  <option value="" disabled>
                    Оберіть віджет...
                  </option>
                  {availableWidgets.map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.title}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <button
              type="button"
              className="portal-dashboard-page__toggle"
              onClick={() => setEditMode((prev) => !prev)}
            >
              {editMode ? "Готово" : "Редагувати"}
            </button>
          </div>
        </div>

        <DashboardGrid
          widgets={widgets}
          removeWidget={editMode ? removeWidget : undefined}
          dataResolver={() => null}
        />
      </section>
    </main>
  );
}
