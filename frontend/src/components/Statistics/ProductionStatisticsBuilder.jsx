import React, { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  rectSwappingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import './ProductionStatisticsBuilder.css';

// Імпорт графіків
import ComplexityDonut from "../charts/ComplexityDonut";
import EfficiencyChart from "../charts/EfficiencyChart";
import VolumeChart from "../charts/VolumeChart";
import PrefixCategoryDisplay from "../charts/PrefixCategoryDisplay";
import FurnitureChart from "../charts/FurnitureChart";
import ProfileColorChart from "../charts/ProfileColorChart";
import ProfileSystemChart from "../charts/ProfileSystemChart";
import ColorSystemHeatmap from "../charts/ColorSystemHeatmap";
import ComplexityTreemap from "../charts/ComplexityTreeMap";

const CATEGORY_MAPPING = {
  "Вікна безшовне зварювання": "Вікна", "Вікно": "Вікна", "Вікно вкл склопакет": "Вікна",
  "Розсувні системи SL76": "Вікна", "Французький балкон": "Вікна",
  "Двері безшовне зварювання": "Двері", "Двері": "Двері", "Міжкімнатні двері": "Двері",
  "Технічні двері ПВХ": "Двері", "Двері Lampre": "Двері",
  "Лиштва": "Додатки", "Москітні сітки": "Додатки", "Підвіконня": "Додатки",
  "Відливи": "Додатки", "Інше": "Додатки"
};


const WIDGET_DEFAULTS = {
  PrefixCategoryDisplay: { colSpan: 12, rowSpan: 25 },
  EfficiencyChart:       { colSpan: 6,  rowSpan: 13 },
  VolumeChart:           { colSpan: 6,  rowSpan: 13 },
  ProfileColorChart:     { colSpan: 6,  rowSpan: 17 },
  ProfileSystemChart:    { colSpan: 6,  rowSpan: 17 },
  ColorSystemHeatmap:    { colSpan: 12, rowSpan: 17 },
  FurnitureChart:        { colSpan: 12, rowSpan: 17 },
  ComplexityDonut:       { colSpan: 12, rowSpan: 17 },
  ComplexityTreemap:     { colSpan: 12, rowSpan: 13 },
};



function SortableItem({ id, children, colSpan, rowSpan, isNew }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : `${transition}, grid-column 0.3s ease, grid-row 0.3s ease`,
    gridColumn: `span ${colSpan}`,
    gridRow: `span ${rowSpan}`,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`sortable-item ${isDragging ? 'is-dragging' : ''} ${isNew ? "highlight-new" : ""}`}
    >
      {React.Children.map(children, child => 
        React.cloneElement(child, { dragHandleProps: { ...attributes, ...listeners } })
      )}
    </div>
  );
}

export default function ProductionStatisticsBuilder({ rawData, dealerData }) {
  const GRID_COLUMNS = 12; 
  const GRID_ROW_HEIGHT = 15;
  const GAP = 20;
  const MIN_COL = 2;
  const MIN_ROW = 10;

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeSubCategory, setActiveSubCategory] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [lastAddedId, setLastAddedId] = useState(null);

  // Початковий набір віджетів
  // В середині ProductionStatisticsBuilder
const [components, setComponents] = useState([
  { id: "comp-1", type: "PrefixCategoryDisplay", colSpan: 12, rowSpan: 25 },
  { id: "comp-2", type: "EfficiencyChart", colSpan: 6, rowSpan: 13 },
  { id: "comp-3", type: "VolumeChart", colSpan: 6, rowSpan: 13 },
  { id: "comp-4", type: "ProfileColorChart", colSpan: 6, rowSpan: 17 },
  { id: "comp-5", type: "ProfileSystemChart", colSpan: 6, rowSpan: 17 },
  { id: "comp-6", type: "ColorSystemHeatmap", colSpan: 12, rowSpan: 17 },
  { id: "comp-7", type: "FurnitureChart", colSpan: 12, rowSpan: 17 },
  { id: "comp-8", type: "ComplexityDonut", colSpan: 12, rowSpan: 17 },
  { id: "comp-9", type: "ComplexityTreemap", colSpan: 12, rowSpan: 13 },
]);

  // Скидаємо підкатегорію при зміні основної категорії
  useEffect(() => { setActiveSubCategory(null); }, [selectedCategory]);

