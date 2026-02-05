import React, { useState, useEffect } from 'react';
import { FAQAPI } from '../../services/maturity.service';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  helpfulCount: number;
  status: string;
}

export const FAQCenter: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ category: '', status: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [searchResults, setSearchResults] = useState<FAQ[]>([]);

  useEffect(() => {
    loadFAQs();
  }, [filter]);

  const loadFAQs = async () => {
    try {
      const [faqsRes, statsRes, catsRes] = await Promise.all([
        FAQAPI.getAll({ limit: 100 }),
        FAQAPI.getStats(),
        FAQAPI.getCategories(),
      ]);
      setFaqs(faqsRes.data);
      setStats(statsRes);
      setCategories(catsRes);
    } catch (error) {
      console.error('Failed to load FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await FAQAPI.search(searchQuery, 20);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search FAQs:', error);
    }
  };

  const handleMarkHelpful = async (id: string) => {
    try {
      await FAQAPI.markHelpful(id);
      loadFAQs();
      if (selectedFAQ?.id === id) {
        setSelectedFAQ({ ...selectedFAQ, helpfulCount: selectedFAQ.helpfulCount + 1 });
      }
    } catch (error) {
      console.error('Failed to mark FAQ as helpful:', error);
    }
  };

  const handleMarkNotHelpful = async (id: string) => {
    try {
      await FAQAPI.markNotHelpful(id);
      loadFAQs();
    } catch (error) {
      console.error('Failed to mark FAQ as not helpful:', error);
    }
  };

  const statuses = ['draft', 'published', 'archived'];

  const displayFaqs = searchResults.length > 0 ? searchResults : faqs;

  if (loading) return <div className="loading">Loading FAQ center...</div>;

  return (
    <div className="faq-center">
      <div className="header">
        <h1>❓ FAQ Center</h1>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>Search</button>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total FAQs</h3>
            <p>{stats.total}</p>
          </div>
          <div className="stat-card success">
            <h3>Published</h3>
            <p>{stats.published || 0}</p>
          </div>
          <div className="stat-card info">
            <h3>Categories</h3>
            <p>{Object.keys(stats.byCategory || {}).length}</p>
          </div>
          <div className="stat-card">
            <h3>Most Helpful</h3>
            <p>{stats.mostHelpful?.question?.substring(0, 20) || 'N/A'}...</p>
          </div>
        </div>
      )}

      <div className="filters">
        <select value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })}>
          <option value="">All Categories</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {searchResults.length > 0 && (
          <button onClick={() => { setSearchResults([]); setSearchQuery(''); }}>
            Clear Search
          </button>
        )}
      </div>

      {searchResults.length > 0 && (
        <div className="search-info">
          <p>Found {searchResults.length} results for "{searchQuery}"</p>
        </div>
      )}

      <div className="faq-content">
        <div className="faq-list">
          {displayFaqs.map(faq => (
            <div
              key={faq.id}
              className={`faq-card ${selectedFAQ?.id === faq.id ? 'selected' : ''}`}
              onClick={() => setSelectedFAQ(faq)}
            >
              <div className="faq-header">
                <span className={`badge ${faq.category}`}>{faq.category}</span>
                <span className={`badge ${faq.status}`}>{faq.status}</span>
              </div>
              <h3>{faq.question}</h3>
              <div className="faq-meta">
                <span className="keywords">
                  {faq.keywords?.slice(0, 3).map(kw => (
                    <span key={kw} className="keyword">{kw}</span>
                  ))}
                </span>
                <span className="helpful">👍 {faq.helpfulCount}</span>
              </div>
            </div>
          ))}
        </div>

        {selectedFAQ && (
          <div className="faq-detail">
            <div className="detail-header">
              <span className={`badge ${selectedFAQ.category}`}>{selectedFAQ.category}</span>
              <span className={`badge ${selectedFAQ.status}`}>{selectedFAQ.status}</span>
            </div>
            <h2>{selectedFAQ.question}</h2>
            <div className="answer">
              <p>{selectedFAQ.answer}</p>
            </div>
            <div className="keywords-section">
              <h4>Keywords</h4>
              <div className="keyword-list">
                {selectedFAQ.keywords?.map(kw => (
                  <span key={kw} className="keyword">{kw}</span>
                ))}
              </div>
            </div>
            <div className="feedback-section">
              <p>Was this helpful?</p>
              <div className="feedback-actions">
                <button onClick={() => handleMarkHelpful(selectedFAQ.id)}>Yes 👍</button>
                <button onClick={() => handleMarkNotHelpful(selectedFAQ.id)}>No 👎</button>
              </div>
              <span className="helpful-count">{selectedFAQ.helpfulCount} people found this helpful</span>
            </div>
          </div>
        )}
      </div>

      {categories.length > 0 && (
        <div className="category-cloud">
          <h3>Browse by Category</h3>
          <div className="cloud">
            {categories.map(cat => (
              <button
                key={cat}
                className={filter.category === cat ? 'active' : ''}
                onClick={() => setFilter({ ...filter, category: cat })}
              >
                {cat}
                <span className="count">{stats.byCategory?.[cat] || 0}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
