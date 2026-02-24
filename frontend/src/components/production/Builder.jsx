import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove
} from "@dnd-kit/sortable";

import SortableItem from "./SortableItem";

const COLUMN_WIDTH = 600;
const GAP = 20;

export default function Builder() {
  const [components, setComponents] = useState([
    { id: "1", w: 580, h: 400 },
    { id: "2", w: 580, h: 450 },
    { id: "3", w: 580, h: 350 }
  ]);

  // 🔥 Masonry layout engine
  const relayout = (items) => {
    const cols = [0, 0];

    return items.map((item) => {
      const col = cols[0] <= cols[1] ? 0 : 1;

      const x = col * COLUMN_WIDTH;
      const y = cols[col];

      cols[col] += item.h + GAP;

      return { ...item, x, y };
    });
  };

  useEffect(() => {
    setComponents((prev) => relayout(prev));
  }, []);

  const handleResize = (id, size) => {
    setComponents((prev) => {
      const updated = prev.map((c) =>
        c.id === id
          ? { ...c, w: size.width, h: size.height }
          : c
      );

      return relayout(updated);
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    setComponents((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);

      const reordered = arrayMove(prev, oldIndex, newIndex);
      return relayout(reordered);
    });
  };

  return (
    <div
      style={{
        position: "relative",
        width: "1200px",
        margin: "0 auto",
        minHeight: "1000px"
      }}
    >
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={components.map((c) => c.id)}>
          {components.map((comp) => (
            <SortableItem
              key={comp.id}
              id={comp.id}
              width={comp.w}
              height={comp.h}
              onResize={handleResize}
              style={{
                position: "absolute",
                left: comp.x,
                top: comp.y
              }}
            >
              <div
                style={{
                  padding: 20,
                  background: "#f5f5f5",
                  height: "100%"
                }}
              >
                Widget {comp.id}
              </div>
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}