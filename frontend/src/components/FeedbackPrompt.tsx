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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-black/50 p-4">
        <div className="w-full max-w-md">
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
      <Card className="max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {title || 'We value your feedback!'}
            </h3>
            <p className="text-sm text-gray-600">
              {description || 'Help us improve by sharing your experience.'}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="ml-4 text-gray-400 transition-colors hover:text-gray-600"
          >
            ×
          </button>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleAccept}
            disabled={isLoading}
            className="bg-blue-600 text-white hover:bg-blue-700"
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
