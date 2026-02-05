import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Trace {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  serviceName: string;
  startTime: string;
  duration: number;
  tags: Record<string, any>;
}

interface ServiceInfo {
  name: string;
  spanCount: number;
}

export const TracingDashboard: React.FC = () => {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null);
  const [loading, setLoading] = useState(false);
  const [durationChartData, setDurationChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedService) {
      fetchTraces(selectedService);
    }
  }, [selectedService]);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/v1/tracing/services');
      const data = await response.json();
      setServices(data.services || []);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  };

  const fetchTraces = async (serviceName: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/tracing/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceName, limit: 100 }),
      });
      const data = await response.json();
      setTraces(data.traces || []);
      
      const chartData = (data.traces || []).slice(0, 50).map((t: Trace) => ({
        time: new Date(t.startTime).toLocaleTimeString(),
        duration: t.duration,
      }));
      setDurationChartData(chartData);
    } catch (error) {
      console.error('Failed to fetch traces:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTraceDetails = async (traceId: string) => {
    try {
      const response = await fetch(`/api/v1/tracing/trace/${traceId}`);
      const data = await response.json();
      setSelectedTrace(data.trace?.[0] || null);
    } catch (error) {
      console.error('Failed to fetch trace details:', error);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Distributed Tracing Dashboard</h1>
      
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Services</h2>
        <div className="flex gap-2 flex-wrap">
          {services.map((service) => (
            <button
              key={service.name}
              onClick={() => setSelectedService(service.name)}
              className={`px-4 py-2 rounded ${
                selectedService === service.name
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {service.name} ({service.spanCount})
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Trace Duration Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={durationChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="duration" stroke="#8884d8" name="Duration (ms)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Recent Traces</h2>
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Trace ID</th>
                <th className="p-3 text-left">Operation</th>
                <th className="p-3 text-left">Service</th>
                <th className="p-3 text-left">Duration</th>
                <th className="p-3 text-left">Time</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {traces.map((trace) => (
                <tr key={trace.spanId} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono text-sm">{trace.traceId.substring(0, 8)}...</td>
                  <td className="p-3">{trace.operationName}</td>
                  <td className="p-3">{trace.serviceName}</td>
                  <td className="p-3">{trace.duration}ms</td>
                  <td className="p-3">{new Date(trace.startTime).toLocaleString()}</td>
                  <td className="p-3">
                    <button
                      onClick={() => fetchTraceDetails(trace.traceId)}
                      className="text-blue-500 hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedTrace && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Trace Details</h3>
              <button
                onClick={() => setSelectedTrace(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div><strong>Trace ID:</strong> {selectedTrace.traceId}</div>
              <div><strong>Span ID:</strong> {selectedTrace.spanId}</div>
              <div><strong>Operation:</strong> {selectedTrace.operationName}</div>
              <div><strong>Service:</strong> {selectedTrace.serviceName}</div>
              <div><strong>Duration:</strong> {selectedTrace.duration}ms</div>
              <div>
                <strong>Tags:</strong>
                <pre className="bg-gray-100 p-2 rounded mt-1">
                  {JSON.stringify(selectedTrace.tags, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TracingDashboard;
