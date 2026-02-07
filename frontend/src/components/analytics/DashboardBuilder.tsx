import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { SortableWidget } from './SortableWidget';
import { WidgetLibrary } from './WidgetLibrary';
import { WidgetConfig, DashboardLayout } from '../../types/analytics';

interface DashboardBuilderProps {
  initialWidgets?: WidgetConfig[];
  onSave: (widgets: WidgetConfig[]) => void;
  onCancel: () => void;
}

export const DashboardBuilder: React.FC<DashboardBuilderProps> = ({
  initialWidgets = [],
  onSave,
  onCancel,
}) => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(initialWidgets);
  const [selectedWidget, setSelectedWidget] = useState<WidgetConfig | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [layout, setLayout] = useState<DashboardLayout>({
    columns: 12,
    rows: 10,
    rowHeight: 100,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addWidget = useCallback((widgetType: string, title: string) => {
    const newWidget: WidgetConfig = {
      id: `widget-${Date.now()}`,
      type: widgetType as WidgetConfig['type'],
      title,
      position: { x: 0, y: widgets.length },
      size: { width: 4, height: 3 },
      config: {},
    };
    setWidgets([...widgets, newWidget]);
  }, [widgets]);

  const updateWidget = useCallback((id: string, updates: Partial<WidgetConfig>) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
  }, []);

  const removeWidget = useCallback((id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const handleSave = () => {
    onSave(widgets);
  };

  const { setNodeRef } = useDroppable({
    id: 'dashboard-canvas',
  });

  return (
    <div className="dashboard-builder">
      <div className="builder-header">
        <h2>Dashboard Builder</h2>
        <div className="builder-actions">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary">
            Save Dashboard
          </button>
        </div>
      </div>

      <div className="builder-content">
        <div className="widget-library-panel">
          <WidgetLibrary onAddWidget={addWidget} />
        </div>

        <div className="canvas-panel">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div
              ref={setNodeRef}
              className="dashboard-canvas"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
                gap: '16px',
                padding: '16px',
                minHeight: '600px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
              }}
            >
              <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
                {widgets.map((widget) => (
                  <SortableWidget
                    key={widget.id}
                    widget={widget}
                    isSelected={selectedWidget?.id === widget.id}
                    onSelect={() => setSelectedWidget(widget)}
                    onUpdate={(updates) => updateWidget(widget.id, updates)}
                    onRemove={() => removeWidget(widget.id)}
                    columns={layout.columns}
                  />
                ))}
              </SortableContext>
            </div>

            <DragOverlay>
              {activeId ? (
                <div className="drag-overlay">
                  {widgets.find((w) => w.id === activeId)?.title}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {selectedWidget && (
          <div className="widget-properties-panel">
            <h3>Widget Properties</h3>
            <div className="property-group">
              <label>Title</label>
              <input
                type="text"
                value={selectedWidget.title}
                onChange={(e) =>
                  updateWidget(selectedWidget.id, { title: e.target.value })
                }
              />
            </div>
            <div className="property-group">
              <label>Width (columns)</label>
              <input
                type="number"
                min="1"
                max={layout.columns}
                value={selectedWidget.size.width}
                onChange={(e) =>
                  updateWidget(selectedWidget.id, {
                    size: { ...selectedWidget.size, width: parseInt(e.target.value, 10) },
                  })
                }
              />
            </div>
            <div className="property-group">
              <label>Height (rows)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={selectedWidget.size.height}
                onChange={(e) =>
                  updateWidget(selectedWidget.id, {
                    size: { ...selectedWidget.size, height: parseInt(e.target.value, 10) },
                  })
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardBuilder;