// 1. Завантаження збереженого лейауту
    useEffect(() => {
      const fetchLayout = async () => {
        try {
        const res = await axiosInstance.get("/user-dashboard-settings/");
        if (res.data && res.data.components) {
          setComponents(res.data.components);
        }
      } catch (err) {
        console.log("Використовуємо дефолтний лейаут");
      }
    };
    fetchLayout();
  }, []);

    // 2. Функція збереження
    const saveLayout = async () => {
      try {
        await axiosInstance.post("/user-dashboard-settings/", {
          components: components // Зберігаємо тільки структуру (id, type, colSpan, rowSpan)
        });
        alert("Дашборд збережено успішно!");
      } catch (err) {
        console.error("Помилка збереження:", err);
      }
    };

  const subCategories = useMemo(() => {
    const details = rawData?.tables?.tech_details;
    if (!selectedCategory || !Array.isArray(details)) return [];
    const subs = details
      .filter(item => (CATEGORY_MAPPING[item.ConstructionTypeName_UA?.trim()] || "Додатки") === selectedCategory)
      .map(item => item.ConstructionTypeName_UA?.trim())
      .filter(Boolean);
    return [...new Set(subs)].sort();
  }, [selectedCategory, rawData]);

  // Реєстр доступних віджетів та логіка підготовки даних для них
  const chartRegistry = {
    PrefixCategoryDisplay: { 
        title: "Аналітика замовлень по категоріях", 
        icon: "fa-credit-card-alt", 
        component: PrefixCategoryDisplay, 
        getData: () => ({ prefixData: dealerData?.prefixes || [] }) 
    },
    ComplexityDonut: { 
        title: "Портфель категорій", 
        icon: "fa-pie-chart", 
        component: ComplexityDonut, 
        getData: () => {
            const groups = {};
            (rawData?.tables?.tech_details || []).forEach(item => {
                const cat = CATEGORY_MAPPING[item.ConstructionTypeName_UA?.trim()] || "Додатки";
                groups[cat] = (groups[cat] || 0) + parseFloat(item.TotalQuantity || 0);
            });
            return { 
                data: Object.entries(groups).map(([name, value]) => ({ name, value })), 
                onSectorClick: (name) => setSelectedCategory(name) 
            };
        }
    },
    ComplexityTreemap: { 
        title: "Деталізація категорій конструкцій", 
        icon: "fa-th", 
        component: ComplexityTreemap, 
        getData: () => {
            const filtered = (rawData?.tables?.tech_details || []).filter(item => {
                const cleanName = item.ConstructionTypeName_UA?.trim() || "";
                const parentGroup = CATEGORY_MAPPING[cleanName] || "Додатки";
                const isRightGroup = selectedCategory ? parentGroup === selectedCategory : true;
                const isRightSub = activeSubCategory ? cleanName === activeSubCategory : true;
                return isRightGroup && isRightSub;
            });
            return { 
                data: filtered.map(i => ({ name: `${i.ConstructionTypeName_UA} (${i.Складність_UA || 'Стандарт'})`, value: parseFloat(i.TotalQuantity || 0) })), 
                isDetail: true, 
                activeGroup: selectedCategory 
            };
        }
    },
    EfficiencyChart: { title: "Ефективність", icon: "fa-line-chart", component: EfficiencyChart, getData: () => ({ data: rawData?.charts?.monthly || [] }) },
    VolumeChart: { title: "Обсяги виробництва", icon: "fa-bar-chart", component: VolumeChart, getData: () => ({ data: rawData?.charts?.monthly || [] }) },
    ProfileColorChart: { title: "Кольори", icon: "fa-paint-brush", component: ProfileColorChart, getData: () => ({ data: dealerData?.profile_color || [] }) },
    ProfileSystemChart: { title: "Системи", icon: "fa-windows", component: ProfileSystemChart, getData: () => ({ data: dealerData?.profile_system || [] }) },
    FurnitureChart: { title: "Фурнітура", icon: "fa-key", component: FurnitureChart, getData: () => ({ data: dealerData?.hardware?.items || [] }) },
    ColorSystemHeatmap: { 
        title: "Матриця Система х Колір", 
        icon: "fa-th-large", 
        component: ColorSystemHeatmap, 
        getData: () => {
            const res = [];
            const systems = dealerData?.profile_system || [];
            const colors = dealerData?.profile_color || [];
            systems.forEach(s => {
                const sOrders = s.OrdersNumber?.split(',').map(n => n.trim()) || [];
                colors.forEach(c => {
                    const cOrders = c.OrdersNumber?.split(',').map(n => n.trim()) || [];
                    const inter = sOrders.filter(o => cOrders.includes(o));
                    if (inter.length > 0) res.push({ system: s.ProfileSystem, color: c.ProfileColor, value: inter.length });
                });
            });
            return { data: res };
        }
    }
  };

