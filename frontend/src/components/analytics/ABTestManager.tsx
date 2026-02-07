import React, { useState } from 'react';
import { ABExperiment, ABVariant, ABResult } from '../../types/analytics';

interface ABTestManagerProps {
  experiments: ABExperiment[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onCreate: (experiment: Partial<ABExperiment>) => void;
  onUpdate: (id: string, updates: Partial<ABExperiment>) => void;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onComplete: (id: string) => void;
}

export const ABTestManager: React.FC<ABTestManagerProps> = ({
  experiments,
  selectedId,
  onSelect,
  onCreate,
  onUpdate,
  onStart,
  onPause,
  onComplete,
}) => {
  const [filter, setFilter] = useState<'all' | 'draft' | 'running' | 'completed'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredExperiments = experiments.filter(
    (e) => filter === 'all' || e.status === filter
  );

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; label: string }> = {
      draft: { class: 'badge-draft', label: 'Draft' },
      running: { class: 'badge-running', label: 'Running' },
      paused: { class: 'badge-paused', label: 'Paused' },
      completed: { class: 'badge-completed', label: 'Completed' },
    };
    return badges[status] || { class: '', label: status };
  };

  const selectedExperiment = experiments.find((e) => e.id === selectedId);

  return (
    <div className="ab-test-manager">
      <div className="manager-header">
        <h3>A/B Testing</h3>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + New Experiment
        </button>
      </div>

      <div className="experiment-filters">
        {(['all', 'draft', 'running', 'completed'] as const).map((status) => (
          <button
            key={status}
            className={filter === status ? 'active' : ''}
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="experiment-list">
        {filteredExperiments.map((experiment) => {
          const badge = getStatusBadge(experiment.status);
          const progress = Math.min(
            (experiment.currentSample / experiment.minSampleSize) * 100,
            100
          );

          return (
            <div
              key={experiment.id}
              className={`experiment-card ${selectedId === experiment.id ? 'selected' : ''}`}
              onClick={() => onSelect(experiment.id)}
            >
              <div className="card-header">
                <h4>{experiment.name}</h4>
                <span className={`badge ${badge.class}`}>{badge.label}</span>
              </div>
              <p className="card-description">{experiment.description}</p>
              <div className="card-meta">
                <span>{experiment.variants.length} variants</span>
                <span>n = {experiment.currentSample.toLocaleString()}</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="card-actions">
                {experiment.status === 'draft' && (
                  <button onClick={(e) => { e.stopPropagation(); onStart(experiment.id); }}>
                    Start
                  </button>
                )}
                {experiment.status === 'running' && (
                  <button onClick={(e) => { e.stopPropagation(); onPause(experiment.id); }}>
                    Pause
                  </button>
                )}
                {experiment.status === 'paused' && (
                  <button onClick={(e) => { e.stopPropagation(); onStart(experiment.id); }}>
                    Resume
                  </button>
                )}
                {(experiment.status === 'running' || experiment.status === 'paused') && (
                  <button onClick={(e) => { e.stopPropagation(); onComplete(experiment.id); }}>
                    Complete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedExperiment && (
        <div className="experiment-detail">
          <h3>{selectedExperiment.name}</h3>
          <p>{selectedExperiment.description}</p>

          <div className="variants-section">
            <h4>Variants</h4>
            {selectedExperiment.variants.map((variant, index) => {
              const isWinner = selectedExperiment.results?.winner === variant.id;
              return (
                <div
                  key={variant.id}
                  className={`variant-card ${variant.isControl ? 'control' : ''} ${isWinner ? 'winner' : ''}`}
                >
                  {variant.isControl && <span className="control-badge">Control</span>}
                  {isWinner && <span className="winner-badge">Winner</span>}
                  <h5>{variant.name}</h5>
                  <p>{variant.description}</p>
                  <div className="variant-stats">
                    <span>Traffic: {variant.trafficWeight}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedExperiment.results && (
            <div className="results-section">
              <h4>Results</h4>
              <div className="results-summary">
                <div className="result-item">
                  <span className="result-label">Winner</span>
                  <span className="result-value">
                    {selectedExperiment.results.winner
                      ? selectedExperiment.variants.find((v) => v.id === selectedExperiment.results?.winner)?.name
                      : 'Not determined'}
                  </span>
                </div>
                <div className="result-item">
                  <span className="result-label">Improvement</span>
                  <span className="result-value">
                    {selectedExperiment.results.improvement?.toFixed(2)}%
                  </span>
                </div>
                <div className="result-item">
                  <span className="result-label">Confidence</span>
                  <span className="result-value">
                    {selectedExperiment.results.confidence?.toFixed(1)}%
                  </span>
                </div>
                <div className="result-item">
                  <span className="result-label">Significant</span>
                  <span className={`result-value ${selectedExperiment.results.isSignificant ? 'positive' : ''}`}>
                    {selectedExperiment.results.isSignificant ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <CreateExperimentModal
          onClose={() => setShowCreateModal(false)}
          onCreate={onCreate}
        />
      )}
    </div>
  );
};

interface CreateExperimentModalProps {
  onClose: () => void;
  onCreate: (experiment: Partial<ABExperiment>) => void;
}

const CreateExperimentModal: React.FC<CreateExperimentModalProps> = ({
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [variants, setVariants] = useState<Partial<ABVariant>[]>([
    { name: 'Control', isControl: true, trafficWeight: 50, config: {} },
    { name: 'Variant A', isControl: false, trafficWeight: 50, config: {} },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      name,
      description,
      variants: variants as ABVariant[],
      status: 'draft',
      trafficSplit: variants.map((v) => ({
        variant: v.name || '',
        weight: v.trafficWeight || 0,
      })),
    });
    onClose();
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        name: `Variant ${String.fromCharCode(65 + variants.length - 1)}`,
        isControl: false,
        trafficWeight: 0,
        config: {},
      },
    ]);
  };

  const updateVariant = (index: number, updates: Partial<ABVariant>) => {
    setVariants(variants.map((v, i) => (i === index ? { ...v, ...updates } : v)));
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Create New Experiment</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Variants</label>
            {variants.map((variant, index) => (
              <div key={index} className="variant-input">
                <input
                  type="text"
                  value={variant.name}
                  onChange={(e) => updateVariant(index, { name: e.target.value })}
                  placeholder="Variant name"
                  required
                />
                <input
                  type="number"
                  value={variant.trafficWeight}
                  onChange={(e) =>
                    updateVariant(index, { trafficWeight: parseInt(e.target.value, 10) })
                  }
                  placeholder="Weight"
                  min="0"
                  max="100"
                  required
                />
                {index > 1 && (
                  <button
                    type="button"
                    className="remove-variant"
                    onClick={() => setVariants(variants.filter((_, i) => i !== index))}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="add-variant" onClick={addVariant}>
              + Add Variant
            </button>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Experiment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ABTestManager;
