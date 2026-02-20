const WidgetCard = ({ title, children, hasHandle }) => (
  <div className="bg-white rounded-xl shadow-md border border-gray-200 h-full flex flex-col overflow-hidden">
    <div className="flex justify-between items-center px-4 py-2 border-b bg-gray-50">
      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
        {title}
      </span>
      {hasHandle && (
        <div className="widget-drag-handle cursor-move text-gray-400">
          ⠿ {/* Іконка перетягування */}
        </div>
      )}
    </div>
    <div className="flex-1 p-4 relative">
      {children}
    </div>
  </div>
);