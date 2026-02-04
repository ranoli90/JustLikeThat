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

const JobDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params as { id: string };

  const job = {
    id,
    title: 'Senior Software Engineer',
    company: 'Google',
    location: 'Mountain View, CA',
    salary: '$150,000 - $200,000',
    type: 'Full-time',
    remote: 'Remote',
    posted: '2 days ago',
    matchScore: 95,
    description: `We're looking for a Senior Software Engineer to join our team. You'll be responsible for designing and implementing scalable solutions that impact millions of users worldwide.

The ideal candidate will have strong experience with distributed systems, cloud platforms, and modern software development practices.`,
    requirements: [
      '5+ years of experience in software development',
      'Strong proficiency in Java, Python, or Go',
      'Experience with distributed systems and cloud platforms',
      'Excellent problem-solving skills',
      'Strong communication abilities',
    ],
    benefits: [
      'Competitive salary and equity',
      'Comprehensive health benefits',
      '401(k) matching',
      'Flexible work arrangements',
      'Professional development budget',
    ],
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
          <TouchableOpacity style={styles.saveButton}>
            <Ionicons name="bookmark-outline" size={24} color="#4F46E5" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* Job Header */}
        <View style={styles.jobHeader}>
          <View style={styles.companyIcon}>
            <Text style={styles.companyInitial}>G</Text>
          </View>
          <View style={styles.jobTitleContainer}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text style={styles.company}>{job.company}</Text>
          </View>
          {job.matchScore >= 90 && (
            <View style={styles.matchBadge}>
              <Ionicons name="star" size={16} color="#FFFFFF" />
              <Text style={styles.matchText}>{job.matchScore}% Match</Text>
            </View>
          )}
        </View>

        {/* Quick Info */}
        <View style={styles.quickInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={20} color="#6B7280" />
            <Text style={styles.infoText}>{job.location}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="cash-outline" size={20} color="#6B7280" />
            <Text style={styles.infoText}>{job.salary}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="briefcase-outline" size={20} color="#6B7280" />
            <Text style={styles.infoText}>{job.type}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="home-outline" size={20} color="#6B7280" />
            <Text style={styles.infoText}>{job.remote}</Text>
          </View>
        </View>

        {/* Match Section */}
        <View style={styles.matchSection}>
          <Text style={styles.matchTitle}>Why You're a Great Match</Text>
          <View style={styles.matchReasons}>
            <View style={styles.reasonItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.reasonText}>5+ years of relevant experience</Text>
            </View>
            <View style={styles.reasonItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.reasonText}>Strong technical background</Text>
            </View>
            <View style={styles.reasonItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.reasonText}>Remote work experience</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this role</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        {/* Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          {job.requirements.map((req, index) => (
            <View key={index} style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>{req}</Text>
            </View>
          ))}
        </View>

        {/* Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benefits</Text>
          {job.benefits.map((benefit, index) => (
            <View key={index} style={styles.bulletItem}>
              <Ionicons name="gift-outline" size={16} color="#10B981" />
              <Text style={styles.bulletText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Spacer for button */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.applyButton}>
          <Text style={styles.applyButtonText}>Apply Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  companyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  companyInitial: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  jobTitleContainer: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  company: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  matchText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  quickInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  matchSection: {
    backgroundColor: '#F0FDF4',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 12,
  },
  matchReasons: {
    gap: 8,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reasonText: {
    fontSize: 14,
    color: '#374151',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4F46E5',
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  bottomSpacer: {
    height: 100,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  applyButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default JobDetailScreen;
