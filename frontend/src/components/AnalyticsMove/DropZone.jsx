import SortableItem from "./SortableItem";

export default function DropZone({ components, _setComponents, data, Charts }) {

  // Кидало помилку тому що не було обробника, але він не потрібен, бо ми обробляємо drop на SortableItem
  // const handleDrop = (chartType) => {
  //   setComponents([...components, { id: Date.now(), type: chartType }]);
  // };

  return (
    <div className="drop-zone">
      {components.map((comp) => (
        <SortableItem
          key={comp.id}
          type={comp.type}
          data={data}
          Charts={Charts}
        />
      ))}
      <div className="drop-instructions">Перетягніть графік сюди</div>
    </div>
  );
}
