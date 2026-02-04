'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Select } from './ui/Select';

interface ABTest {
  id: string;
  name: string;
  status: 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'PAUSED';
  variants: ABTestVariant[];
  results?: ABTestResults;
}

interface ABTestVariant {
  id: string;
  name: string;
  template: string;
  voiceStyle: string;
  weight: number;
}

interface ABTestResults {
  variants: {
    id: string;
    name: string;
    score: number;
    conversions: number;
  }[];
  winner: string;
  confidence: number;
}

interface ABTestingPanelProps {
  tests: ABTest[];
  onCreateTest: (test: Partial<ABTest>) => Promise<void>;
  onStartTest: (testId: string) => Promise<void>;
  onStopTest: (testId: string) => Promise<void>;
}

export default function ABTestingPanel({
  tests,
  onCreateTest,
  onStartTest,
  onStopTest,
}: ABTestingPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTest, setNewTest] = useState<{
    name: string;
    documentType: string;
    variants: Array<{
      id: string;
      name: string;
      template: string;
      voiceStyle: string;
      weight: number;
    }>;
  }>({
    name: '',
    documentType: 'RESUME',
    variants: [
      { id: '1', name: 'Variant A', template: 'modern', voiceStyle: 'professional', weight: 50 },
      { id: '2', name: 'Variant B', template: 'creative', voiceStyle: 'innovative', weight: 50 },
    ],
  });

  const handleCreateTest = async () => {
    await onCreateTest(newTest);
    setIsCreating(false);
  };

  const getStatusColor = (status: ABTest['status']) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New Test */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create A/B Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Name
                </label>
                <input
                  type="text"
                  value={newTest.name}
                  onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Modern vs Classic Resume"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type
                </label>
                <Select
                  value={newTest.documentType}
                  onChange={(e) => setNewTest({ ...newTest, documentType: e.target.value })}
                  options={[
                    { value: 'RESUME', label: 'Resume' },
                    { value: 'COVER_LETTER', label: 'Cover Letter' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variants
                </label>
                {newTest.variants.map((variant, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg mb-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500">Name</label>
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) => {
                            const variants = [...newTest.variants];
                            variants[index].name = e.target.value;
                            setNewTest({ ...newTest, variants });
                          }}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Template</label>
                        <Select
                          value={variant.template}
                          onChange={(e) => {
                            const variants = [...newTest.variants];
                            variants[index].template = e.target.value;
                            setNewTest({ ...newTest, variants });
                          }}
                          options={[
                            { value: 'modern', label: 'Modern' },
                            { value: 'classic', label: 'Classic' },
                            { value: 'creative', label: 'Creative' },
                            { value: 'minimalist', label: 'Minimalist' },
                          ]}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Voice Style</label>
                        <Select
                          value={variant.voiceStyle}
                          onChange={(e) => {
                            const variants = [...newTest.variants];
                            variants[index].voiceStyle = e.target.value;
                            setNewTest({ ...newTest, variants });
                          }}
                          options={[
                            { value: 'professional', label: 'Professional' },
                            { value: 'innovative', label: 'Innovative' },
                            { value: 'enthusiastic', label: 'Enthusiastic' },
                            { value: 'formal', label: 'Formal' },
                          ]}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Weight (%)</label>
                        <input
                          type="number"
                          value={variant.weight}
                          onChange={(e) => {
                            const variants = [...newTest.variants];
                            variants[index].weight = parseInt(e.target.value);
                            setNewTest({ ...newTest, variants });
                          }}
                          className="w-full px-2 py-1 text-sm border rounded"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewTest({
                    ...newTest,
                    variants: [...newTest.variants, { id: `${Date.now()}`, name: `Variant ${String.fromCharCode(65 + newTest.variants.length)}`, template: 'modern', voiceStyle: 'professional', weight: 50 }],
                  })}
                >
                  Add Variant
                </Button>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleCreateTest} disabled={!newTest.name}>
                  Create Test
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test List */}
      <div className="space-y-4">
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            Create New A/B Test
          </Button>
        )}

        {tests.map((test) => (
          <Card key={test.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{test.name}</CardTitle>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(test.status)}`}>
                  {test.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {/* Variants */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {test.variants.map((variant) => (
                  <div key={variant.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{variant.name}</p>
                    <p className="text-sm text-gray-500">
                      {variant.template} / {variant.voiceStyle}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Weight: {variant.weight}%
                    </p>
                  </div>
                ))}
              </div>

              {/* Results */}
              {test.results && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-900 mb-2">Results</p>
                  <div className="space-y-2">
                    {test.results.variants.map((variant) => (
                      <div key={variant.id} className="flex justify-between items-center">
                        <span>{variant.name}</span>
                        <span className="font-medium">
                          Score: {variant.score}% ({variant.conversions} conversions)
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-sm text-blue-700">
                      Winner: <strong>{test.results.winner}</strong> with{' '}
                      {test.results.confidence}% confidence
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                {test.status === 'DRAFT' && (
                  <Button size="sm" onClick={() => onStartTest(test.id)}>
                    Start Test
                  </Button>
                )}
                {test.status === 'RUNNING' && (
                  <Button size="sm" variant="outline" onClick={() => onStopTest(test.id)}>
                    Stop Test
                  </Button>
                )}
                {test.status === 'PAUSED' && (
                  <Button size="sm" onClick={() => onStartTest(test.id)}>
                    Resume Test
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
