export default function WidgetCard({ title, children, onRemove }) {
  return (
    <div className="widget-card">
      <div className="widget-header">
        <h4>{title}</h4>
        {onRemove && (
          <button onClick={onRemove}>✕</button>
        )}
      </div>
      <div className="widget-body">
        {children}
      </div>
    </div>
  );
}