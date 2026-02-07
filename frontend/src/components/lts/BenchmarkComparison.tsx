// Benchmark Comparison Component - Sprint 49
import React, { useState, useEffect } from 'react';
import ltsService from '../../services/lts.service';

const BenchmarkComparison: React.FC = () => {
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBenchmarkData();
  }, []);

  const loadBenchmarkData = async () => {
    setLoading(true);
    try {
      const [benchData, compData] = await Promise.all([
        ltsService.getBenchmarks(),
        ltsService.compareWithBenchmarks(),
      ]);
      setBenchmarks(benchData);
      setComparison(compData);
    } catch (err) {
      console.error('Failed to load benchmark data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading benchmarks...</div>;
  }

  return (
    <div className="lts-benchmarks p-6">
      <h1 className="mb-6 text-2xl font-bold">Benchmark Comparison</h1>

      {comparison && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="rounded-lg bg-white p-6 text-center shadow">
            <div className="mb-2 text-sm text-gray-500">Overall Benchmark Score</div>
            <div className="text-5xl font-bold text-blue-600">{comparison.overallScore}%</div>
            <div className="mt-2 text-sm text-gray-400">Based on industry standards</div>
          </div>

          {/* Comparison Table */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="border-b p-4">
              <h3 className="font-semibold">Performance vs Benchmarks</h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Metric</th>
                  <th className="px-4 py-2 text-left">Our Value</th>
                  <th className="px-4 py-2 text-left">Industry Avg</th>
                  <th className="px-4 py-2 text-left">Best Practice</th>
                  <th className="px-4 py-2 text-left">Gap</th>
                </tr>
              </thead>
              <tbody>
                {comparison.comparisons?.map((comp: any, i: number) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2 capitalize">{comp.metric}</td>
                    <td className="px-4 py-2 font-semibold">{comp.ourValue}%</td>
                    <td className="px-4 py-2">{comp.industryAverage}%</td>
                    <td className="px-4 py-2">{comp.bestPractice}%</td>
                    <td className="px-4 py-2">
                      <span className={comp.gap > 0 ? 'text-red-600' : 'text-green-600'}>
                        {comp.gap > 0 ? '+' : ''}{comp.gap}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recommendations */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="mb-4 font-semibold">Improvement Areas</h3>
            <ul className="space-y-2">
              {comparison.recommendations?.map((rec: string, i: number) => (
                <li key={i} className="flex items-start gap-2 rounded bg-yellow-50 p-2">
                  <span className="text-yellow-600">⚠</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Stored Benchmarks */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="mb-4 font-semibold">Stored Benchmarks</h3>
            <div className="grid grid-cols-3 gap-4">
              {benchmarks.map((bench) => (
                <div key={bench.id} className="rounded border p-3">
                  <div className="font-medium">{bench.name}</div>
                  <div className="text-sm capitalize text-gray-500">{bench.category}</div>
                  <div className="text-xs text-gray-400">{bench.source}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BenchmarkComparison;
