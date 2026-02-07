'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { intakeFormSchema, IntakeFormData, DerivedProfile } from '../../backend/src/dto/intake/intake-questions.zod';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { TextArea } from './ui/TextArea';
import { Checkbox } from './ui/Checkbox';
import { Select } from './ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Alert } from './ui/Alert';

interface IntakeFormProps {
  onSubmit?: (data: DerivedProfile) => void;
}

export default function IntakeForm({ onSubmit }: IntakeFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DerivedProfile | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IntakeFormData>({
    resolver: zodResolver(intakeFormSchema),
    defaultValues: {
      constraints: {
        remoteWorkPreference: 'FLEXIBLE',
        visaRequirements: 'NONE',
        workAuthorization: true,
      },
      preferences: {
        workLifeBalance: 'BALANCED',
        professionalDevelopment: 'MODERATE',
      },
      riskTolerance: {
        jobSecurity: 'MODERATE',
        financialRisk: 'MODERATE',
        careerRisk: 'MODERATE',
        willingnessToRelocate: 'MAYBE',
        willingnessToTravel: 'OCCASIONAL',
      },
    },
  });

  const onSubmitHandler = async (data: IntakeFormData) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to process intake form');
      }

      const derivedProfile = await response.json();
      setResult(derivedProfile);
      onSubmit?.(derivedProfile);
    } catch (err: any) {
      setError(err.message || 'Failed to process intake form');
    } finally {
      setLoading(false);
    }
  };

  const skillLevelOptions = [
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED', label: 'Advanced' },
    { value: 'EXPERT', label: 'Expert' },
  ];

  const remoteWorkOptions = [
    { value: 'REMOTE_ONLY', label: 'Remote Only' },
    { value: 'HYBRID_ONLY', label: 'Hybrid Only' },
    { value: 'ONSITE_ONLY', label: 'Onsite Only' },
    { value: 'FLEXIBLE', label: 'Flexible' },
  ];

  const visaOptions = [
    { value: 'NONE', label: 'No Visa Sponsorship Needed' },
    { value: 'SPONSORSHIP_REQUIRED', label: 'Visa Sponsorship Required' },
    { value: 'TRANSFER_REQUIRED', label: 'Visa Transfer Required' },
  ];

  const riskOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MODERATE', label: 'Moderate' },
    { value: 'HIGH', label: 'High' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Candidate Intake</h1>
          <p className="mt-2 text-gray-600">
            Tell us about your career goals and preferences to get started
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {result && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Candidate Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <h3 className="font-semibold">Candidate Type</h3>
                  <p className="text-gray-600">
                    {result.candidateType.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Career Stage</h3>
                  <p className="text-gray-600">
                    {result.careerStage}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Skills</h3>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium">Technical Skills</h4>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {Object.entries(result.skillsGraph.technical).map(([skill, level]) => (
                          <span
                            key={skill}
                            className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800"
                          >
                            {skill} ({Math.round(level * 100)}%)
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Soft Skills</h4>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {Object.entries(result.skillsGraph.soft).map(([skill, level]) => (
                          <span
                            key={skill}
                            className="rounded bg-green-100 px-2 py-1 text-xs text-green-800"
                          >
                            {skill} ({Math.round(level * 100)}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {result.fairnessFlags && result.fairnessFlags.length > 0 && (
                  <div>
                    <h3 className="font-semibold">Fairness Check</h3>
                    <div className="mt-2">
                      {result.fairnessFlags.map((flag, index) => (
                        <Alert
                          key={index}
                          variant={
                            flag.severity === 'HIGH' ? 'error' :
                            flag.severity === 'MEDIUM' ? 'warning' : 'info'
                          }
                          className="mb-2"
                        >
                          <div className="font-medium">{flag.field}</div>
                          <div className="text-sm">{flag.description}</div>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-8">
          {/* Career Goals */}
          <Card>
            <CardHeader>
              <CardTitle>Career Goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextArea
                label="Short-term Goal"
                placeholder="What do you want to achieve in the next 1-2 years?"
                {...register('careerGoals.shortTermGoal')}
                error={errors.careerGoals?.shortTermGoal?.message}
              />
              <TextArea
                label="Long-term Goal"
                placeholder="What do you want to achieve in the next 5-10 years?"
                {...register('careerGoals.longTermGoal')}
                error={errors.careerGoals?.longTermGoal?.message}
              />
              <Input
                label="Target Role"
                placeholder="e.g. Senior Software Engineer"
                {...register('careerGoals.targetRole')}
                error={errors.careerGoals?.targetRole?.message}
              />
              <Input
                label="Target Industry"
                placeholder="e.g. Technology"
                {...register('careerGoals.targetIndustry')}
                error={errors.careerGoals?.targetIndustry?.message}
              />
              <TextArea
                label="Desired Impact"
                placeholder="How do you want to make an impact in your career?"
                {...register('careerGoals.desiredImpact')}
                error={errors.careerGoals?.desiredImpact?.message}
              />
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Technical Skills"
                placeholder="e.g. JavaScript, React, Node.js"
                {...register('skills.technicalSkills')}
                error={errors.skills?.technicalSkills?.message}
                onChange={(e) => {
                  const value = e.target.value.split(',')
                    .map(skill => skill.trim())
                    .filter(skill => skill);
                  // Handle array input for React Hook Form
                }}
              />
              <Input
                label="Soft Skills"
                placeholder="e.g. Communication, Teamwork"
                {...register('skills.softSkills')}
                error={errors.skills?.softSkills?.message}
                onChange={(e) => {
                  const value = e.target.value.split(',')
                    .map(skill => skill.trim())
                    .filter(skill => skill);
                  // Handle array input for React Hook Form
                }}
              />
            </CardContent>
          </Card>

          {/* Constraints */}
          <Card>
            <CardHeader>
              <CardTitle>Constraints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Minimum Salary"
                  type="number"
                  placeholder="0"
                  {...register('constraints.salaryRange.min', { valueAsNumber: true })}
                  error={errors.constraints?.salaryRange?.min?.message}
                />
                <Input
                  label="Maximum Salary"
                  type="number"
                  placeholder="100000"
                  {...register('constraints.salaryRange.max', { valueAsNumber: true })}
                  error={errors.constraints?.salaryRange?.max?.message}
                />
              </div>
              <Input
                label="Location Preferences"
                placeholder="e.g. San Francisco, New York"
                {...register('constraints.locationPreferences')}
                error={errors.constraints?.locationPreferences?.message}
                onChange={(e) => {
                  const value = e.target.value.split(',')
                    .map(location => location.trim())
                    .filter(location => location);
                  // Handle array input for React Hook Form
                }}
              />
              <Select
                label="Remote Work Preference"
                {...register('constraints.remoteWorkPreference')}
                error={errors.constraints?.remoteWorkPreference?.message}
                options={remoteWorkOptions}
              />
              <Select
                label="Visa Requirements"
                {...register('constraints.visaRequirements')}
                error={errors.constraints?.visaRequirements?.message}
                options={visaOptions}
              />
              <Checkbox
                label="Work Authorization"
                {...register('constraints.workAuthorization')}
              />
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Work-Life Balance"
                {...register('preferences.workLifeBalance')}
                error={errors.preferences?.workLifeBalance?.message}
                options={[
                  { value: 'BALANCED', label: 'Balanced' },
                  { value: 'WORK_FOCUSED', label: 'Work Focused' },
                  { value: 'LIFE_FOCUSED', label: 'Life Focused' },
                ]}
              />
              <Select
                label="Professional Development"
                {...register('preferences.professionalDevelopment')}
                error={errors.preferences?.professionalDevelopment?.message}
                options={[
                  { value: 'HIGH_PRIORITY', label: 'High Priority' },
                  { value: 'MODERATE', label: 'Moderate' },
                  { value: 'LOW_PRIORITY', label: 'Low Priority' },
                ]}
              />
            </CardContent>
          </Card>

          {/* Risk Tolerance */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Tolerance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Job Security"
                {...register('riskTolerance.jobSecurity')}
                error={errors.riskTolerance?.jobSecurity?.message}
                options={riskOptions}
              />
              <Select
                label="Financial Risk"
                {...register('riskTolerance.financialRisk')}
                error={errors.riskTolerance?.financialRisk?.message}
                options={riskOptions}
              />
              <Select
                label="Career Risk"
                {...register('riskTolerance.careerRisk')}
                error={errors.riskTolerance?.careerRisk?.message}
                options={riskOptions}
              />
              <Select
                label="Willingness to Relocate"
                {...register('riskTolerance.willingnessToRelocate')}
                error={errors.riskTolerance?.willingnessToRelocate?.message}
                options={[
                  { value: 'YES', label: 'Yes' },
                  { value: 'NO', label: 'No' },
                  { value: 'MAYBE', label: 'Maybe' },
                ]}
              />
              <Select
                label="Willingness to Travel"
                {...register('riskTolerance.willingnessToTravel')}
                error={errors.riskTolerance?.willingnessToTravel?.message}
                options={[
                  { value: 'NONE', label: 'None' },
                  { value: 'OCCASIONAL', label: 'Occasional' },
                  { value: 'FREQUENT', label: 'Frequent' },
                ]}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="min-w-[200px]"
            >
              Process Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
