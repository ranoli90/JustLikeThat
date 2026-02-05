import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Node, Edge, Connection, Background, Controls, MiniMap, useNodesState, useEdgesState, addEdge, MarkerType, NodeTypes } from 'reactflow';
import 'reactflow/dist/style.css';
import NodePalette from './NodePalette';
import ConnectionManager from './ConnectionManager';
import ExpressionBuilder from './ExpressionBuilder';

// Node type definitions
export interface WorkflowNodeData {
  id: string;
  type: string;
  label: string;
  config: Record<string, any>;
  onConfigChange?: (config: Record<string, any>) => void;
}

export interface WorkflowDefinition {
  nodes: WorkflowNodeData[];
  connections: Edge[];
  settings: {
    entryPoint?: string;
    exitPoint?: string;
    parallelLimit?: number;
    timeout?: number;
  };
}

// Node component wrapper for custom rendering
const NodeWrapper: React.FC<{ data: WorkflowNodeData }> = ({ data }) => {
  const getNodeColor = (type: string) => {
    if (type.startsWith('trigger.')) return '#10B981'; // Green for triggers
    if (type.startsWith('action.')) return '#3B82F6'; // Blue for actions
    if (type.startsWith('condition.')) return '#F59E0B'; // Amber for conditions
    if (type.startsWith('flow.')) return '#8B5CF6'; // Purple for flow
    if (type.startsWith('error.')) return '#EF4444'; // Red for errors
    return '#6B7280'; // Gray default
  };

  return (
    <div
      className="workflow-node"
      style={{
        backgroundColor: getNodeColor(data.type),
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        minWidth: '120px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '2px solid transparent',
        cursor: 'grab',
      }}
    >
      <div style={{ fontWeight: 600, fontSize: '14px' }}>{data.label}</div>
      <div style={{ fontSize: '11px', opacity: 0.8 }}>{data.type}</div>
    </div>
  );
};

// Default node types
const nodeTypes: NodeTypes = {
  custom: NodeWrapper,
};

interface WorkflowDesignerProps {
  initialDefinition?: WorkflowDefinition;
  onSave?: (definition: WorkflowDefinition) => void;
  onAutoSave?: (definition: WorkflowDefinition) => void;
  readOnly?: boolean;
}

