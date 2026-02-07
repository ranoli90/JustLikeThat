import React from 'react';

interface NodePaletteItem {
  type: string;
  label: string;
  category: string;
  icon?: string;
}

const NODE_ITEMS: NodePaletteItem[] = [
  // Triggers
  { type: 'trigger.webhook', label: 'Webhook', category: 'Triggers', icon: '🪝' },
  { type: 'trigger.schedule', label: 'Schedule', category: 'Triggers', icon: '⏰' },
  { type: 'trigger.event', label: 'Event', category: 'Triggers', icon: '⚡' },
  { type: 'trigger.api', label: 'API', category: 'Triggers', icon: '🔗' },
  { type: 'trigger.manual', label: 'Manual', category: 'Triggers', icon: '👆' },
  
  // Actions
  { type: 'action.http', label: 'HTTP Request', category: 'Actions', icon: '🌐' },
  { type: 'action.email', label: 'Send Email', category: 'Actions', icon: '📧' },
  { type: 'action.database', label: 'Database', category: 'Actions', icon: '🗄️' },
  { type: 'action.transform', label: 'Transform', category: 'Actions', icon: '🔄' },
  { type: 'action.notification', label: 'Notification', category: 'Actions', icon: '🔔' },
  { type: 'action.script', label: 'Script', category: 'Actions', icon: '📜' },
  { type: 'action.service', label: 'Service Call', category: 'Actions', icon: '🔧' },
  
  // Conditions
  { type: 'condition.if', label: 'If', category: 'Logic', icon: '❓' },
  { type: 'condition.switch', label: 'Switch', category: 'Logic', icon: '🔀' },
  { type: 'condition.filter', label: 'Filter', category: 'Logic', icon: '🔍' },
  
  // Flow Control
  { type: 'flow.parallel', label: 'Parallel', category: 'Flow', icon: '⚡' },
  { type: 'flow.loop', label: 'Loop', category: 'Flow', icon: '🔁' },
  { type: 'flow.delay', label: 'Delay', category: 'Flow', icon: '⏳' },
  { type: 'flow.subworkflow', label: 'Sub-Workflow', category: 'Flow', icon: '📦' },
  { type: 'flow.parallel_merge', label: 'Merge', category: 'Flow', icon: '🔗' },
  { type: 'flow.terminator', label: 'Terminator', category: 'Flow', icon: '🏁' },
  
  // Error Handling
  { type: 'error.handler', label: 'Error Handler', category: 'Error', icon: '🛡️' },
  { type: 'error.compensation', label: 'Compensation', category: 'Error', icon: '↩️' },
  { type: 'error.retry', label: 'Retry', category: 'Error', icon: '🔄' },
];

interface NodePaletteProps {
  onDragStart?: (type: string, event: React.DragEvent) => void;
}

const NodePalette: React.FC<NodePaletteProps> = ({ onDragStart }) => {
  const [expandedCategories, setExpandedCategories] = React.useState<string[]>([
    'Triggers',
    'Actions',
    'Logic',
    'Flow',
    'Error',
  ]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      (prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category])
    );
  };

  const groupedNodes = NODE_ITEMS.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, NodePaletteItem[]>);

  const handleDragStart = (type: string, event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.effectAllowed = 'move';
    onDragStart?.(type, event);
  };

  return (
    <div className="node-palette">
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>
        Node Palette
      </h3>
      
      {Object.entries(groupedNodes).map(([category, items]) => (
        <div key={category} style={{ marginBottom: '8px' }}>
          <button
            onClick={() => toggleCategory(category)}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#F3F4F6',
              border: 'none',
              borderRadius: '6px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 500,
              fontSize: '13px',
            }}
          >
            <span>{category}</span>
            <span>{expandedCategories.includes(category) ? '▼' : '▶'}</span>
          </button>
          
          {expandedCategories.includes(category) && (
            <div style={{ marginTop: '4px', paddingLeft: '8px' }}>
              {items.map((item) => (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => handleDragStart(item.type, e)}
                  style={{
                    padding: '8px 12px',
                    marginBottom: '2px',
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '4px',
                    cursor: 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                    e.currentTarget.style.borderColor = '#3B82F6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}
                >
                  <span>{item.icon}</span>
                  <span style={{ fontSize: '13px' }}>{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      
      <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#FEF3C7', borderRadius: '6px', fontSize: '12px', color: '#92400E' }}>
        💡 Drag nodes to the canvas to build your workflow
      </div>
    </div>
  );
};

export default NodePalette;
