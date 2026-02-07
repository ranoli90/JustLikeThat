'use client';

import { useState } from 'react';
import { Button } from './ui/Button';
import { TextArea } from './ui/TextArea';

export enum FeedbackType {
  NPS = 'NPS',
  CSAT = 'CSAT',
  OPEN_ENDED = 'OPEN_ENDED',
}

export enum FeedbackTrigger {
  APPLICATION_COMPLETED = 'APPLICATION_COMPLETED',
  INTERVIEW_COMPLETED = 'INTERVIEW_COMPLETED',
  REJECTION = 'REJECTION',
  ONBOARDING = 'ONBOARDING',
  GENERAL = 'GENERAL',
}

interface FeedbackFormProps {
  type: FeedbackType;
  trigger: FeedbackTrigger;
  onSubmit: (data: { rating?: number; comment?: string }) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function FeedbackForm({ type, trigger, onSubmit, onCancel, isLoading = false }: FeedbackFormProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await onSubmit({
        rating: rating || undefined,
        comment: comment || undefined,
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  if (submitted) {
    return (
      <div className="p-6 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
          <span className="text-2xl text-green-600">✓</span>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Thank you for your feedback!</h3>
        <p className="text-gray-600">Your input helps us improve our service.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        {type === FeedbackType.NPS && 'How likely are you to recommend us?'}
        {type === FeedbackType.CSAT && 'How satisfied were you with your experience?'}
        {type === FeedbackType.OPEN_ENDED && 'We value your feedback!'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {type === FeedbackType.NPS && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Not likely</span>
              <span>Extremely likely</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`flex size-10 items-center justify-center rounded-full border-2 font-medium transition-colors ${
                    rating === value
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        )}

        {type === FeedbackType.CSAT && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Very dissatisfied</span>
              <span>Very satisfied</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`flex size-10 items-center justify-center rounded-full border-2 font-medium transition-colors ${
                    rating === value
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="comment" className="mb-1 block text-sm font-medium text-gray-700">
            Additional comments (optional)
          </label>
          <TextArea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more about your experience..."
            className="w-full"
            disabled={isLoading}
          />
        </div>

        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading || (type !== FeedbackType.OPEN_ENDED && !rating)}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {isLoading ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </div>
      </form>
    </div>
  );
}
