import React, { useState } from 'react';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  definition: any;
  isPublic: boolean;
  usageCount: number;
}

interface TemplateLibraryProps {
  onSelectTemplate?: (template: WorkflowTemplate) => void;
  onClose?: () => void;
}

const CATEGORIES = [
  { id: 'Communication', name: 'Communication', icon: '📧' },
  { id: 'Data', name: 'Data Processing', icon: '📊' },
  { id: 'Business Process', name: 'Business Process', icon: '📋' },
  { id: 'Performance', name: 'Performance', icon: '⚡' },
  { id: 'Reliability', name: 'Reliability', icon: '🛡️' },
];

const TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'tmpl-email-notification',
    name: 'Email Notification Workflow',
    description: 'Send email notifications based on various triggers with templates and personalization',
    category: 'Communication',
    definition: {},
    isPublic: true,
    usageCount: 1250,
  },
  {
    id: 'tmpl-data-processing',
    name: 'Data Processing Pipeline',
    description: 'Extract, transform, and load data through multiple processing stages',
    category: 'Data',
    definition: {},
    isPublic: true,
    usageCount: 890,
  },
  {
    id: 'tmpl-conditional-approval',
    name: 'Conditional Approval Process',
    description: 'Route items for approval based on configurable business rules',
    category: 'Business Process',
    definition: {},
    isPublic: true,
    usageCount: 650,
  },
  {
    id: 'tmpl-parallel-processing',
    name: 'Parallel Processing',
    description: 'Process multiple items concurrently with fan-out/fan-in pattern',
    category: 'Performance',
    definition: {},
    isPublic: true,
    usageCount: 420,
  },
  {
    id: 'tmpl-error-recovery',
    name: 'Error Recovery',
    description: 'Handle errors with retry, fallback, and compensation actions',
    category: 'Reliability',
    definition: {},
    isPublic: true,
    usageCount: 380,
  },
  {
    id: 'tmpl-webhook-handler',
    name: 'Webhook Handler',
    description: 'Receive and process webhooks with validation and transformation',
    category: 'Communication',
    definition: {},
    isPublic: true,
    usageCount: 720,
  },
  {
    id: 'tmpl-scheduled-task',
    name: 'Scheduled Task Runner',
    description: 'Execute tasks on a schedule with configurable intervals',
    category: 'Data',
    definition: {},
    isPublic: true,
    usageCount: 560,
  },
];

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onSelectTemplate,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);

  const filteredTemplates = TEMPLATES.filter((template) => {
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectTemplate = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
  };

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate?.(selectedTemplate);
    }
  };

  return (
    <div className="template-library" style={{ display: 'flex', height: '100%' }}>
      {/* Sidebar */}
      <div
        style={{
          width: '250px',
          borderRight: '1px solid #E5E7EB',
          padding: '16px',
          overflowY: 'auto',
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>
          Categories
        </h3>

        <button
          onClick={() => setSelectedCategory(null)}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: !selectedCategory ? '#EFF6FF' : 'transparent',
            color: !selectedCategory ? '#3B82F6' : '#374151',
            border: 'none',
            borderRadius: '6px',
            textAlign: 'left',
            cursor: 'pointer',
            marginBottom: '4px',
            fontSize: '14px',
          }}
        >
          All Templates
        </button>

        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: selectedCategory === category.id ? '#EFF6FF' : 'transparent',
              color: selectedCategory === category.id ? '#3B82F6' : '#374151',
              border: 'none',
              borderRadius: '6px',
              textAlign: 'left',
              cursor: 'pointer',
              marginBottom: '4px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Search */}
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
          <span style={{ fontSize: '13px', color: '#6B7280' }}>
            {filteredTemplates.length} templates
          </span>
        </div>

        {/* Templates Grid */}
        <div
          style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
            alignContent: 'start',
          }}
        >
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              style={{
                padding: '16px',
                backgroundColor: selectedTemplate?.id === template.id ? '#EFF6FF' : 'white',
                border: `2px solid ${selectedTemplate?.id === template.id ? '#3B82F6' : '#E5E7EB'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: '#6B7280',
                  }}
                >
                  {template.category}
                </span>
                {template.isPublic && (
                  <span
                    style={{
                      padding: '2px 6px',
                      backgroundColor: '#D1FAE5',
                      color: '#065F46',
                      borderRadius: '4px',
                      fontSize: '10px',
                    }}
                  >
                    Public
                  </span>
                )}
              </div>

              <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600 }}>
                {template.name}
              </h4>

              <p
                style={{
                  margin: '0 0 12px 0',
                  fontSize: '13px',
                  color: '#6B7280',
                  lineHeight: 1.5,
                }}
              >
                {template.description}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                  Used {template.usageCount.toLocaleString()} times
                </span>
                <span style={{ fontSize: '12px', color: '#3B82F6' }}>
                  →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Template Detail Panel */}
      {selectedTemplate && (
        <div
          style={{
            width: '350px',
            borderLeft: '1px solid #E5E7EB',
            padding: '20px',
            overflowY: 'auto',
            backgroundColor: '#F9FAFB',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>
              {selectedTemplate.name}
            </h3>
            <span
              style={{
                padding: '4px 8px',
                backgroundColor: '#E5E7EB',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#4B5563',
              }}
            >
              {selectedTemplate.category}
            </span>
          </div>

          <p style={{ fontSize: '14px', color: '#4B5563', lineHeight: 1.6, marginBottom: '16px' }}>
            {selectedTemplate.description}
          </p>

          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
              Template Details
            </h4>
            <div style={{ fontSize: '13px', color: '#6B7280' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Usage Count</span>
                <span>{selectedTemplate.usageCount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Visibility</span>
                <span>{selectedTemplate.isPublic ? 'Public' : 'Private'}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={handleUseTemplate}
              style={{
                padding: '12px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Use This Template
            </button>
            <button
              onClick={() => {
                setSelectedTemplate(null);
                onClose?.();
              }}
              style={{
                padding: '12px',
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Cancel
            </button>
          </div>

          {/* Preview hint */}
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#DBEAFE',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#1E40AF',
            }}
          >
            💡 The template will be copied to your workspace. You can customize all nodes and connections.
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateLibrary;
