/**
 * Home Screen - Main job search screen
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import { AppDispatch, RootState } from '../store';
import { searchJobs, setSearchCriteria, toggleSaveJob } from '../store/slices/jobsSlice';
import { JobPosting } from '../store/slices/jobsSlice';

const HomeScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { jobs, isLoading, searchCriteria, hasMore } = useSelector(
    (state: RootState) => state.jobs
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = () => {
    dispatch(searchJobs({ ...searchCriteria, query: searchQuery || null }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    dispatch(searchJobs({ ...searchCriteria, query: searchQuery || null, page: 1 }));
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      dispatch(searchJobs({ ...searchCriteria, query: searchQuery || null, page: searchCriteria.page + 1 }));
    }
  };

  const handleJobPress = (jobId: string) => {
    navigation.navigate('JobDetail' as never, { jobId } as never);
  };

  const handleSaveJob = (jobId: string) => {
    dispatch(toggleSaveJob(jobId));
  };

  const renderJobItem = ({ item }: { item: JobPosting }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => handleJobPress(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.jobHeader}>
        <View style={styles.companyLogo}>
          <Text style={styles.companyLogoText}>
            {item.company.name.substring(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.companyName}>{item.company.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => handleSaveJob(item.id)}
        >
          <Icon
            name={item.isSaved ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={item.isSaved ? '#007AFF' : '#8E8E93'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.jobDetails}>
        <View style={styles.detailItem}>
          <Icon name="location-outline" size={16} color="#8E8E93" />
          <Text style={styles.detailText}>
            {item.location.city}, {item.location.state || item.location.country}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="time-outline" size={16} color="#8E8E93" />
          <Text style={styles.detailText}>{item.jobType}</Text>
        </View>
        {item.salaryRange && (
          <View style={styles.detailItem}>
            <Icon name="cash-outline" size={16} color="#8E8E93" />
            <Text style={styles.detailText}>
              ${item.salaryRange.min.toLocaleString()} - ${item.salaryRange.max.toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.skillsContainer}>
        {item.skills.slice(0, 4).map((skill, index) => (
          <View key={index} style={styles.skillBadge}>
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
      </View>

      <View style={styles.jobFooter}>
        <Text style={styles.postedText}>
          Posted {getTimeAgo(item.postedAt)}
        </Text>
        <Text style={styles.applicantsText}>
          {item.applicationCount} applicants
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="search-outline" size={64} color="#8E8E93" />
      <Text style={styles.emptyTitle}>No Jobs Found</Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your search criteria
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search-outline" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs, companies..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-outline" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Icon
            name="options-outline"
            size={24}
            color={showFilters ? '#007AFF' : '#8E8E93'}
          />
        </TouchableOpacity>
      </View>

      {/* Filter Pills */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['Full-time', 'Part-time', 'Remote', 'Hybrid'].map((filter) => (
              <TouchableOpacity key={filter} style={styles.filterPill}>
                <Text style={styles.filterText}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Job List */}
      <FlatList
        data={jobs}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmptyList}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    marginLeft: 12,
    justifyContent: 'center',
    padding: 8,
  },
  filtersContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    color: '#333333',
  },
  listContent: {
    padding: 16,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  companyLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyLogoText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  jobInfo: {
    flex: 1,
    marginLeft: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    color: '#007AFF',
  },
  saveButton: {
    padding: 4,
  },
  jobDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 4,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  skillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#007AFF10',
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  skillText: {
    fontSize: 12,
    color: '#007AFF',
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  postedText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  applicantsText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  loadingFooter: {
    paddingVertical: 16,
  },
});

// Helper function
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 604800)}w ago`;
}

// Import ScrollView for filters
import { ScrollView } from 'react-native';

export default HomeScreen;
