package com.applyasaservice.service

import com.applyasaservice.repository.JobRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Job service for job search and management
 */
class JobService(private val jobRepository: JobRepository) {
    
    private val _jobSearchState = MutableStateFlow<JobSearchState>(JobSearchState.Idle)
    val jobSearchState: StateFlow<JobSearchState> = _jobSearchState.asStateFlow()
    
    private val _jobs = MutableStateFlow<List<JobPosting>>(emptyList())
    val jobs: StateFlow<List<JobPosting>> = _jobs.asStateFlow()
    
    private val _savedJobs = MutableStateFlow<List<JobPosting>>(emptyList())
    val savedJobs: StateFlow<List<JobPosting>> = _savedJobs.asStateFlow()
    
    private val _recommendedJobs = MutableStateFlow<List<JobPosting>>(emptyList())
    val recommendedJobs: StateFlow<List<JobPosting>> = _recommendedJobs.asStateFlow()
    
    suspend fun searchJobs(criteria: JobSearchCriteria): Result<List<JobPosting>> {
        _jobSearchState.value = JobSearchState.Loading
        
        return try {
            val result = jobRepository.searchJobs(criteria)
            _jobs.value = result
            _jobSearchState.value = JobSearchState.Success
            Result.success(result)
        } catch (e: Exception) {
            _jobSearchState.value = JobSearchState.Error(e.message ?: "Search failed")
            Result.failure(e)
        }
    }
    
    suspend fun loadMoreJobs(criteria: JobSearchCriteria, page: Int): Result<List<JobPosting>> {
        return try {
            val result = jobRepository.searchJobs(criteria.copy(page = page))
            _jobs.value = _jobs.value + result
            Result.success(result)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getJobDetails(jobId: String): Result<JobPosting> {
        return jobRepository.getJobById(jobId)
    }
    
    suspend fun saveJob(jobId: String): Result<Unit> {
        return try {
            jobRepository.saveJob(jobId)
            _savedJobs.value = _savedJobs.value + (_jobs.value.find { it.id == jobId } ?: return Result.success(Unit))
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun unsaveJob(jobId: String): Result<Unit> {
        return try {
            jobRepository.unsaveJob(jobId)
            _savedJobs.value = _savedJobs.value.filter { it.id != jobId }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun loadSavedJobs(): Result<List<JobPosting>> {
        return try {
            val result = jobRepository.getSavedJobs()
            _savedJobs.value = result
            Result.success(result)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun loadRecommendedJobs(): Result<List<JobPosting>> {
        return try {
            val result = jobRepository.getRecommendedJobs()
            _recommendedJobs.value = result
            Result.success(result)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    fun clearSearch() {
        _jobs.value = emptyList()
        _jobSearchState.value = JobSearchState.Idle
    }
}

/**
 * Job search state
 */
sealed class JobSearchState {
    data object Idle : JobSearchState()
    data object Loading : JobSearchState()
    data object Success : JobSearchState()
    data class Error(val message: String) : JobSearchState()
}

/**
 * Job search criteria
 */
data class JobSearchCriteria(
    val query: String? = null,
    val location: Location? = null,
    val jobTypes: List<JobType> = emptyList(),
    val remoteTypes: List<RemoteType> = emptyList(),
    val salaryMin: Double? = null,
    val salaryMax: Double? = null,
    val experienceLevels: List<ExperienceLevel> = emptyList(),
    val skills: List<String> = emptyList(),
    val industries: List<String> = emptyList(),
    val companySizes: List<CompanySize> = emptyList(),
    val postedWithin: PostedWithin? = null,
    val page: Int = 1,
    val limit: Int = 20,
    val sortBy:Option.RELEVANCE,
    val sort SortOption = SortOrder: SortOrder = SortOrder.DESC
)

/**
 * Job posting model
 */
data class JobPosting(
    val id: String,
    val title: String,
    val company: Company,
    val location: Location,
    val jobType: JobType,
    val description: String,
    val requirements: List<String>,
    val salaryRange: SalaryRange?,
    val applicationDeadline: Long?,
    val postedAt: Long,
    val remoteType: RemoteType,
    val skills: List<String>,
    val benefits: List<String>,
    val applicationCount: Int,
    val isSaved: Boolean = false
)

data class Company(
    val id: String,
    val name: String,
    val logoUrl: String?,
    val website: String?,
    val size: CompanySize,
    val industry: String
)

data class Location(
    val city: String,
    val state: String?,
    val country: String,
    val zipCode: String?,
    val latitude: Double?,
    val longitude: Double?
)

data class SalaryRange(
    val min: Double,
    val max: Double,
    val currency: String,
    val period: SalaryPeriod
)

enum class JobType { FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP, TEMPORARY }
enum class RemoteType { ON_SITE, HYBRID, REMOTE }
enum class CompanySize { STARTUP, SMALL, MEDIUM, LARGE, ENTERPRISE }
enum class SalaryPeriod { HOURLY, MONTHLY, YEARLY }
enum class ExperienceLevel { ENTRY, MID, SENIOR, LEAD, EXECUTIVE }
enum class PostedWithin { DAY, WEEK, TWO_WEEKS, MONTH }
enum class SortOption { RELEVANCE, DATE, SALARY, DISTANCE }
enum class SortOrder { ASC, DESC }
