import React, { useState } from 'react';

interface ExpressionBuilderProps {
  onClose: () => void;
  onApply: (expression: any) => void;
  initialValue?: any;
}

const OPERATORS = [
  { value: 'eq', label: 'Equals (=)' },
  { value: 'ne', label: 'Not Equals (≠)' },
  { value: 'gt', label: 'Greater Than (>)' },
  { value: 'gte', label: 'Greater Than or Equal (≥)' },
  { value: 'lt', label: 'Less Than (<)' },
  { value: 'lte', label: 'Less Than or Equal (≤)' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Not Contains' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'in', label: 'In List' },
  { value: 'not_in', label: 'Not In List' },
  { value: 'is_null', label: 'Is Null' },
  { value: 'is_not_null', label: 'Is Not Null' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
  { value: 'regex', label: 'Matches Regex' },
  { value: 'between', label: 'Between' },
];

const LOGICAL_OPERATORS = [
  { value: 'AND', label: 'AND' },
  { value: 'OR', label: 'OR' },
];

const FUNCTIONS = [
  { value: 'length', label: 'length() - Get string/array length' },
  { value: 'uppercase', label: 'uppercase() - Convert to uppercase' },
  { value: 'lowercase', label: 'lowercase() - Convert to lowercase' },
  { value: 'trim', label: 'trim() - Remove whitespace' },
  { value: 'now', label: 'now() - Current timestamp' },
  { value: 'formatDate', label: 'formatDate() - Format date' },
  { value: 'sum', label: 'sum() - Sum of numbers' },
  { value: 'avg', label: 'avg() - Average of numbers' },
  { value: 'max', label: 'max() - Maximum value' },
  { value: 'min', label: 'min() - Minimum value' },
  { value: 'round', label: 'round() - Round number' },
];

const ExpressionBuilder: React.FC<ExpressionBuilderProps> = ({
  onClose,
  onApply,
  initialValue,
}) => {
  const [conditions, setConditions] = useState<any[]>(
    initialValue?.conditions || [{ field: '', operator: 'eq', value: '' }]
  );
  const [logicalOperator, setLogicalOperator] = useState('AND');
  const [previewMode, setPreviewMode] = useState(false);
  const [testValues, setTestValues] = useState<Record<string, string>>({});

  const addCondition = () => {
    setConditions([...conditions, { field: '', operator: 'eq', value: '' }]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, key: string, value: string) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [key]: value };
    setConditions(updated);
  };

  const handleApply = () => {
    onApply({
      conditions,
      logicalOperator,
    });
  };

  const generateExpression = () => {
    const expr = conditions
      .map((c, i) => {
        if (c.operator === 'is_null' || c.operator === 'is_not_null' || c.operator === 'is_empty' || c.operator === 'is_not_empty') {
          return `${c.field} ${OPERATORS.find(o => o.value === c.operator)?.label}`;
        }
        return `${c.field} ${OPERATORS.find(o => o.value === c.operator)?.label} ${c.value}`;
      })
      .join(` ${logicalOperator} `);
    return expr;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            Expression Builder
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6B7280',
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {/* Logical Operator */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
              Logical Operator
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {LOGICAL_OPERATORS.map((op) => (
                <button
                  key={op.value}
                  onClick={() => setLogicalOperator(op.value)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: logicalOperator === op.value ? '#3B82F6' : '#F3F4F6',
                    color: logicalOperator === op.value ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditions */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500 }}>
                Conditions
              </label>
              <button
                onClick={addCondition}
                style={{
                  padding: '4px 12px',
                  backgroundColor: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                + Add Condition
              </button>
            </div>

            {conditions.map((condition, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '8px',
                  alignItems: 'center',
                }}
              >
                <input
                  type="text"
                  placeholder="Field path (e.g., input.status)"
                  value={condition.field}
                  onChange={(e) => updateCondition(index, 'field', e.target.value)}
                  style={{
                    flex: 2,
                    padding: '8px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                >
                  {OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
                {!['is_null', 'is_not_null', 'is_empty', 'is_not_empty'].includes(condition.operator) && (
                  <input
                    type="text"
                    placeholder="Value"
                    value={condition.value}
                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '13px',
                    }}
                  />
                )}
                <button
                  onClick={() => removeCondition(index)}
                  style={{
                    padding: '8px',
                    backgroundColor: '#FEE2E2',
                    color: '#991B1B',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Preview */}
          <div
            style={{
              padding: '12px',
              backgroundColor: '#F3F4F6',
              borderRadius: '6px',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
              Expression Preview:
            </div>
            <code style={{ fontSize: '13px' }}>{generateExpression()}</code>
          </div>

          {/* Functions */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
              Available Functions
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {FUNCTIONS.map((fn) => (
                <span
                  key={fn.value}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#EDE9FE',
                    color: '#5B21B6',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                  title={fn.label}
                >
                  {fn.value}()
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpressionBuilder;
