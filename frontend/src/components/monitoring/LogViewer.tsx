import React, { useState, useEffect } from 'react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  serviceName: string;
  traceId?: string;
  message: string;
  metadata?: Record<string, any>;
}

interface LogStats {
  total: number;
  byLevel: Record<string, number>;
  errors: LogEntry[];
}

export const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stats, setStats] = useState<LogStats | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedService) {
      fetchLogs();
      fetchStats();
    }
  }, [selectedService]);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/v1/logs/services');
      const data = await response.json();
      setServices(data.services || []);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedService) params.append('serviceName', selectedService);
      if (selectedLevel) params.append('level', selectedLevel);
      if (searchQuery) params.append('message', searchQuery);

      const response = await fetch(`/api/v1/logs/search?${params}`);
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 3600000); // Last hour

      const response = await fetch(
        `/api/v1/logs/stats?serviceName=${selectedService}&startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`
      );
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch log stats:', error);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'debug': return 'text-gray-500 bg-gray-100';
      case 'info': return 'text-blue-500 bg-blue-100';
      case 'warn': return 'text-yellow-500 bg-yellow-100';
      case 'error': return 'text-red-500 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Log Viewer</h1>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">Service</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">All Services</option>
              {services.map((service) => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium mb-1">Level</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">All</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchLogs}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-gray-500 text-sm">Total Logs</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-500">{stats.byLevel?.debug || 0}</div>
            <div className="text-gray-500 text-sm">Debug</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-500">{stats.byLevel?.info || 0}</div>
            <div className="text-gray-500 text-sm">Info</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-500">{stats.byLevel?.warn || 0}</div>
            <div className="text-gray-500 text-sm">Warn</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-500">{stats.byLevel?.error || 0}</div>
            <div className="text-gray-500 text-sm">Error</div>
          </div>
        </div>
      )}

      {/* Log List */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Logs</h2>
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No logs found</div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded border-l-4 ${
                  log.level === 'error'
                    ? 'border-red-500 bg-red-50'
                    : log.level === 'warn'
                    ? 'border-yellow-500 bg-yellow-50'
                    : log.level === 'info'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-500 bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                    {log.level.toUpperCase()}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm">{log.message}</div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>{log.serviceName}</span>
                      {log.traceId && (
                        <span className="font-mono">trace: {log.traceId.substring(0, 8)}...</span>
                      )}
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>
                  </div>
                </div>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogViewer;
