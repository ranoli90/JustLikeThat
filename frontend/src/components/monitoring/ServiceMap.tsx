import React, { useState, useEffect } from 'react';

interface ServiceNode {
  id: string;
  name: string;
  type: 'frontend' | 'backend' | 'database' | 'external';
  status: 'healthy' | 'warning' | 'critical';
  metrics: {
    requestsPerSecond: number;
    latencyP50: number;
    latencyP99: number;
    errorRate: number;
  };
}

interface ServiceEdge {
  source: string;
  target: string;
  requestsPerSecond: number;
  latency: number;
  errorRate: number;
}

export const ServiceMap: React.FC = () => {
  const [services, setServices] = useState<ServiceNode[]>([]);
  const [edges, setEdges] = useState<ServiceEdge[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  useEffect(() => {
    fetchServiceMap();
  }, []);

  const fetchServiceMap = async () => {
    setLoading(true);
    try {
      // In production, this would fetch from the backend
      const mockServices: ServiceNode[] = [
        {
          id: 'frontend',
          name: 'Frontend',
          type: 'frontend',
          status: 'healthy',
          metrics: { requestsPerSecond: 1000, latencyP50: 50, latencyP99: 200, errorRate: 0.1 },
        },
        {
          id: 'api-gateway',
          name: 'API Gateway',
          type: 'backend',
          status: 'healthy',
          metrics: { requestsPerSecond: 800, latencyP50: 20, latencyP99: 100, errorRate: 0.05 },
        },
        {
          id: 'user-service',
          name: 'User Service',
          type: 'backend',
          status: 'warning',
          metrics: { requestsPerSecond: 300, latencyP50: 150, latencyP99: 500, errorRate: 1.2 },
        },
        {
          id: 'application-service',
          name: 'Application Service',
          type: 'backend',
          status: 'healthy',
          metrics: { requestsPerSecond: 400, latencyP50: 100, latencyP99: 300, errorRate: 0.2 },
        },
        {
          id: 'database',
          name: 'PostgreSQL',
          type: 'database',
          status: 'healthy',
          metrics: { requestsPerSecond: 500, latencyP50: 5, latencyP99: 20, errorRate: 0 },
        },
        {
          id: 'redis',
          name: 'Redis Cache',
          type: 'database',
          status: 'healthy',
          metrics: { requestsPerSecond: 2000, latencyP50: 1, latencyP99: 5, errorRate: 0 },
        },
      ];

      const mockEdges: ServiceEdge[] = [
        { source: 'frontend', target: 'api-gateway', requestsPerSecond: 1000, latency: 10, errorRate: 0.1 },
        { source: 'api-gateway', target: 'user-service', requestsPerSecond: 300, latency: 15, errorRate: 0.2 },
        { source: 'api-gateway', target: 'application-service', requestsPerSecond: 400, latency: 15, errorRate: 0.1 },
        { source: 'user-service', target: 'database', requestsPerSecond: 250, latency: 5, errorRate: 0 },
        { source: 'user-service', target: 'redis', requestsPerSecond: 100, latency: 1, errorRate: 0 },
        { source: 'application-service', target: 'database', requestsPerSecond: 250, latency: 5, errorRate: 0 },
        { source: 'application-service', target: 'redis', requestsPerSecond: 300, latency: 1, errorRate: 0 },
      ];

      setServices(mockServices);
      setEdges(mockEdges);
    } catch (error) {
      console.error('Failed to fetch service map:', error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'frontend': return '🖥️';
      case 'backend': return '⚙️';
      case 'database': return '🗄️';
      case 'external': return '🌐';
      default: return '📦';
    }
  };

  const getNodePosition = (index: number, total: number): { x: number; y: number } => {
    const radius = 250;
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const centerX = 400;
    const centerY = 300;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const selectedNode = services.find(s => s.id === selectedService);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Service Map</h1>

      <div className="flex gap-6">
        {/* Service Map Visualization */}
        <div className="flex-1 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Service Dependencies</h2>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <svg viewBox="0 0 800 600" className="w-full h-auto">
              {/* Draw edges */}
              {edges.map((edge, index) => {
                const sourceIndex = services.findIndex(s => s.id === edge.source);
                const targetIndex = services.findIndex(s => s.id === edge.target);
                const sourcePos = getNodePosition(sourceIndex, services.length);
                const targetPos = getNodePosition(targetIndex, services.length);
                
                return (
                  <g key={index}>
                    <line
                      x1={sourcePos.x}
                      y1={sourcePos.y}
                      x2={targetPos.x}
                      y2={targetPos.y}
                      stroke={getServiceStatusColor(services[targetIndex]?.status || 'healthy')}
                      strokeWidth={Math.min(edge.requestsPerSecond / 100, 10)}
                      opacity={0.6}
                    />
                    {/* Arrow */}
                    <polygon
                      points={`${targetPos.x},${targetPos.y}`}
                      fill={getServiceStatusColor(services[targetIndex]?.status || 'healthy')}
                    />
                  </g>
                );
              })}

              {/* Draw nodes */}
              {services.map((service, index) => {
                const position = getNodePosition(index, services.length);
                const isSelected = selectedService === service.id;

                return (
                  <g
                    key={service.id}
                    onClick={() => setSelectedService(isSelected ? null : service.id)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={position.x}
                      cy={position.y}
                      r={isSelected ? 50 : 40}
                      fill={getServiceStatusColor(service.status)}
                      stroke={isSelected ? '#3b82f6' : 'transparent'}
                      strokeWidth={3}
                      opacity={0.8}
                    />
                    <text
                      x={position.x}
                      y={position.y + 5}
                      textAnchor="middle"
                      fontSize="24"
                    >
                      {getServiceTypeIcon(service.type)}
                    </text>
                    <text
                      x={position.x}
                      y={position.y + 65}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      {service.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-green-500"></span>
              <span>Healthy</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-yellow-500"></span>
              <span>Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-red-500"></span>
              <span>Critical</span>
            </div>
          </div>
        </div>

        {/* Service Details Panel */}
        <div className="w-80 bg-white p-4 rounded-lg shadow">
          {selectedNode ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{getServiceTypeIcon(selectedNode.type)}</span>
                <h3 className="text-xl font-bold">{selectedNode.name}</h3>
              </div>

              <div className="mb-4">
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    selectedNode.status === 'healthy'
                      ? 'bg-green-100 text-green-700'
                      : selectedNode.status === 'warning'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {selectedNode.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-sm text-gray-500">Requests/second</div>
                  <div className="text-xl font-bold">
                    {selectedNode.metrics.requestsPerSecond.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-sm text-gray-500">Latency P50</div>
                  <div className="text-xl font-bold">{selectedNode.metrics.latencyP50}ms</div>
                </div>

                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-sm text-gray-500">Latency P99</div>
                  <div className="text-xl font-bold">{selectedNode.metrics.latencyP99}ms</div>
                </div>

                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-sm text-gray-500">Error Rate</div>
                  <div
                    className={`text-xl font-bold ${
                      selectedNode.metrics.errorRate > 1 ? 'text-red-500' : 'text-green-500'
                    }`}
                  >
                    {selectedNode.metrics.errorRate}%
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold mb-2">Dependencies</h4>
                {edges
                  .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                  .map((edge, index) => {
                    const otherService = services.find(
                      s => s.id === (edge.source === selectedNode.id ? edge.target : edge.source)
                    );
                    return (
                      <div key={index} className="flex items-center justify-between py-2 border-b">
                        <span>{otherService?.name}</span>
                        <span className="text-sm text-gray-500">
                          {edge.requestsPerSecond}/s
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Select a service to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceMap;
