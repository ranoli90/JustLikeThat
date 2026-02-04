'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI, profileAPI } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Checkbox } from '../../components/ui/Checkbox';
import { Select } from '../../components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { User, UpdatePreferencesData, CandidateProfile, UpdateProfileData } from '../../models/profile';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [userData, setUserData] = useState<User>({
    id: 0,
    email: '',
    firstName: '',
    lastName: '',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  const [preferences, setPreferences] = useState({
    jobTitle: '',
    location: '',
    remoteWork: false,
    minSalary: 0,
    maxSalary: 0,
    jobType: '',
    skills: [] as string[],
  });
  
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile>({
    id: 0,
    userId: 0,
    about: '',
    experience: '',
    education: '',
    skills: [],
  });

  const jobTypeOptions = [
    { value: '', label: 'Select job type' },
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'freelance', label: 'Freelance' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userRes, preferencesRes, profileRes] = await Promise.all([
          userAPI.getProfile(),
          userAPI.getPreferences(),
          profileAPI.getCandidateProfile(),
        ]);
        
        setUserData(userRes);
        setPreferences(preferencesRes);
        setCandidateProfile(profileRes);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUserUpdate = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      await userAPI.updateProfile(userData);
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      await userAPI.updatePreferences(preferences);
      setSuccess('Preferences updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      await profileAPI.updateCandidateProfile(candidateProfile);
      setSuccess('Candidate profile updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update candidate profile');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (file: File) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const response = await profileAPI.uploadResume(file);
      setCandidateProfile(prev => ({
        ...prev,
        resumeUrl: response.url,
      }));
      setSuccess('Resume uploaded successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload resume');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-300 rounded"></div>
              <div className="h-64 bg-gray-300 rounded"></div>
              <div className="h-64 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600">
            Manage your account and preferences
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-6">
            {success}
          </Alert>
        )}

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First name"
                  value={userData.firstName}
                  onChange={(e) => setUserData(prev => ({ ...prev, firstName: e.target.value }))}
                />
                <Input
                  label="Last name"
                  value={userData.lastName}
                  onChange={(e) => setUserData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
              <Input
                label="Email address"
                type="email"
                value={userData.email}
                disabled
              />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleUserUpdate}
                  loading={saving}
                >
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Desired job title"
                value={preferences.jobTitle}
                onChange={(e) => setPreferences(prev => ({ ...prev, jobTitle: e.target.value }))}
                placeholder="e.g. Senior Software Engineer"
              />
              <Input
                label="Location"
                value={preferences.location}
                onChange={(e) => setPreferences(prev => ({ ...prev, location: e.target.value }))}
                placeholder="City, State or Remote"
              />
              <Checkbox
                label="Remote work"
                checked={preferences.remoteWork}
                onChange={(e) => setPreferences(prev => ({ ...prev, remoteWork: e.target.checked }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Minimum salary"
                  type="number"
                  value={preferences.minSalary}
                  onChange={(e) => setPreferences(prev => ({ ...prev, minSalary: parseInt(e.target.value) }))}
                  placeholder="0"
                />
                <Input
                  label="Maximum salary"
                  type="number"
                  value={preferences.maxSalary}
                  onChange={(e) => setPreferences(prev => ({ ...prev, maxSalary: parseInt(e.target.value) }))}
                  placeholder="100000"
                />
              </div>
              <Select
                label="Job type"
                value={preferences.jobType}
                onChange={(e) => setPreferences(prev => ({ ...prev, jobType: e.target.value }))}
                options={jobTypeOptions}
              />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={handlePreferencesUpdate}
                  loading={saving}
                >
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Candidate Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextArea
                label="About"
                value={candidateProfile.about}
                onChange={(e) => setCandidateProfile(prev => ({ ...prev, about: e.target.value }))}
                placeholder="Tell us about your experience and career goals"
                rows={4}
              />
              <TextArea
                label="Experience"
                value={candidateProfile.experience}
                onChange={(e) => setCandidateProfile(prev => ({ ...prev, experience: e.target.value }))}
                placeholder="Describe your professional experience"
                rows={4}
              />
              <TextArea
                label="Education"
                value={candidateProfile.education}
                onChange={(e) => setCandidateProfile(prev => ({ ...prev, education: e.target.value }))}
                placeholder="Your educational background"
                rows={4}
              />
              <Input
                label="Skills"
                value={candidateProfile.skills.join(', ')}
                onChange={(e) => setCandidateProfile(prev => ({
                  ...prev,
                  skills: e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill),
                }))}
                placeholder="e.g. JavaScript, React, Node.js"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resume
                </label>
                <div className="flex items-center space-x-4">
                  {candidateProfile.resumeUrl ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Resume uploaded</span>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">No resume uploaded</span>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleResumeUpload(file);
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleProfileUpdate}
                  loading={saving}
                >
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={logout}
                  className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50 focus:ring-red-500"
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