const WorkflowDesigner: React.FC<WorkflowDesignerProps> = ({
  initialDefinition,
  onSave,
  onAutoSave,
  readOnly = false,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showExpressionBuilder, setShowExpressionBuilder] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize from definition or create default
  useEffect(() => {
    if (initialDefinition) {
      const initialNodes: Node[] = initialDefinition.nodes.map((node, index) => ({
        id: node.id,
        type: 'custom',
        position: { x: 100 + index * 200, y: 100 + Math.random() * 100 },
        data: node,
      }));
      setNodes(initialNodes);
      setEdges(initialDefinition.connections);
    }
  }, [initialDefinition, setNodes, setEdges]);

  // Auto-save timer
  useEffect(() => {
    if (onAutoSave && !readOnly) {
      autoSaveTimerRef.current = setInterval(() => {
        const definition: WorkflowDefinition = {
          nodes: nodes.map(n => n.data as WorkflowNodeData),
          connections: edges,
          settings: {},
        };
        onAutoSave(definition);
      }, 30000); // 30 seconds
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [nodes, edges, onAutoSave, readOnly]);

  // Handle connection
  const onConnect = useCallback(
    (params: Connection) => {
      if (readOnly) return;
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#6B7280', strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [setEdges, readOnly]
  );

  // Handle node drag over
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle node drop from palette
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (readOnly) return;

      const nodeType = event.dataTransfer.getData('application/reactflow');
      if (!nodeType) return;

      const reactFlowBounds = (event.target as Element).getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'custom',
        position,
        data: {
          id: `node-${Date.now()}`,
          type: nodeType,
          label: getNodeLabel(nodeType),
          config: getDefaultConfig(nodeType),
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, readOnly]
  );

  // Handle node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Handle node config change
  const handleNodeConfigChange = useCallback(
    (config: Record<string, any>) => {
      if (!selectedNode) return;

      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === selectedNode.id) {
            return {
              ...node,
              data: {
                ...node.data,
                config: { ...node.data.config, ...config },
              },
            };
          }
          return node;
        })
      );
    },
    [selectedNode, setNodes]
  );

  // Handle delete node
  const handleDeleteNode = useCallback(() => {
    if (!selectedNode || readOnly) return;

    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter(
        (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id
      )
    );
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges, readOnly]);

  // Handle save
  const handleSave = useCallback(() => {
    const definition: WorkflowDefinition = {
      nodes: nodes.map((n) => n.data as WorkflowNodeData),
      connections: edges,
      settings: {},
    };
    onSave?.(definition);
  }, [nodes, edges, onSave]);

  return (
    <div className="workflow-designer" style={{ display: 'flex', height: '100vh' }}>
      {/* Node Palette */}
      {!readOnly && (
        <div style={{ width: '250px', borderRight: '1px solid #E5E7EB', padding: '16px' }}>
          <NodePalette onDragStart={(type) => {
            event?.dataTransfer.setData('application/reactflow', type);
          }} />
        </div>
      )}

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={readOnly ? undefined : onNodesChange}
          onEdgesChange={readOnly ? undefined : onEdgesChange}
          onConnect={readOnly ? undefined : onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#6B7280', strokeWidth: 2 },
          }}
        >
          <Background color="#E5E7EB" gap={15} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const type = (node.data as WorkflowNodeData).type;
              if (type.startsWith('trigger.')) return '#10B981';
              if (type.startsWith('action.')) return '#3B82F6';
              if (type.startsWith('condition.')) return '#F59E0B';
              return '#6B7280';
            }}
          />
        </ReactFlow>

        {/* Toolbar */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            display: 'flex',
            gap: '8px',
          }}
        >
          <button
            onClick={() => setShowExpressionBuilder(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6B7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Expression Builder
          </button>
          {!readOnly && (
            <button
              onClick={handleSave}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Save
            </button>
          )}
        </div>
      </div>

      {/* Connection Manager / Node Config Panel */}
      {selectedNode && (
        <div
          style={{
            width: '300px',
            borderLeft: '1px solid #E5E7EB',
            padding: '16px',
            overflowY: 'auto',
          }}
        >
          <ConnectionManager
            node={selectedNode}
            edges={edges}
            onConfigChange={handleNodeConfigChange}
            onDelete={handleDeleteNode}
            onClose={() => setSelectedNode(null)}
          />
        </div>
      )}

      {/* Expression Builder Modal */}
      {showExpressionBuilder && (
        <ExpressionBuilder
          onClose={() => setShowExpressionBuilder(false)}
          onApply={(expression) => {
            handleNodeConfigChange({ condition: expression });
            setShowExpressionBuilder(false);
          }}
        />
      )}
    </div>
  );
};

// Helper functions
function getNodeLabel(type: string): string {
  const labels: Record<string, string> = {
    'trigger.webhook': 'Webhook Trigger',
    'trigger.schedule': 'Schedule Trigger',
    'trigger.event': 'Event Trigger',
    'trigger.api': 'API Trigger',
    'trigger.manual': 'Manual Trigger',
    'action.http': 'HTTP Request',
    'action.email': 'Send Email',
    'action.database': 'Database Action',
    'action.transform': 'Transform Data',
    'action.notification': 'Notification',
    'action.script': 'Run Script',
    'condition.if': 'If Condition',
    'condition.switch': 'Switch',
    'flow.parallel': 'Parallel',
    'flow.loop': 'Loop',
    'flow.delay': 'Delay',
    'flow.subworkflow': 'Sub-Workflow',
    'flow.terminator': 'Terminator',
    'error.handler': 'Error Handler',
    'error.compensation': 'Compensation',
    'error.retry': 'Retry',
  };
  return labels[type] || type;
}

function getDefaultConfig(type: string): Record<string, any> {
  const configs: Record<string, any> = {
    'trigger.webhook': { method: 'POST', path: '' },
    'trigger.schedule': { cronExpression: '* * * * *', timezone: 'UTC' },
    'action.http': { method: 'GET', url: '', headers: {} },
    'action.email': { to: '', subject: '', body: '' },
    'condition.if': { conditions: [] },
    'flow.delay': { delayMs: 1000 },
  };
  return configs[type] || {};
}

export default WorkflowDesigner;
