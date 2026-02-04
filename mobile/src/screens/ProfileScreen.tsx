import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: 'navigation' | 'toggle' | 'action';
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
}

const ProfileScreen: React.FC = () => {
  const { user, logout, biometricsEnabled, enableBiometrics, disableBiometrics } = useAuthStore();
  const [settings, setSettings] = useState<SettingItem[]>([
    { id: 'biometrics', title: 'Biometric Login', subtitle: 'Use Face ID or fingerprint', icon: 'finger-print-outline', type: 'toggle', toggleValue: biometricsEnabled },
    { id: 'notifications', title: 'Push Notifications', subtitle: 'Job matches and updates', icon: 'notifications-outline', type: 'toggle', toggleValue: true },
    { id: 'email', title: 'Email Notifications', subtitle: 'Weekly digests and tips', icon: 'mail-outline', type: 'toggle', toggleValue: true },
    { id: 'offline', title: 'Offline Mode', subtitle: 'Save data for offline access', icon: 'cloud-offline-outline', type: 'toggle', toggleValue: true },
    { id: 'profile', title: 'Edit Profile', subtitle: 'Update your information', icon: 'person-outline', type: 'navigation' },
    { id: 'resumes', title: 'Manage Resumes', subtitle: 'Upload and organize documents', icon: 'document-text-outline', type: 'navigation' },
    { id: 'preferences', title: 'Job Preferences', subtitle: 'Set your search criteria', icon: 'options-outline', type: 'navigation' },
    { id: 'privacy', title: 'Privacy Settings', subtitle: 'Control who sees your profile', icon: 'shield-checkmark-outline', type: 'navigation' },
    { id: 'help', title: 'Help & Support', subtitle: 'Get help and give feedback', icon: 'help-circle-outline', type: 'navigation' },
    { id: 'about', title: 'About', subtitle: 'Version 1.0.0', icon: 'information-circle-outline', type: 'navigation' },
  ]);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  const handleToggle = async (id: string, value: boolean) => {
    if (id === 'biometrics') {
      if (value) {
        const success = await enableBiometrics();
        if (!success) {
          Alert.alert('Error', 'Unable to enable biometric authentication');
          return;
        }
      } else {
        await disableBiometrics();
      }
    }
    setSettings(settings.map((s) => s.id === id ? { ...s, toggleValue: value } : s));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}
            </Text>
          </View>
          <Text style={styles.userName}>
            {user?.firstName || 'User'} {user?.lastName || ''}
          </Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Applications</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Interviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>85%</Text>
            <Text style={styles.statLabel}>Response Rate</Text>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {settings.slice(0, 4).map((setting) => (
            <View key={setting.id} style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Ionicons name={setting.icon as any} size={22} color="#4F46E5" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>{setting.title}</Text>
                  {setting.subtitle && (
                    <Text style={styles.settingSubtitle}>{setting.subtitle}</Text>
                  )}
                </View>
              </View>
              {setting.type === 'toggle' && (
                <Switch
                  value={setting.toggleValue}
                  onValueChange={(value) => handleToggle(setting.id, value)}
                  trackColor={{ false: '#E5E7EB', true: '#4F46E5' }}
                  thumbColor="#FFFFFF"
                />
              )}
              {setting.type === 'navigation' && (
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              )}
            </View>
          ))}
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          {settings.slice(4, 8).map((setting) => (
            <TouchableOpacity key={setting.id} style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Ionicons name={setting.icon as any} size={22} color="#4F46E5" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>{setting.title}</Text>
                  {setting.subtitle && (
                    <Text style={styles.settingSubtitle}>{setting.subtitle}</Text>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          {settings.slice(8).map((setting) => (
            <TouchableOpacity key={setting.id} style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Ionicons name={setting.icon as any} size={22} color="#4F46E5" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>{setting.title}</Text>
                  {setting.subtitle && (
                    <Text style={styles.settingSubtitle}>{setting.subtitle}</Text>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>Apply as a Service v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  editProfileButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginTop: 1,
    paddingVertical: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    paddingHorizontal: 20,
    paddingVertical: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 24,
    marginBottom: 32,
  },
});

export default ProfileScreen;
