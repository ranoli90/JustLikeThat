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
        className={`size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${className}`}
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
