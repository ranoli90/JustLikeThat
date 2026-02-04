import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useOfflineSyncManager } from '../hooks/useOfflineSync';

interface DashboardStats {
  applications: number;
  interviews: number;
  savedJobs: number;
  messages: number;
}

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();
  const { isOnline, pendingChanges, lastSyncTime } = useOfflineSyncManager();
  const [refreshing, setRefreshing] = React.useState(false);

  const stats: DashboardStats = {
    applications: 12,
    interviews: 3,
    savedJobs: 8,
    messages: 5,
  };

  const recentApplications = [
    { id: '1', company: 'Google', position: 'Software Engineer', status: 'interview', date: '2 days ago' },
    { id: '2', company: 'Meta', position: 'Product Manager', status: 'screening', date: '1 week ago' },
    { id: '3', company: 'Amazon', position: 'SDE II', status: 'submitted', date: '2 weeks ago' },
  ];

  const upcomingInterviews = [
    { id: '1', company: 'Microsoft', position: 'Frontend Developer', date: 'Tomorrow, 2:00 PM', type: 'video' },
    { id: '2', company: 'Stripe', position: 'Backend Engineer', date: 'Fri, 10:00 AM', type: 'phone' },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {getTimeOfDay()},</Text>
            <Text style={styles.userName}>{user?.firstName || 'User'}</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color="#1F2937" />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={logout}>
              <Ionicons name="log-out-outline" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Connection Status */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={20} color="#FFFFFF" />
            <Text style={styles.offlineText}>You're offline. Changes will sync when connected.</Text>
          </View>
        )}

        {pendingChanges > 0 && (
          <View style={styles.syncBanner}>
            <Ionicons name="sync-outline" size={20} color="#4F46E5" />
            <Text style={styles.syncText}>{pendingChanges} changes pending sync</Text>
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="briefcase-outline" size={24} color="#4F46E5" />
            </View>
            <Text style={styles.statValue}>{stats.applications}</Text>
            <Text style={styles.statLabel}>Applications</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="people-outline" size={24} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{stats.interviews}</Text>
            <Text style={styles.statLabel}>Interviews</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="bookmark-outline" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{stats.savedJobs}</Text>
            <Text style={styles.statLabel}>Saved Jobs</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FAE8FF' }]}>
              <Ionicons name="mail-outline" size={24} color="#D946EF" />
            </View>
            <Text style={styles.statValue}>{stats.messages}</Text>
            <Text style={styles.statLabel}>Messages</Text>
          </View>
        </View>

        {/* Upcoming Interviews */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Interviews</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {upcomingInterviews.map((interview) => (
            <TouchableOpacity key={interview.id} style={styles.interviewCard}>
              <View style={styles.interviewIcon}>
                <Ionicons
                  name={interview.type === 'video' ? 'videocam' : 'call'}
                  size={24}
                  color="#4F46E5"
                />
              </View>
              <View style={styles.interviewInfo}>
                <Text style={styles.interviewCompany}>{interview.company}</Text>
                <Text style={styles.interviewPosition}>{interview.position}</Text>
                <Text style={styles.interviewDate}>{interview.date}</Text>
              </View>
              <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinButtonText}>Prepare</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Applications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Applications</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Applications' as never)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentApplications.map((app) => (
            <TouchableOpacity
              key={app.id}
              style={styles.applicationCard}
              onPress={() => navigation.navigate('ApplicationDetail' as never, { id: app.id })}
            >
              <View style={styles.applicationInfo}>
                <Text style={styles.applicationCompany}>{app.company}</Text>
                <Text style={styles.applicationPosition}>{app.position}</Text>
                <Text style={styles.applicationDate}>{app.date}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(app.status) }]}>
                <Text style={styles.statusText}>{app.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Search' as never)}
          >
            <Ionicons name="search" size={24} color="#4F46E5" />
            <Text style={styles.quickActionText}>Find Jobs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Interview' as never)}
          >
            <Ionicons name="school" size={24} color="#4F46E5" />
            <Text style={styles.quickActionText}>Practice</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionButton}>
            <Ionicons name="document-text-outline" size={24} color="#4F46E5" />
            <Text style={styles.quickActionText}>Resumes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionButton}>
            <Ionicons name="analytics-outline" size={24} color="#4F46E5" />
            <Text style={styles.quickActionText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'interview':
      return '#10B981';
    case 'screening':
      return '#F59E0B';
    case 'submitted':
      return '#3B82F6';
    default:
      return '#6B7280';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  syncText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  interviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  interviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  interviewInfo: {
    flex: 1,
  },
  interviewCompany: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  interviewPosition: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  interviewDate: {
    fontSize: 12,
    color: '#4F46E5',
    marginTop: 4,
  },
  joinButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  applicationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  applicationInfo: {
    flex: 1,
  },
  applicationCompany: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  applicationPosition: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  applicationDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statusBadge: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  quickActionButton: {
    width: '22%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default DashboardScreen;
