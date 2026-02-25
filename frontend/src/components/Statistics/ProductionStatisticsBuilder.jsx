import React, { useState, useEffect, useMemo, useRef } from "react";
import axiosInstance from "../../api/axios"; 
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
import { useNotification } from "../../components/notification/Notifications";

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

// --- Константи ---
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

const DEFAULT_LAYOUT = Object.entries(WIDGET_DEFAULTS).map(([type, sizes], index) => ({
  id: `default-${type}-${index}`, // Унікальний ID для початкового стану
  type,
  ...sizes
}));


function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function ProductionStatisticsBuilder({ rawData, dealerData }) {
  const { addNotification } = useNotification();
  
  const GRID_COLUMNS = 12; 
  const GRID_ROW_HEIGHT = 15;
  const GAP = 20;
  const MIN_COL = 2;
  const MIN_ROW = 10;

  // --- Стейт дашбордів ---
  const [dashboards, setDashboards] = useState([]); 
  const [activeDashId, setActiveDashId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("idle"); 

  // --- Стейт Модалки ---
  const [modalOpen, setModalOpen] = useState(false);
  const [modalValue, setModalValue] = useState("");
  const [modalMode, setModalMode] = useState("create"); // "create", "rename", "delete", "reset"

  // --- Стейт UI ---
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeSubCategory, setActiveSubCategory] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [lastAddedId, setLastAddedId] = useState(null);

  const isInitializing = useRef(true);
  const lastSavedData = useRef(null);

  // 1. Завантаження
  useEffect(() => {
    const fetchLayouts = async () => {
      try {
        const res = await axiosInstance.get("/user-dashboard-settings/");
        if (res.data?.dashboards?.length > 0) {
          setDashboards(res.data.dashboards);
          setActiveDashId(res.data.dashboards[0].id);
        } else {
          const initial = [{ id: Date.now(), name: "Мій Дашборд", components: DEFAULT_LAYOUT }];
          setDashboards(initial);
          setActiveDashId(initial[0].id);
        }
      } catch (err) {
        addNotification("Не вдалося завантажити налаштування", "error");
        setDashboards([{ id: Date.now(), name: "Стандарт", components: DEFAULT_LAYOUT }]);
        setActiveDashId(Date.now());
      } finally {
        setLoading(false);
        setTimeout(() => { isInitializing.current = false; }, 800);
      }
    };
    fetchLayouts();
  }, []);

  // 2. Автозбереження
  const debouncedDashboards = useDebounce(dashboards, 2500);
  useEffect(() => {
    if (loading || isInitializing.current) return;
    const currentStr = JSON.stringify(debouncedDashboards);
    if (currentStr === lastSavedData.current) return;

    const autoSave = async () => {
      setSaveStatus("saving");
      try {
        await axiosInstance.post("/user-dashboard-settings/", { dashboards: debouncedDashboards });
        lastSavedData.current = currentStr;
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } catch (err) {
        setSaveStatus("error");
        addNotification("Помилка автозбереження", "error");
      }
    };
    autoSave();
  }, [debouncedDashboards, loading]);

  const activeDashboard = useMemo(() => 
    dashboards.find(d => d.id === activeDashId) || null
  , [dashboards, activeDashId]);

  const components = activeDashboard?.components || [];

  const updateActiveComponents = (newComponentsOrFn) => {
    setDashboards(prev => prev.map(d => {
      if (d.id !== activeDashId) return d;
      const nextComps = typeof newComponentsOrFn === 'function' 
        ? newComponentsOrFn(d.components) 
        : newComponentsOrFn;
      return { ...d, components: nextComps };
    }));
  };

  // --- Управління Модалкою ---
  const openModal = (mode) => {
    setModalMode(mode);
    if (mode === "rename") setModalValue(activeDashboard?.name || "");
    else if (mode === "create") setModalValue("");
    setModalOpen(true);
  };

  const handleModalSubmit = () => {
  if (modalMode === "create") {
    if (!modalValue.trim()) return;
    const newDash = { 
      id: Date.now(), 
      name: modalValue, 
      components: DEFAULT_LAYOUT // Новий дашборд тепер одразу повний
    };
    setDashboards(prev => [...prev, newDash]);
    setActiveDashId(newDash.id);
    addNotification(`Дашборд "${modalValue}" створено`, "success");
  } 
  else if (modalMode === "rename") {
    if (!modalValue.trim()) return;
    setDashboards(prev => prev.map(d => d.id === activeDashId ? { ...d, name: modalValue } : d));
    addNotification("Назву змінено", "info");
  } 
  else if (modalMode === "delete") {
    if (dashboards.length <= 1) return;
    const filtered = dashboards.filter(d => d.id !== activeDashId);
    setDashboards(filtered);
    setActiveDashId(filtered[0].id);
    addNotification("Дашборд видалено", "info");
  } 
  else if (modalMode === "reset") {
    // Скидаємо саме до того переліку, який ви вказали як стандартний
    updateActiveComponents(DEFAULT_LAYOUT);
    addNotification("Дашборд скинуто до стандартного вигляду", "info");
  }
  setModalOpen(false);
};

  // --- Логіка віджетів (chartRegistry залишився без змін) ---
  const chartRegistry = {
    PrefixCategoryDisplay: { title: "Аналітика замовлень", icon: "fa-credit-card-alt", component: PrefixCategoryDisplay, getData: () => ({ prefixData: dealerData?.prefixes || [] }) },
    ComplexityDonut: { 
        title: "Розподіл за категоріями", icon: "fa-pie-chart", component: ComplexityDonut, 
        getData: () => {
            const groups = {};
            (rawData?.tables?.tech_details || []).forEach(item => {
                const cat = CATEGORY_MAPPING[item.ConstructionTypeName_UA?.trim()] || "Додатки";
                groups[cat] = (groups[cat] || 0) + parseFloat(item.TotalQuantity || 0);
            });
            return { data: Object.entries(groups).map(([name, value]) => ({ name, value })), onSectorClick: (name) => setSelectedCategory(name) };
        }
    },
    ComplexityTreemap: { 
        title: "Деталізація категорій", icon: "fa-th", component: ComplexityTreemap, 
        getData: () => {
            const filtered = (rawData?.tables?.tech_details || []).filter(item => {
                const cleanName = item.ConstructionTypeName_UA?.trim() || "";
                const parentGroup = CATEGORY_MAPPING[cleanName] || "Додатки";
                return (selectedCategory ? parentGroup === selectedCategory : true) && (activeSubCategory ? cleanName === activeSubCategory : true);
            });
            return { data: filtered.map(i => ({ name: `${i.ConstructionTypeName_UA} (${i.Складність_UA || 'Стандарт'})`, value: parseFloat(i.TotalQuantity || 0) })), isDetail: true, activeGroup: selectedCategory };
        }
    },
    EfficiencyChart: { title: "Обіг (грн)", icon: "fa-line-chart", component: EfficiencyChart, getData: () => ({ data: rawData?.charts?.monthly || [] }) },
    VolumeChart: { title: "Виробництво та оборот", icon: "fa-bar-chart", component: VolumeChart, getData: () => ({ data: rawData?.charts?.monthly || [] }) },
    ProfileColorChart: { title: "Колірна гама", icon: "fa-paint-brush", component: ProfileColorChart, getData: () => ({ data: dealerData?.profile_color || [] }) },
    ProfileSystemChart: { title: "Профільні системи", icon: "fa-windows", component: ProfileSystemChart, getData: () => ({ data: dealerData?.profile_system || [] }) },
    FurnitureChart: { title: "Рейтинг фурнітури", icon: "fa-key", component: FurnitureChart, getData: () => ({ data: dealerData?.hardware?.items || [] }) },
    ColorSystemHeatmap: { 
        title: "Перетин: Системи/Кольори", icon: "fa-th-large", component: ColorSystemHeatmap, 
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

  const subCategories = useMemo(() => {
    const details = rawData?.tables?.tech_details;
    if (!selectedCategory || !Array.isArray(details)) return [];
    const subs = details
      .filter(item => (CATEGORY_MAPPING[item.ConstructionTypeName_UA?.trim()] || "Додатки") === selectedCategory)
      .map(item => item.ConstructionTypeName_UA?.trim())
      .filter(Boolean);
    return [...new Set(subs)].sort();
  }, [selectedCategory, rawData]);

  const addWidget = (type) => {
    const newId = `id-${Date.now()}`;
    const defaultConfig = WIDGET_DEFAULTS[type] || { colSpan: 6, rowSpan: 15 };
    updateActiveComponents(prev => [...prev, { id: newId, type, ...defaultConfig }]);
    setLastAddedId(newId);
    addNotification(`Додано: ${chartRegistry[type].title}`, "success");
    setTimeout(() => {
      const items = document.querySelectorAll('.sortable-item');
      if (items.length > 0) items[items.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setLastAddedId(null), 1000);
    }, 150);
  };

  const adjustSize = (e, id, axis, delta) => {
    e.stopPropagation();
    updateActiveComponents(prev => prev.map(c => {
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
      updateActiveComponents(prev => prev.map(c => 
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
    updateActiveComponents(arrayMove(components, oldIndex, newIndex));
  };

  if (loading) return <div className="builder-loading">Завантаження...</div>;

  return (
    <div className="builder-page">
      {/* Тулбар */}
      <div className="dashboards-toolbar">
        <div className="year-selector">
          <select value={activeDashId} onChange={(e) => setActiveDashId(Number(e.target.value))}>
            {dashboards.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button onClick={() => openModal("create")} title="Створити новий"><i className="fa fa-plus"></i></button>
          <button onClick={() => openModal("rename")} title="Перейменувати"><i className="fa fa-pencil"></i></button>
          <button onClick={() => openModal("reset")} title="Скинути до стандарту"><i className="fa fa-refresh"></i></button>
          <button 
            onClick={() => dashboards.length > 1 && openModal("delete")} 
            className={`btn-delete ${dashboards.length <= 1 ? 'disabled' : ''}`} 
            title="Видалити дашборд"
          >
            <i className="fa fa-trash"></i>
          </button>
        </div>

        {/* <div className="save-indicator">
          {saveStatus === "saving" && <span><i className="fa fa-refresh fa-spin"></i></span>}
          {saveStatus === "saved" && <span className="saved"><i className="fa fa-check"></i> Збережено</span>}
        </div> */}

        <button className={`palette-toggle ${paletteOpen ? 'active' : ''}`} onClick={() => setPaletteOpen(!paletteOpen)}>
          <i className={`fa ${paletteOpen ? 'fa-times' : 'fa-plus'}`}></i>
          {!paletteOpen && <span style={{ margin: '4px' }}>Віджети</span>}
        </button>
      </div>

      {/* Палітра */}
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

      {/* Універсальна Модалка */}
{/* Універсальна Модалка Конструктора */}
{modalOpen && (
  <div className="builder-modal-overlay" onClick={() => setModalOpen(false)}>
    <div className="builder-modal-window" onClick={e => e.stopPropagation()}>
      
      {/* Header */}
      <div className="builder-modal-header">
        <h3>
          {modalMode === "delete" && "Видалення дашборда"}
          {modalMode === "reset" && "Скидання налаштувань"}
          {modalMode === "create" && "Новий дашборд"}
          {modalMode === "rename" && "Перейменувати дашборд"}
        </h3>
        <span className="builder-close-btn" onClick={() => setModalOpen(false)}>
          <i className="fa fa-times"></i>
        </span>
      </div>

      {/* Body */}
      <div className="builder-modal-body">
        {modalMode === "delete" ? (
          <div className="builder-modal-text-center">
            Ви впевнені, що хочете видалити 
            <br />
            <strong className="builder-highlight">"{activeDashboard?.name}"</strong>?
          </div>
        ) : modalMode === "reset" ? (
          <div className="builder-modal-text-center">
            Відновити стандартний набір віджетів для 
            <br />
            <strong>"{activeDashboard?.name}"</strong>?
            <p className="builder-modal-subtext">Поточне розташування та розміри будуть втрачені</p>
          </div>
        ) : (
          <div className="builder-modal-field">
            <label>Назва дашборда</label>
            <input 
              autoFocus
              className="builder-modal-input"
              value={modalValue} 
              onChange={e => setModalValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleModalSubmit()}
              placeholder="Введіть назву..."
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="builder-modal-footer">
        <button className="builder-btn-cancel" onClick={() => setModalOpen(false)}>
          <i className="fa fa-ban"></i> Скасувати
        </button>
        <button 
          className={`builder-btn-confirm ${modalMode === "delete" ? "danger" : ""}`} 
          onClick={handleModalSubmit}
          disabled={(modalMode === "create" || modalMode === "rename") && !modalValue.trim()}
        >
          <i className={`fa ${modalMode === "delete" ? 'fa-trash' : 'fa-check'}`}></i>
          {modalMode === "delete" ? "Видалити" : "Підтвердити"}
        </button>
      </div>
      
    </div>
  </div>
)}
      {/* Сітка */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <SortableContext items={components.map(c => c.id)} strategy={rectSwappingStrategy}>
          <div className="grid-container" style={{
            display: "grid", gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
            gridAutoRows: `${GRID_ROW_HEIGHT}px`, gap: `${GAP}px`
          }}>
            {components.map(comp => {
              const config = chartRegistry[comp.type];
              if (!config) return null;
              return (
                <SortableItem key={comp.id} id={comp.id} colSpan={comp.colSpan} rowSpan={comp.rowSpan} isNew={lastAddedId === comp.id}>
                  <WidgetCard 
                    comp={comp} config={config} GRID_ROW_HEIGHT={GRID_ROW_HEIGHT}
                    selectedCategory={selectedCategory} activeSubCategory={activeSubCategory}
                    subCategories={subCategories} setSelectedCategory={setSelectedCategory}
                    setActiveSubCategory={setActiveSubCategory}
                    onDelete={() => {
                      updateActiveComponents(prev => prev.filter(c => c.id !== comp.id));
                      addNotification("Віджет видалено", "info");
                    }}
                    onAdjustSize={adjustSize} onResizeStart={handleResizeStart}
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

// Решта компонентів (SortableItem, WidgetCard) залишаються без змін...

function SortableItem({ id, children, colSpan, rowSpan, isNew }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : `${transition}, grid-column 0.3s ease, grid-row 0.3s ease`,
    gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}`, zIndex: isDragging ? 10 : 1
  };
  return (
    <div ref={setNodeRef} style={style} className={`sortable-item ${isDragging ? 'is-dragging' : ''} ${isNew ? "highlight-new" : ""}`}>
      {React.Children.map(children, child => 
        React.cloneElement(child, { dragHandleProps: { ...attributes, ...listeners } })
      )}
    </div>
  );
}

function WidgetCard({ 
    comp, config, GRID_ROW_HEIGHT, onDelete, onAdjustSize, onResizeStart, dragHandleProps,
    selectedCategory, activeSubCategory, subCategories, setActiveSubCategory 
}) {
  const Chart = config.component;
  const showSubFilter = comp.type === "ComplexityTreemap" && selectedCategory;

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
          <div className="sub-nav-tabs">
            <button className={`tab-link ${!activeSubCategory ? 'active' : ''}`} onClick={() => setActiveSubCategory(null)}>Всі</button>
            {subCategories.map(sub => (
              <button key={sub} className={`tab-link ${activeSubCategory === sub ? 'active' : ''}`} onClick={() => setActiveSubCategory(sub)}>{sub}</button>
            ))}
          </div>
        )}
        <div className="scrollable-chart-area">
            <div className="chart-wrapper">
                <Chart 
                    key={`${comp.id}-${comp.colSpan}-${comp.rowSpan}-${selectedCategory}-${activeSubCategory}`}
                    width="100%" height="100%" {...config.getData()} 
                />
            </div>
        </div>
      </div>

      <div className="resize-handle" onMouseDown={(e) => onResizeStart(e, comp.id)}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="3">
            <path d="M21 15v6h-6M9 21h12M21 9v12"/>
        </svg>
      </div>
    </div>
  );
}