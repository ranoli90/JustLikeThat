import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { WidgetType } from '../../types/analytics';

interface WidgetLibraryProps {
  onAddWidget: (type: WidgetType, title: string) => void;
}

interface WidgetItem {
  type: WidgetType;
  title: string;
  icon: string;
  category: string;
}

const WIDGET_TEMPLATES: WidgetItem[] = [
  { type: 'metric', title: 'Metric Card', icon: '📊', category: 'Metrics' },
  { type: 'line_chart', title: 'Line Chart', icon: '📈', category: 'Charts' },
  { type: 'bar_chart', title: 'Bar Chart', icon: '📊', category: 'Charts' },
  { type: 'pie_chart', title: 'Pie Chart', icon: '🥧', category: 'Charts' },
  { type: 'area_chart', title: 'Area Chart', icon: '📉', category: 'Charts' },
  { type: 'scatter', title: 'Scatter Plot', icon: '⚬', category: 'Charts' },
  { type: 'table', title: 'Data Table', icon: '📋', category: 'Data' },
  { type: 'heatmap', title: 'Heatmap', icon: '🔥', category: 'Maps' },
  { type: 'funnel', title: 'Funnel Chart', icon: '🔻', category: 'Conversion' },
  { type: 'cohort', title: 'Cohort Analysis', icon: '📅', category: 'Retention' },
  { type: 'gauge', title: 'Gauge', icon: '⚡', category: 'Metrics' },
  { type: 'timeline', title: 'Timeline', icon: '⏱️', category: 'Data' },
  { type: 'list', title: 'List View', icon: '📝', category: 'Data' },
  { type: 'map', title: 'Map', icon: '🗺️', category: 'Maps' },
];

const DraggableWidget: React.FC<{
  widget: WidgetItem;
  onAddWidget: (type: WidgetType, title: string) => void;
}> = ({ widget, onAddWidget }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `template-${widget.type}`,
    data: { type: widget.type, title: widget.title },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`widget-template ${isDragging ? 'dragging' : ''}`}
      onClick={() => onAddWidget(widget.type, widget.title)}
    >
      <span className="widget-icon">{widget.icon}</span>
      <span className="widget-title">{widget.title}</span>
    </div>
  );
};

export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({ onAddWidget }) => {
  const categories = [...new Set(WIDGET_TEMPLATES.map((w) => w.category))];

  return (
    <div className="widget-library">
      <h3>Widget Library</h3>
      <p className="library-description">
        Drag or click to add widgets to your dashboard
      </p>

      {categories.map((category) => (
        <div key={category} className="widget-category">
          <h4>{category}</h4>
          <div className="widget-grid">
            {WIDGET_TEMPLATES.filter((w) => w.category === category).map((widget) => (
              <DraggableWidget
                key={widget.type}
                widget={widget}
                onAddWidget={onAddWidget}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WidgetLibrary;