const addWidget = (type) => {
    const newId = `id-${Date.now()}`;
    
 
   // 1. Отримуємо стандартні розміри з нашого об'єкта (Single Source of Truth)
  const defaultConfig = WIDGET_DEFAULTS[type] || { colSpan: 6, rowSpan: 15 };

  const newWidget = { 
    id: newId, 
    type, 
    ...defaultConfig 
  };

  // 2. ОНОВЛЮЄМО СТЕЙТ (додаємо в кінець списку)
  setComponents(prev => [...prev, newWidget]);
    
    // 2. Помічаємо його як "щойно доданий" для підсвічування
    setLastAddedId(newId);

    // 3. Скролимо вниз після того, як React оновить DOM
    setTimeout(() => {
      // Знаходимо всі елементи віджетів
      const items = document.querySelectorAll('.sortable-item');
      if (items.length > 0) {
        const lastItem = items[items.length - 1];
        lastItem.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' // Центруємо віджет на екрані
        });
      }
      
      // Прибираємо ефект підсвічування через секунду
      setTimeout(() => setLastAddedId(null), 1000);
    }, 150); // Невеликий delay, щоб DOM встиг оновитися
  };

  const adjustSize = (e, id, axis, delta) => {
    e.stopPropagation();
    setComponents(prev => prev.map(c => {
      if (c.id !== id) return c;
      if (axis === "w") return { ...c, colSpan: Math.max(MIN_COL, Math.min(GRID_COLUMNS, c.colSpan + delta)) };
      return { ...c, rowSpan: Math.max(MIN_ROW, c.rowSpan + delta) };
    }));
  };

  const handleResizeStart = (e, id) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX; const startY = e.clientY;
    const initial = components.find(c => c.id === id);
    const gridElement = e.currentTarget.closest('.grid-container');
    const colWidth = (gridElement.offsetWidth - (GAP * (GRID_COLUMNS - 1))) / GRID_COLUMNS;

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      setComponents(prev => prev.map(c => 
        c.id === id ? { 
          ...c, 
          colSpan: Math.max(MIN_COL, Math.min(GRID_COLUMNS, initial.colSpan + Math.round(deltaX / (colWidth + GAP)))),
          rowSpan: Math.max(MIN_ROW, initial.rowSpan + Math.round(deltaY / GRID_ROW_HEIGHT))
        } : c
      ));
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = components.findIndex(c => c.id === active.id);
    const newIndex = components.findIndex(c => c.id === over.id);
    setComponents(arrayMove(components, oldIndex, newIndex));
  };

  return (
    <div className="builder-page">
      <button className={`palette-toggle ${paletteOpen ? 'active' : ''}`} onClick={() => setPaletteOpen(!paletteOpen)}>
        <i className={`fa ${paletteOpen ? 'fa-times' : 'fa-plus'}`}></i>
        {!paletteOpen && <span style={{ margin: '3px' }}>Віджети</span>}
      </button>

      <div className={`widget-palette ${paletteOpen ? 'open' : ''}`}>
        <div className="palette-header">Бібліотека</div>
        <div className="palette-scroll">
          {Object.keys(chartRegistry).map(type => (
            <div key={type} className="widget-thumb" onClick={() => addWidget(type)}>
              <div className="thumb-box">
                <i className={`fa ${chartRegistry[type].icon} thumb-icon`}></i>
                <span className="thumb-label">{chartRegistry[type].title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <SortableContext items={components.map(c => c.id)} strategy={rectSwappingStrategy}>
          <div
            className="grid-container"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
              gridAutoRows: `${GRID_ROW_HEIGHT}px`,
              gap: `${GAP}px`
            }}
          >
            {components.map(comp => {
              const config = chartRegistry[comp.type];
              if (!config) return null;
              return (
                <SortableItem key={comp.id} id={comp.id} colSpan={comp.colSpan} rowSpan={comp.rowSpan} isNew={lastAddedId === comp.id}>
                  <WidgetCard 
                    comp={comp} 
                    config={config} 
                    GRID_ROW_HEIGHT={GRID_ROW_HEIGHT}
                    selectedCategory={selectedCategory}
                    activeSubCategory={activeSubCategory}
                    subCategories={subCategories}
                    onDelete={() => setComponents(prev => prev.filter(c => c.id !== comp.id))}
                    onAdjustSize={adjustSize}
                    onResizeStart={handleResizeStart}
                    setSelectedCategory={setSelectedCategory}
                    setActiveSubCategory={setActiveSubCategory}
                  />
                </SortableItem>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

// --- Картка віджета (внутрішній компонент) ---
function WidgetCard({ 
    comp, config, GRID_ROW_HEIGHT, onDelete, onAdjustSize, onResizeStart, dragHandleProps,
    selectedCategory, activeSubCategory, subCategories, setSelectedCategory, setActiveSubCategory 
}) {
  const Chart = config.component;
  const showSubFilter = comp.type === "ComplexityTreemap" && selectedCategory;

  const chartHeight = useMemo(() => {
    const totalPx = comp.rowSpan * GRID_ROW_HEIGHT;
    const headerHeight = 42;
    const filterHeight = showSubFilter ? 40 : 0;
    const padding = 24; 
    return Math.max(150, totalPx - headerHeight - filterHeight - padding);
  }, [comp.rowSpan, GRID_ROW_HEIGHT, showSubFilter]);

  return (
    <div className="widget-card">
      <div className="widget-header">
        <div className="header-left" {...dragHandleProps}>
          <i className={`fa ${config.icon} header-icon-analytics`}></i>
          <span className="title-analytics-block">{config.title}</span>
        </div>
        
        <div className="controls-group">
          <span className="control-label">Ширина:</span>
          <div className="size-controls">
            <button className="size-btn" onClick={(e) => onAdjustSize(e, comp.id, "w", 1)}>+</button>
            <button className="size-btn" onClick={(e) => onAdjustSize(e, comp.id, "w", -1)}>-</button>
          </div>

          <span className="control-label">Висота:</span>
          <div className="size-controls">
            <button className="size-btn" onClick={(e) => onAdjustSize(e, comp.id, "h", 2)}>+</button>
            <button className="size-btn" onClick={(e) => onAdjustSize(e, comp.id, "h", -2)}>-</button>
          </div>
          <button className="icon icon-cross delete-btn" onClick={onDelete}></button>
         
        </div>
      </div>

      <div className="widget-content">
        {showSubFilter && (
          <div className="sub-filter-container">
            <button className={`sub-tab ${!activeSubCategory ? 'active' : ''}`} onClick={() => setActiveSubCategory(null)}>Всі</button>
            {subCategories.map(sub => (
              <button key={sub} className={`sub-tab ${activeSubCategory === sub ? 'active' : ''}`} onClick={() => setActiveSubCategory(sub)}>{sub}</button>
            ))}
            <span className="reset-link" onClick={() => setSelectedCategory(null)}>Скинути ×</span>
          </div>
        )}

        <div className="scrollable-chart-area">
            <div className="chart-wrapper" style={{ height: `${chartHeight}px` }}>
                <Chart 
                    key={`${comp.id}-${comp.colSpan}-${comp.rowSpan}-${selectedCategory}-${activeSubCategory}`}
                    width="100%" 
                    height={chartHeight} 
                    {...config.getData()} 
                />
            </div>
        </div>
      </div>

      <div className="resize-handle" onMouseDown={(e) => onResizeStart(e, comp.id)}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="3" strokeLinecap="round">
            <path d="M21 15v6h-6M9 21h12M21 9v12"/>
        </svg>
      </div>
    </div>
  );
}