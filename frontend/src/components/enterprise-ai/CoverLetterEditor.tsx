import React, { useState } from 'react';

interface CoverLetterEditorProps {
  userId: string;
  jobId?: string;
  onSave?: (coverLetter: any) => void;
}

export const CoverLetterEditor: React.FC<CoverLetterEditorProps> = ({ userId, jobId, onSave }) => {
  const [generating, setGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState<any>(null);
  const [selectedVersion, setSelectedVersion] = useState(0);
  const [formData, setFormData] = useState({
    companyName: '',
    hiringManager: '',
    jobTitle: '',
    tone: 'professional' as 'formal' | 'professional' | 'casual' | 'enthusiastic',
    length: 'medium' as 'short' | 'medium' | 'long',
  });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/v1/enterprise-ai/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId, jobId,
          personalInfo: { fullName: 'Candidate', email: 'candidate@email.com' },
          companyInfo: { name: formData.companyName, hiringManager: formData.hiringManager, industry: 'Technology' },
          jobInfo: { title: formData.jobTitle, requirements: [], responsibilities: [] },
          experience: [], tone: formData.tone, length: formData.length,
        }),
      });
      const result = await response.json();
      setCoverLetter(result);
      onSave?.(result);
    } catch (error) {
      console.error('Failed to generate cover letter:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="cover-letter-editor">
      <h2>AI Cover Letter Generator</h2>
      <div className="input-section">
        <input value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} placeholder="Company Name" />
        <input value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} placeholder="Job Title" />
        <select value={formData.tone} onChange={(e) => setFormData({ ...formData, tone: e.target.value as typeof formData['tone'] })}>
          <option value="formal">Formal</option>
          <option value="professional">Professional</option>
          <option value="casual">Casual</option>
          <option value="enthusiastic">Enthusiastic</option>
        </select>
        <button onClick={handleGenerate} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button>
      </div>
      {coverLetter && (
        <div className="result">
          <div className="versions">
            {coverLetter.draftVersions?.map((_: any, i: number) => (
              <button key={i} className={selectedVersion === i ? 'active' : ''} onClick={() => setSelectedVersion(i)}>Version {i + 1}</button>
            ))}
          </div>
          <textarea value={coverLetter.draftVersions?.[selectedVersion] || coverLetter.content} readOnly />
          <button onClick={() => onSave?.(coverLetter)}>Save</button>
        </div>
      )}
    </div>
  );
};

export default CoverLetterEditor;
