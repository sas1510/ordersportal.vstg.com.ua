import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';

export default function SortableItem({ id, children, colSpan, rowSpan, onResizeStop, gridConfig }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const { rowHeight, gap } = gridConfig;

  const getWidthPx = () => {
    const containerWidth = window.innerWidth - 60; 
    const oneColWidth = (containerWidth - (gap * (6 - 1))) / 6;
    return (oneColWidth * colSpan) + (gap * (colSpan - 1));
  };

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    gridColumn: `span ${colSpan}`,
    gridRow: `span ${rowSpan}`,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.5 : 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    minHeight: '100%',
    touchAction: 'none' // Важливо для dnd-kit
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Resizable
        width={getWidthPx()}
        height={rowSpan * rowHeight}
        onResizeStop={(e, data) => {
          // Зупиняємо спливання події, щоб dnd-kit не перехопив її
          e.stopPropagation();
          onResizeStop(id, data.size);
        }}
        // Створюємо кастомний handle, який ігнорує події dnd-kit
        handle={
          <span 
            className="custom-resize-handle"
            onMouseDown={(e) => e.stopPropagation()} 
            onTouchStart={(e) => e.stopPropagation()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
               <path d="M21 15v6h-6M21 21L12 12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        }
      >
        <div style={{
          width: '100%',
          height: '100%',
          background: '#fff',
          borderRadius: '10px',
          border: isDragging ? '1px solid #007bff' : '1px solid #eee',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          {/* DRAG HANDLE - Тільки тут діють listeners */}
          <div 
            {...attributes} 
            {...listeners} 
            style={{
              height: '28px',
              background: '#fafafa',
              cursor: 'grab',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#ccc',
              borderBottom: '1px solid #f0f0f0',
              userSelect: 'none',
              flexShrink: 0
            }}
          >
            ⠿
          </div>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', pointerEvents: 'auto' }}>
            {children}
          </div>
        </div>
      </Resizable>

      <style jsx global>{`
        .custom-resize-handle {
          position: absolute;
          right: 2px;
          bottom: 2px;
          cursor: se-resize;
          z-index: 100;
          padding: 5px;
          line-height: 0;
        }
        .react-resizable-handle {
            display: none; /* Приховуємо стандартний handle бібліотеки */
        }
      `}</style>
    </div>
  );
}