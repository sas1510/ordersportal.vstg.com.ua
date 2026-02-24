import { Draggable } from "react-beautiful-dnd";

const CHARTS_LIST = [
  { id: "complexity-donut", label: "Портфель категорій" },
  { id: "efficiency-chart", label: "Ефективність" },
  { id: "volume-chart", label: "Обсяг" },
  { id: "prefix-display", label: "Prefix Data" },
  { id: "furniture-chart", label: "Фурнітура" },
  { id: "profile-color", label: "Колір профілю" },
  { id: "profile-system", label: "Профільні системи" },
  { id: "color-system-heatmap", label: "Heatmap" }
];

export default function ComponentPalette() {
  return (
    <div className="component-palette">
      <h4>Доступні графіки</h4>
      {CHARTS_LIST.map(chart => (
        <div key={chart.id} className="draggable-item" draggable>
          {chart.label}
        </div>
      ))}
    </div>
  );
}