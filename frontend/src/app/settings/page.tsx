'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Checkbox } from '../../components/ui/Checkbox';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [automationConfig, setAutomationConfig] = useState({
    autoApply: false,
    autoApplyThreshold: 0.9,
    dailyApplicationLimit: 10,
    applicationTimeWindow: '09:00-17:00',
    followUpEmails: true,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    jobMatches: true,
    applicationUpdates: true,
    interviewReminders: true,
    weeklyReports: true,
    marketingEmails: false,
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: 30,
  });

  const [accountSettings, setAccountSettings] = useState({
    email: '',
    firstName: '',
    lastName: '',
    newsletter: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Simulate API call to fetch settings
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        setAccountSettings(prev => ({
          ...prev,
          email: user?.email || '',
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
        }));
      } catch (err: any) {
        setError(err.message || 'Failed to fetch settings');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Settings saved successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
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
              <div className="h-64 bg-gray-300 rounded"></div>
              <div className="h-64 bg-gray-300 rounded"></div>
              <div className="h-64 bg-gray-300 rounded"></div>
              <div className="h-48 bg-gray-300 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your account settings and preferences
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
          {/* Automation Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Automation Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Checkbox
                label="Auto-apply to matching jobs"
                checked={automationConfig.autoApply}
                onChange={(e) => setAutomationConfig(prev => ({
                  ...prev,
                  autoApply: e.target.checked,
                }))}
              />
              <Input
                label="Auto-apply match score threshold"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={automationConfig.autoApplyThreshold}
                onChange={(e) => setAutomationConfig(prev => ({
                  ...prev,
                  autoApplyThreshold: parseFloat(e.target.value),
                }))}
                placeholder="0.9"
              />
              <Input
                label="Daily application limit"
                type="number"
                min="1"
                max="100"
                value={automationConfig.dailyApplicationLimit}
                onChange={(e) => setAutomationConfig(prev => ({
                  ...prev,
                  dailyApplicationLimit: parseInt(e.target.value),
                }))}
                placeholder="10"
              />
              <Input
                label="Application time window"
                value={automationConfig.applicationTimeWindow}
                onChange={(e) => setAutomationConfig(prev => ({
                  ...prev,
                  applicationTimeWindow: e.target.value,
                }))}
                placeholder="09:00-17:00"
              />
              <Checkbox
                label="Send follow-up emails"
                checked={automationConfig.followUpEmails}
                onChange={(e) => setAutomationConfig(prev => ({
                  ...prev,
                  followUpEmails: e.target.checked,
                }))}
              />
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Checkbox
                label="Email notifications"
                checked={notificationSettings.emailNotifications}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  emailNotifications: e.target.checked,
                }))}
              />
              <Checkbox
                label="Job matches"
                checked={notificationSettings.jobMatches}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  jobMatches: e.target.checked,
                }))}
              />
              <Checkbox
                label="Application updates"
                checked={notificationSettings.applicationUpdates}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  applicationUpdates: e.target.checked,
                }))}
              />
              <Checkbox
                label="Interview reminders"
                checked={notificationSettings.interviewReminders}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  interviewReminders: e.target.checked,
                }))}
              />
              <Checkbox
                label="Weekly reports"
                checked={notificationSettings.weeklyReports}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  weeklyReports: e.target.checked,
                }))}
              />
              <Checkbox
                label="Marketing emails"
                checked={notificationSettings.marketingEmails}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  marketingEmails: e.target.checked,
                }))}
              />
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Checkbox
                label="Two-factor authentication"
                checked={securitySettings.twoFactorAuth}
                onChange={(e) => setSecuritySettings(prev => ({
                  ...prev,
                  twoFactorAuth: e.target.checked,
                }))}
              />
              <Checkbox
                label="Login alerts"
                checked={securitySettings.loginAlerts}
                onChange={(e) => setSecuritySettings(prev => ({
                  ...prev,
                  loginAlerts: e.target.checked,
                }))}
              />
              <Input
                label="Session timeout (minutes)"
                type="number"
                min="5"
                max="120"
                value={securitySettings.sessionTimeout}
                onChange={(e) => setSecuritySettings(prev => ({
                  ...prev,
                  sessionTimeout: parseInt(e.target.value),
                }))}
                placeholder="30"
              />
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First name"
                  value={accountSettings.firstName}
                  onChange={(e) => setAccountSettings(prev => ({
                    ...prev,
                    firstName: e.target.value,
                  }))}
                />
                <Input
                  label="Last name"
                  value={accountSettings.lastName}
                  onChange={(e) => setAccountSettings(prev => ({
                    ...prev,
                    lastName: e.target.value,
                  }))}
                />
              </div>
              <Input
                label="Email address"
                type="email"
                value={accountSettings.email}
                disabled
              />
              <Checkbox
                label="Subscribe to newsletter"
                checked={accountSettings.newsletter}
                onChange={(e) => setAccountSettings(prev => ({
                  ...prev,
                  newsletter: e.target.checked,
                }))}
              />
            </CardContent>
          </Card>

          {/* Save and Logout */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={logout}
              className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50 focus:ring-red-500"
            >
              Sign Out
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={saving}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
