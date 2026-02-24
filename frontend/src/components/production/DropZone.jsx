import SortableItem from "./SortableItem";

export default function DropZone({ components, setComponents, data, Charts }) {
  const handleDrop = (chartType) => {
    setComponents([...components, { id: Date.now(), type: chartType }]);
  };

  return (
    <div className="drop-zone">
      {components.map(comp => (
        <SortableItem key={comp.id} type={comp.type} data={data} Charts={Charts} />
      ))}
      <div className="drop-instructions">Перетягніть графік сюди</div>
    </div>
  );
}