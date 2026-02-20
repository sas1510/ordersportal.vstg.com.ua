import { widgetRegistry } from "./widgetRegistry";
import WidgetCard from "./WidgetCard";

export default function DashboardGrid({ widgets, dataResolver, removeWidget }) {
  return (
    <div className="dashboard-grid">
      {widgets.map(widget => {
        const config = widgetRegistry[widget.type];
        if (!config) return null;

        const Component = config.component;

        return (
          <WidgetCard
            key={widget.id}
            title={config.title}
            onRemove={() => removeWidget(widget.id)}
          >
            <Component data={dataResolver(widget.type)} />
          </WidgetCard>
        );
      })}
    </div>
  );
}