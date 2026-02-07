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
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="mb-6 text-2xl font-bold">Log Viewer</h1>

      {/* Filters */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-sm font-medium">Service</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full rounded border p-2"
            >
              <option value="">All Services</option>
              {services.map((service) => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="mb-1 block text-sm font-medium">Level</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full rounded border p-2"
            >
              <option value="">All</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-sm font-medium">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="w-full rounded border p-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchLogs}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mb-6 grid grid-cols-5 gap-4">
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Logs</div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="text-2xl font-bold text-gray-500">{stats.byLevel?.debug || 0}</div>
            <div className="text-sm text-gray-500">Debug</div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="text-2xl font-bold text-blue-500">{stats.byLevel?.info || 0}</div>
            <div className="text-sm text-gray-500">Info</div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="text-2xl font-bold text-yellow-500">{stats.byLevel?.warn || 0}</div>
            <div className="text-sm text-gray-500">Warn</div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="text-2xl font-bold text-red-500">{stats.byLevel?.error || 0}</div>
            <div className="text-sm text-gray-500">Error</div>
          </div>
        </div>
      )}

      {/* Log List */}
      <div className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-4 text-lg font-semibold">Logs</h2>
        {loading ? (
          <div className="py-4 text-center">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="py-4 text-center text-gray-500">No logs found</div>
        ) : (
          <div className="max-h-[600px] space-y-2 overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`rounded border-l-4 p-3 ${
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
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${getLevelColor(log.level)}`}>
                    {log.level.toUpperCase()}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm">{log.message}</div>
                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                      <span>{log.serviceName}</span>
                      {log.traceId && (
                        <span className="font-mono">trace: {log.traceId.substring(0, 8)}...</span>
                      )}
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>
                  </div>
                </div>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <pre className="mt-2 overflow-x-auto rounded bg-gray-100 p-2 text-xs">
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
