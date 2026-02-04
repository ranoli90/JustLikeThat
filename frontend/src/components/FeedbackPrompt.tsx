'use client';

import { useState } from 'react';
import { FeedbackForm, FeedbackType, FeedbackTrigger } from './FeedbackForm';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface FeedbackPromptProps {
  trigger: FeedbackTrigger;
  type?: FeedbackType;
  title?: string;
  description?: string;
  onSubmit: (data: { rating?: number; comment?: string }) => Promise<void>;
  onDismiss: () => void;
  isLoading?: boolean;
}

export function FeedbackPrompt({
  trigger,
  type = FeedbackType.NPS,
  title,
  description,
  onSubmit,
  onDismiss,
  isLoading = false,
}: FeedbackPromptProps) {
  const [isFormVisible, setIsFormVisible] = useState(false);

  const handleAccept = () => {
    setIsFormVisible(true);
  };

  const handleSubmit = async (data: { rating?: number; comment?: string }) => {
    await onSubmit(data);
  };

  if (isFormVisible) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="max-w-md w-full">
          <FeedbackForm
            type={type}
            trigger={trigger}
            onSubmit={handleSubmit}
            onCancel={() => setIsFormVisible(false)}
            isLoading={isLoading}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title || 'We value your feedback!'}
            </h3>
            <p className="text-gray-600 text-sm">
              {description || 'Help us improve by sharing your experience.'}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleAccept}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? 'Loading...' : 'Give Feedback'}
          </Button>
          <Button
            onClick={onDismiss}
            variant="secondary"
            disabled={isLoading}
          >
            Maybe later
          </Button>
        </div>
      </Card>
    </div>
  );
}
