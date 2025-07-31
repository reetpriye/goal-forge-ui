import React from 'react';

interface ErrorAlertProps {
  error: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ error }) => (
  error ? (
    <div className="bg-red-200 text-red-800 p-3 rounded-lg mb-4 font-semibold border border-red-400">{error}</div>
  ) : null
);

export default ErrorAlert;
