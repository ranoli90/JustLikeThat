import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface PracticeSession {
  id: string;
  title: string;
  description: string;
  questions: number;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
  lastScore?: number;
}

const InterviewPrepScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeSession, setActiveSession] = useState<string | null>(null);

  const practiceSessions: PracticeSession[] = [
    { id: '1', title: 'Behavioral Questions', description: 'Master STAR method responses', questions: 25, duration: 30, difficulty: 'medium', completed: true, lastScore: 85 },
    { id: '2', title: 'Technical Fundamentals', description: 'Core CS concepts and problem solving', questions: 40, duration: 45, difficulty: 'hard', completed: false },
    { id: '3', title: 'Company-Specific', description: 'Questions tailored to target companies', questions: 20, duration: 25, difficulty: 'medium', completed: false },
    { id: '4', title: 'Leadership & Management', description: 'Showcase leadership experience', questions: 15, duration: 20, difficulty: 'medium', completed: true, lastScore: 78 },
    { id: '5', title: 'Salary & Benefits', description: 'Negotiation strategies and questions', questions: 10, duration: 15, difficulty: 'easy', completed: false },
    { id: '6', title: 'Culture Fit', description: 'Align values with company culture', questions: 18, duration: 20, difficulty: 'easy', completed: false },
  ];

  const upcomingInterviews = [
    { id: '1', company: 'Google', position: 'Senior Software Engineer', date: 'Tomorrow, 2:00 PM', type: 'Technical', prepared: true },
    { id: '2', company: 'Stripe', position: 'Backend Developer', date: 'Fri, 10:00 AM', type: 'System Design', prepared: false },
  ];

  const categories = [
    { key: 'all', label: 'All', icon: 'grid-outline' },
    { key: 'behavioral', label: 'Behavioral', icon: 'chatbubbles-outline' },
    { key: 'technical', label: 'Technical', icon: 'code-slash-outline' },
    { key: 'company', label: 'Company', icon: 'business-outline' },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderPracticeCard = (session: PracticeSession) => (
    <TouchableOpacity
      key={session.id}
      style={styles.practiceCard}
      onPress={() => setActiveSession(session.id)}
    >
      <View style={styles.practiceHeader}>
        <View style={styles.practiceIcon}>
          <Ionicons name="school-outline" size={24} color="#4F46E5" />
        </View>
        <View style={styles.practiceInfo}>
          <Text style={styles.practiceTitle}>{session.title}</Text>
          <Text style={styles.practiceDescription}>{session.description}</Text>
        </View>
      </View>

      <View style={styles.practiceMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="help-circle-outline" size={16} color="#6B7280" />
          <Text style={styles.metaText}>{session.questions} questions</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.metaText}>{session.duration} min</Text>
        </View>
        <View style={[styles.difficultyBadge, { backgroundColor: `${getDifficultyColor(session.difficulty)}20` }]}>
          <Text style={[styles.difficultyText, { color: getDifficultyColor(session.difficulty) }]}>
            {session.difficulty}
          </Text>
        </View>
      </View>

      {session.completed && session.lastScore && (
        <View style={styles.scoreRow}>
          <View style={styles.scoreBadge}>
            <Ionicons name="trophy-outline" size={16} color="#10B981" />
            <Text style={styles.scoreText}>Last score: {session.lastScore}%</Text>
          </View>
          <TouchableOpacity style={styles.retryButton}>
            <Ionicons name="refresh-outline" size={16} color="#4F46E5" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.startButton}>
          <Text style={styles.startButtonText}>
            {session.completed ? 'Continue' : 'Start Practice'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Interview Prep</Text>
          <Text style={styles.subtitle}>Practice makes perfect</Text>
        </View>
        <TouchableOpacity style={styles.statsButton}>
          <Ionicons name="analytics-outline" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* Upcoming Interviews */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Interviews</Text>
        {upcomingInterviews.map((interview) => (
          <TouchableOpacity key={interview.id} style={styles.upcomingCard}>
            <View style={styles.upcomingIcon}>
              <Ionicons name="videocam-outline" size={24} color="#4F46E5" />
            </View>
            <View style={styles.upcomingInfo}>
              <Text style={styles.upcomingCompany}>{interview.company}</Text>
              <Text style={styles.upcomingPosition}>{interview.position}</Text>
              <Text style={styles.upcomingDate}>{interview.date}</Text>
            </View>
            <View style={styles.upcomingBadge}>
              <Text style={styles.upcomingBadgeText}>{interview.type}</Text>
              {interview.prepared ? (
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              ) : (
                <Ionicons name="alert-circle" size={20} color="#F59E0B" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[styles.categoryTab, selectedCategory === category.key && styles.categoryTabActive]}
            onPress={() => setSelectedCategory(category.key)}
          >
            <Ionicons
              name={category.icon as any}
              size={20}
              color={selectedCategory === category.key ? '#FFFFFF' : '#6B7280'}
            />
            <Text
              style={[styles.categoryText, selectedCategory === category.key && styles.categoryTextActive]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Practice Sessions */}
      <ScrollView style={styles.practiceList} contentContainerStyle={styles.practiceContent}>
        {practiceSessions.map((session) => renderPracticeCard(session))}
      </ScrollView>
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
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  statsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  upcomingIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingCompany: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  upcomingPosition: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  upcomingDate: {
    fontSize: 12,
    color: '#4F46E5',
    marginTop: 4,
  },
  upcomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  upcomingBadgeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoriesContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    gap: 8,
  },
  categoryTabActive: {
    backgroundColor: '#4F46E5',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  practiceList: {
    flex: 1,
  },
  practiceContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  practiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  practiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  practiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  practiceInfo: {
    flex: 1,
  },
  practiceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  practiceDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  practiceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  difficultyBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  retryText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  cardFooter: {
    marginTop: 8,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InterviewPrepScreen;
