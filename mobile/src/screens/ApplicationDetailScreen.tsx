import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const ApplicationDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params as { id: string };

  const application = {
    id,
    company: 'Google',
    position: 'Senior Software Engineer',
    status: 'interview',
    appliedDate: '2024-01-15',
    location: 'Mountain View, CA',
    salary: '$150K - $200K',
    timeline: [
      { date: '2024-01-15', action: 'Applied', description: 'Application submitted', icon: 'send-outline' },
      { date: '2024-01-18', action: 'Application Viewed', description: 'Recruiter reviewed your application', icon: 'eye-outline' },
      { date: '2024-01-20', action: 'Screening', description: 'Phone screening scheduled', icon: 'call-outline' },
      { date: '2024-01-25', action: 'Interview', description: 'Technical interview scheduled', icon: 'videocam-outline' },
    ],
    notes: 'Had a great phone screening. Recruiter was impressed with my experience at previous companies.',
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'interview': return '#10B981';
      case 'screening': return '#F59E0B';
      case 'submitted': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Application</Text>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="ellipsis-vertical" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Company Card */}
        <View style={styles.companyCard}>
          <View style={styles.companyIcon}>
            <Text style={styles.companyInitial}>{application.company[0]}</Text>
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.position}>{application.position}</Text>
            <Text style={styles.company}>{application.company}</Text>
            <Text style={styles.location}>{application.location}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(application.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(application.status) }]}>
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="document-text-outline" size={24} color="#4F46E5" />
            <Text style={styles.actionText}>Resume</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="create-outline" size={24} color="#4F46E5" />
            <Text style={styles.actionText}>Cover Letter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="calendar-outline" size={24} color="#4F46E5" />
            <Text style={styles.actionText}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={24} color="#4F46E5" />
            <Text style={styles.actionText}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Job Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Applied</Text>
            <Text style={styles.detailValue}>{application.appliedDate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Salary</Text>
            <Text style={styles.detailValue}>{application.salary}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{application.location}</Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          {application.timeline.map((item, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineIcon}>
                <Ionicons name={item.icon as any} size={20} color="#4F46E5" />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineAction}>{item.action}</Text>
                <Text style={styles.timelineDescription}>{item.description}</Text>
                <Text style={styles.timelineDate}>{item.date}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.notesCard}>
            <Text style={styles.notesText}>{application.notes}</Text>
          </View>
          <TouchableOpacity style={styles.addNoteButton}>
            <Ionicons name="add" size={20} color="#4F46E5" />
            <Text style={styles.addNoteText}>Add Note</Text>
          </TouchableOpacity>
        </View>

        {/* Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Withdraw</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>View Job</Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 44,
  },
  menuButton: {
    position: 'absolute',
    right: 16,
  },
  companyCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 20,
  },
  companyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  companyInitial: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  companyInfo: {
    marginBottom: 16,
  },
  position: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  company: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  location: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    marginBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
    marginTop: 6,
  },
  section: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineAction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  timelineDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  timelineDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  notesCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#4F46E5',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addNoteText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 100,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ApplicationDetailScreen;
