import React from 'react';

interface ImportChoiceModalProps {
  show: boolean;
  onAppend: () => void;
  onReset: () => void;
  onCancel: () => void;
  onSkip: () => void;
}

const ImportChoiceModal: React.FC<ImportChoiceModalProps> = ({ show, onAppend, onReset, onCancel, onSkip }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="p-8 min-w-[350px]" style={{background: 'rgb(12,12,12)', boxShadow: 'none', borderRadius: 0}}>
        <h2 className="text-lg font-bold mb-4">Import Local Goals</h2>
        <p className="mb-6 text-gray-700">You have unsaved goals in your browser. What would you like to do?</p>
        <div className="flex flex-col gap-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={onAppend}>
            Append local goals to your account
          </button>
          <button className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600" onClick={onReset}>
            Reset your account with local goals (overwrite)
          </button>
          <button className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600" onClick={onSkip}>
            Skip Import (keep server goals)
          </button>
          <button className="mt-2 text-gray-600 hover:underline" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportChoiceModal;
