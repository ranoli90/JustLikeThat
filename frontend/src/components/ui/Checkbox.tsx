'use client';

import { InputHTMLAttributes } from 'react';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = ({
  label,
  className = '',
  ...props
}: CheckboxProps) => {
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        className={`w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300 ${className}`}
        {...props}
      />
      {label && (
        <label className="ml-2 block text-sm text-gray-700">
          {label}
        </label>
      )}
    </div>
  );
};
