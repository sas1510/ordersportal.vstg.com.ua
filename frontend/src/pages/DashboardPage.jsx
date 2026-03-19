import { useState } from "react";
import DashboardGrid from "../widgets/DashboardGrid";
import { widgetRegistry } from "../widgets/widgetRegistry";

export default function DashboardPage() {
  const [editMode, setEditMode] = useState(false);

  const [widgets, setWidgets] = useState([
    { id: "1", type: "efficiency" },
    { id: "2", type: "volume" }
  ]);

  const [layout, setLayout] = useState([
    { i: "1", x: 0, y: 0, w: 6, h: 3 },
    { i: "2", x: 6, y: 0, w: 6, h: 3 }
  ]);

  const addWidget = (type) => {
    if (!type) return;

    const id = Date.now().toString();

    setWidgets(prev => [...prev, { id, type }]);
    setLayout(prev => [
      ...prev,
      { i: id, x: 0, y: Infinity, w: 6, h: 3 }
    ]);
  };

  return (
    <div className="dashboard-page">

      <div className="dashboard-toolbar">
        <h2>Аналітичний Dashboard</h2>

        <button onClick={() => setEditMode(!editMode)}>
          {editMode ? "Готово" : "Редагувати"}
        </button>

        {editMode && (
          <select onChange={(e) => addWidget(e.target.value)}>
            <option value="">Додати віджет...</option>
            {Object.keys(widgetRegistry).map(key => (
              <option key={key} value={key}>
                {widgetRegistry[key].title}
              </option>
            ))}
          </select>
        )}
      </div>

      <DashboardGrid
        widgets={widgets}
        setWidgets={setWidgets}
        layout={layout}
        setLayout={setLayout}
        editMode={editMode}
        dataResolver={() => null} // поки без API
      />

    </div>
  );
}