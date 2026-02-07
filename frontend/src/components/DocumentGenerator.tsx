'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Input } from './ui/Input';
import { TextArea } from './ui/TextArea';

interface DocumentGeneratorProps {
  onGenerate: (options: DocumentGenerationOptions) => Promise<void>;
  isLoading?: boolean;
}

interface DocumentGenerationOptions {
  documentType: 'RESUME' | 'COVER_LETTER' | 'BOTH';
  template: string;
  format: 'PDF' | 'DOCX' | 'HTML';
  voiceStyle: string;
  includeATSOptimization: boolean;
  includeQualityScore: boolean;
}

const RESUME_TEMPLATES = [
  { id: 'modern', name: 'Modern' },
  { id: 'classic', name: 'Classic' },
  { id: 'creative', name: 'Creative' },
  { id: 'minimalist', name: 'Minimalist' },
  { id: 'professional', name: 'Professional' },
];

const COVER_LETTER_TEMPLATES = [
  { id: 'professional-standard', name: 'Professional Standard' },
  { id: 'innovative-startup', name: 'Innovation Focus' },
  { id: 'enthusiastic-candidate', name: 'Enthusiastic Candidate' },
  { id: 'executive-leadership', name: 'Executive Leadership' },
  { id: 'technical-specialist', name: 'Technical Specialist' },
];

const VOICE_STYLES = [
  { id: 'professional', name: 'Professional' },
  { id: 'innovative', name: 'Innovative' },
  { id: 'enthusiastic', name: 'Enthusiastic' },
  { id: 'formal', name: 'Formal' },
  { id: 'conversational', name: 'Conversational' },
  { id: 'technical', name: 'Technical Expert' },
];

const FORMATS = [
  { id: 'PDF', name: 'PDF' },
  { id: 'DOCX', name: 'DOCX' },
  { id: 'HTML', name: 'HTML' },
];

export default function DocumentGenerator({ onGenerate, isLoading = false }: DocumentGeneratorProps) {
  const [options, setOptions] = useState<DocumentGenerationOptions>({
    documentType: 'RESUME',
    template: 'modern',
    format: 'PDF',
    voiceStyle: 'professional',
    includeATSOptimization: true,
    includeQualityScore: true,
  });

  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [qualityScore, setQualityScore] = useState<number | null>(null);

  const handleGenerate = async () => {
    await onGenerate(options);
  };

  const templates = options.documentType === 'COVER_LETTER' ? COVER_LETTER_TEMPLATES : RESUME_TEMPLATES;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Document Type
              </label>
              <Select
                value={options.documentType}
                onChange={(e) => setOptions({ ...options, documentType: e.target.value as DocumentGenerationOptions['documentType'] })}
                options={[
                  { value: 'RESUME', label: 'Resume' },
                  { value: 'COVER_LETTER', label: 'Cover Letter' },
                  { value: 'BOTH', label: 'Both' },
                ]}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Template
              </label>
              <Select
                value={options.template}
                onChange={(e) => setOptions({ ...options, template: e.target.value })}
                options={templates.map((t) => ({ value: t.id, label: t.name }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Output Format
              </label>
              <Select
                value={options.format}
                onChange={(e) => setOptions({ ...options, format: e.target.value as DocumentGenerationOptions['format'] })}
                options={FORMATS.map((f) => ({ value: f.id, label: f.name }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Voice Style
              </label>
              <Select
                value={options.voiceStyle}
                onChange={(e) => setOptions({ ...options, voiceStyle: e.target.value })}
                options={VOICE_STYLES.map((v) => ({ value: v.id, label: v.name }))}
              />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.includeATSOptimization}
                onChange={(e) => setOptions({ ...options, includeATSOptimization: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Include ATS Optimization</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.includeQualityScore}
                onChange={(e) => setOptions({ ...options, includeQualityScore: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Include Quality Score</span>
            </label>
          </div>

          <div className="mt-6">
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Generating...' : 'Generate Document'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {qualityScore !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Quality Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="text-4xl font-bold text-blue-600">
                {qualityScore}%
              </div>
              <div className="flex-1">
                <div className="h-4 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full ${
                      qualityScore >= 80 ? 'bg-green-500' :
                      qualityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${qualityScore}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {generatedContent && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Document</CardTitle>
          </CardHeader>
          <CardContent>
            <TextArea
              value={generatedContent}
              readOnly
              rows={20}
              className="font-mono text-sm"
            />
            <div className="mt-4 flex space-x-2">
              <Button variant="outline">Download</Button>
              <Button variant="outline">Copy to Clipboard</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
