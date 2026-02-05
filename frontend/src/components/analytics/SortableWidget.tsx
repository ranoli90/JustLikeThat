import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WidgetConfig } from '../../types/analytics';

interface SortableWidgetProps {
  widget: WidgetConfig;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<WidgetConfig>) => void;
  onRemove: () => void;
  columns: number;
}

export const SortableWidget: React.FC<SortableWidgetProps> = ({
  widget,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
  columns,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${widget.size.width}`,
    gridRow: `span ${widget.size.height}`,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const renderWidgetContent = () => {
    switch (widget.type) {
      case 'metric':
        return (
          <div className="widget-metric">
            <span className="metric-value">--</span>
            <span className="metric-label">{widget.title}</span>
          </div>
        );
      case 'line_chart':
      case 'bar_chart':
      case 'area_chart':
      case 'scatter':
        return (
          <div className="widget-chart">
            <div className="chart-placeholder">
              <span>📊</span>
              <span>{widget.type.replace('_', ' ')}</span>
            </div>
          </div>
        );
      case 'pie_chart':
        return (
          <div className="widget-pie">
            <div className="pie-placeholder">
              <span>🥧</span>
              <span>Distribution</span>
            </div>
          </div>
        );
      case 'table':
        return (
          <div className="widget-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>--</td><td>--</td></tr>
              </tbody>
            </table>
          </div>
        );
      case 'heatmap':
        return (
          <div className="widget-heatmap">
            <div className="heatmap-placeholder">
              <span>🔥</span>
              <span>Heatmap</span>
            </div>
          </div>
        );
      case 'funnel':
        return (
          <div className="widget-funnel">
            <div className="funnel-placeholder">
              <span>🔻</span>
              <span>Funnel</span>
            </div>
          </div>
        );
      case 'cohort':
        return (
          <div className="widget-cohort">
            <div className="cohort-placeholder">
              <span>📅</span>
              <span>Cohort Analysis</span>
            </div>
          </div>
        );
      case 'gauge':
        return (
          <div className="widget-gauge">
            <div className="gauge-placeholder">
              <span>⚡</span>
              <span>0%</span>
            </div>
          </div>
        );
      case 'timeline':
        return (
          <div className="widget-timeline">
            <div className="timeline-placeholder">
              <span>⏱️</span>
              <span>Timeline</span>
            </div>
          </div>
        );
      case 'list':
        return (
          <div className="widget-list">
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
              <li>Item 3</li>
            </ul>
          </div>
        );
      case 'map':
        return (
          <div className="widget-map">
            <div className="map-placeholder">
              <span>🗺️</span>
              <span>Map</span>
            </div>
          </div>
        );
      default:
        return (
          <div className="widget-default">
            <span>{widget.title}</span>
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-widget ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="widget-drag-handle" {...listeners} {...attributes}>
        ⋮⋮
      </div>
      <div className="widget-content">{renderWidgetContent()}</div>
      <div className="widget-header">
        <h5>{widget.title}</h5>
        <button className="widget-remove" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
          ×
        </button>
      </div>
    </div>
  );
};

export default SortableWidget;
