import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface ResumeGeneratorProps {
  userId: string;
  onGenerate?: (resume: any) => void;
}

export const ResumeGenerator: React.FC<ResumeGeneratorProps> = ({ userId, onGenerate }) => {
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [resume, setResume] = useState<any>(null);
  const { register, handleSubmit, watch } = useForm();

  const personalInfo = watch('personalInfo');
  const experience = watch('experience');

  const onSubmit = async (data: any) => {
    setGenerating(true);
    try {
      const response = await fetch('/api/v1/enterprise-ai/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...data }),
      });
      const result = await response.json();
      setResume(result);
      onGenerate?.(result);
    } catch (error) {
      console.error('Failed to generate resume:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="resume-generator">
      <h2>AI Resume Generator</h2>
      
      <div className="progress-bar">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Personal Info</div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Experience</div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Skills</div>
        <div className={`step ${step >= 4 ? 'active' : ''}`}>4. Generate</div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 1 && (
          <div className="form-step">
            <h3>Personal Information</h3>
            <input {...register('personalInfo.fullName')} placeholder="Full Name" />
            <input {...register('personalInfo.email')} placeholder="Email" />
            <input {...register('personalInfo.phone')} placeholder="Phone" />
            <input {...register('personalInfo.location')} placeholder="Location" />
            <textarea {...register('personalInfo.summary')} placeholder="Professional Summary" />
            <button type="button" onClick={() => setStep(2)}>Next</button>
          </div>
        )}

        {step === 2 && (
          <div className="form-step">
            <h3>Work Experience</h3>
            <div className="experience-list">
              <input {...register('experience.0.company')} placeholder="Company" />
              <input {...register('experience.0.title')} placeholder="Title" />
              <textarea {...register('experience.0.description')} placeholder="Description" />
              <textarea {...register('experience.0.achievements')} placeholder="Key Achievements (one per line)" />
            </div>
            <button type="button" onClick={() => setStep(1)}>Back</button>
            <button type="button" onClick={() => setStep(3)}>Next</button>
          </div>
        )}

        {step === 3 && (
          <div className="form-step">
            <h3>Skills & Education</h3>
            <textarea {...register('skills')} placeholder="Skills (comma separated)" />
            <input {...register('education.0.institution')} placeholder="Education Institution" />
            <input {...register('education.0.degree')} placeholder="Degree" />
            <button type="button" onClick={() => setStep(2)}>Back</button>
            <button type="submit" disabled={generating}>
              {generating ? 'Generating...' : 'Generate Resume'}
            </button>
          </div>
        )}
      </form>

      {resume && (
        <div className="resume-preview">
          <h3>Generated Resume</h3>
          <div className="ats-scores">
            <span>ATS Score: {resume.atsScore}%</span>
            <span>Keywords: {resume.keywordsScore}%</span>
            <span>Format: {resume.formatScore}%</span>
          </div>
          <div className="resume-content">
            <pre>{JSON.stringify(resume.content, null, 2)}</pre>
          </div>
          <div className="export-buttons">
            <button onClick={() => window.open(`/api/v1/enterprise-ai/resume/${resume.id}/export?format=pdf`)}>
              Export PDF
            </button>
            <button onClick={() => window.open(`/api/v1/enterprise-ai/resume/${resume.id}/export?format=docx`)}>
              Export DOCX
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeGenerator;
