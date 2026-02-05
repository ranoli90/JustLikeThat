import React, { useState, useEffect } from 'react';
import { DocumentationAPI } from '../../services/maturity.service';

interface Documentation {
  id: string;
  category: string;
  title: string;
  content: string;
  version: string;
  status: string;
  tags: string[];
  views: number;
  helpfulCount: number;
  lastUpdated: string;
}

export const DocumentationCenter: React.FC = () => {
  const [docs, setDocs] = useState<Documentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Documentation | null>(null);
  const [filter, setFilter] = useState({ category: '', status: '' });

  useEffect(() => {
    loadDocumentation();
  }, [filter]);

  const loadDocumentation = async () => {
    try {
      const response = await DocumentationAPI.getAll({ limit: 50 });
      setDocs(response.data);
    } catch (error) {
      console.error('Failed to load documentation:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['api', 'architecture', 'user', 'developer'];
  const statuses = ['draft', 'review', 'published', 'archived'];

  return (
    <div className="documentation-center">
      <div className="header">
        <h1>📚 Documentation Center</h1>
        <div className="filters">
          <select
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          >
            <option value="">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading documentation...</div>
      ) : (
        <div className="content">
          <div className="doc-list">
            {docs.map(doc => (
              <div
                key={doc.id}
                className={`doc-card ${selectedDoc?.id === doc.id ? 'selected' : ''}`}
                onClick={() => setSelectedDoc(doc)}
              >
                <h3>{doc.title}</h3>
                <div className="meta">
                  <span className={`badge ${doc.category}`}>{doc.category}</span>
                  <span className={`badge ${doc.status}`}>{doc.status}</span>
                </div>
                <p className="version">v{doc.version}</p>
                <div className="stats">
                  <span>👁 {doc.views}</span>
                  <span>👍 {doc.helpfulCount}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="doc-viewer">
            {selectedDoc ? (
              <>
                <h2>{selectedDoc.title}</h2>
                <div className="meta">
                  <span>Version: {selectedDoc.version}</span>
                  <span>Last Updated: {new Date(selectedDoc.lastUpdated).toLocaleDateString()}</span>
                </div>
                <div className="content">
                  <pre>{selectedDoc.content}</pre>
                </div>
                <div className="tags">
                  {selectedDoc.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
                <div className="actions">
                  <button onClick={() => DocumentationAPI.publish(selectedDoc.id)}>Publish</button>
                  <button onClick={() => DocumentationAPI.markHelpful(selectedDoc.id)}>👍 Helpful</button>
                </div>
              </>
            ) : (
              <div className="placeholder">Select a document to view</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentationCenter;
