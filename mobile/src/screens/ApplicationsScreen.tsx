import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';

interface Application {
  id: string;
  company: string;
  position: string;
  status: 'draft' | 'submitted' | 'screening' | 'interview' | 'offer' | 'rejected' | 'withdrawn';
  appliedDate: string;
  logo?: string;
  location: string;
}

const ApplicationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState('all');
  const [applications] = useState<Application[]>([
    { id: '1', company: 'Google', position: 'Senior Software Engineer', status: 'interview', appliedDate: '2024-01-15', location: 'Mountain View, CA' },
    { id: '2', company: 'Meta', position: 'Product Manager', status: 'screening', appliedDate: '2024-01-10', location: 'Remote' },
    { id: '3', company: 'Amazon', position: 'SDE II', status: 'submitted', appliedDate: '2024-01-05', location: 'Seattle, WA' },
    { id: '4', company: 'Microsoft', position: 'Frontend Developer', status: 'offer', appliedDate: '2023-12-20', location: 'Redmond, WA' },
    { id: '5', company: 'Netflix', position: 'Senior Engineer', status: 'rejected', appliedDate: '2023-12-15', location: 'Los Gatos, CA' },
    { id: '6', company: 'Apple', position: 'iOS Developer', status: 'draft', appliedDate: '', location: 'Cupertino, CA' },
  ]);

  const tabs = [
    { key: 'all', label: 'All', count: applications.length },
    { key: 'active', label: 'Active', count: applications.filter((a) => !['rejected', 'withdrawn'].includes(a.status)).length },
    { key: 'interview', label: 'Interviews', count: applications.filter((a) => a.status === 'interview').length },
    { key: 'offer', label: 'Offers', count: applications.filter((a) => a.status === 'offer').length },
  ];

  const filteredApplications = applications.filter((app) => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'active') return !['rejected', 'withdrawn'].includes(app.status);
    return app.status === selectedTab;
  });

  const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'interview': return 'people-outline';
      case 'offer': return 'trophy-outline';
      case 'screening': return 'eye-outline';
      case 'submitted': return 'send-outline';
      case 'draft': return 'create-outline';
      case 'rejected': return 'close-circle-outline';
      case 'withdrawn': return 'arrow-undo-outline';
      default: return 'help-outline';
    }
  };

  const getStatusColorValue = (status: string): string => {
    switch (status) {
      case 'interview': return '#10B981';
      case 'offer': return '#059669';
      case 'screening': return '#F59E0B';
      case 'submitted': return '#3B82F6';
      case 'draft': return '#6B7280';
      case 'rejected': return '#EF4444';
      case 'withdrawn': return '#9CA3AF';
      default: return '#6B7280';
    }
  };

  const renderApplicationItem = ({ item }: { item: Application }) => (
    <TouchableOpacity
      style={styles.applicationCard}
      onPress={() => navigation.navigate('ApplicationDetail' as never, { id: item.id })}
      accessibilityLabel={`Application at ${item.company} for ${item.position}`}
    >
      <View style={styles.applicationHeader}>
        <View style={styles.companyIcon}>
          <Text style={styles.companyInitial}>{item.company[0]}</Text>
        </View>
        <View style={styles.applicationInfo}>
          <Text style={styles.position}>{item.position}</Text>
          <Text style={styles.company}>{item.company}</Text>
          <Text style={styles.location}>{item.location}</Text>
        </View>
      </View>

      <View style={styles.applicationFooter}>
        <View style={styles.statusContainer}>
          <Ionicons 
            name={getStatusIcon(item.status)} 
            size={14} 
            color={getStatusColorValue(item.status)} 
          />
          <StatusBadge status={item.status} />
        </View>
        {item.appliedDate && (
          <Text style={styles.appliedDate}>Applied {item.appliedDate}</Text>
        )}
      </View>

      <TouchableOpacity 
        style={styles.quickAction}
        accessibilityLabel="More options"
      >
        <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const navigateToSearch = () => {
    navigation.navigate('Search' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Applications</Text>
        <TouchableOpacity 
          style={styles.addButton}
          accessibilityLabel="Add new application"
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <FlatList
        horizontal
        data={tabs}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
        keyExtractor={(tab) => tab.key}
        renderItem={({ item: tab }) => (
          <TouchableOpacity
            style={[styles.tab, selectedTab === tab.key && styles.tabActive]}
            onPress={() => setSelectedTab(tab.key)}
            accessibilityLabel={`${tab.label} tab`}
            accessibilityState={{ selected: selectedTab === tab.key }}
          >
            <Text style={[styles.tabText, selectedTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            <View style={[styles.tabBadge, selectedTab === tab.key && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, selectedTab === tab.key && styles.tabBadgeTextActive]}>
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{applications.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{applications.filter((a) => a.status === 'interview').length}</Text>
          <Text style={styles.statLabel}>Interviews</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{applications.filter((a) => a.status === 'offer').length}</Text>
          <Text style={styles.statLabel}>Offers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{applications.filter((a) => a.status === 'rejected').length}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
      </View>

      {/* Application List */}
      <FlatList
        data={filteredApplications}
        renderItem={renderApplicationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="briefcase-outline"
            title="No applications"
            message="Start your job search to see applications here"
            actionLabel="Search Jobs"
            onAction={navigateToSearch}
          />
        }
      />
    </SafeAreaView>
  );
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    marginLeft: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  applicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  applicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companyInitial: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  applicationInfo: {
    flex: 1,
  },
  position: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  company: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  applicationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appliedDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  quickAction: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
});

export default ApplicationsScreen;
