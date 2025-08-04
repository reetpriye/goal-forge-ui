import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

interface EffortModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: any;
  selectedDate: string;
  jwt: string | null;
  onEffortSaved: () => void;
}

const EffortModal: React.FC<EffortModalProps> = ({ isOpen, onClose, goal, selectedDate, jwt, onEffortSaved }) => {
  const [inputHours, setInputHours] = useState<number>(0);
  const [inputMinutes, setInputMinutes] = useState<number>(0);
  const [inputEffort, setInputEffort] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset inputs when modal opens
  useEffect(() => {
    if (isOpen) {
      setInputHours(0);
      setInputMinutes(0);
      setInputEffort('');
      setError(null);
    }
  }, [isOpen]);

  // Update total effort when duration changes
  useEffect(() => {
    if (goal?.progressType === 'dur') {
      const totalMinutes = inputHours * 60 + inputMinutes;
      setInputEffort(totalMinutes.toString());
    }
  }, [inputHours, inputMinutes, goal?.progressType]);

  // Helper function to format duration for display
  const formatDuration = (minutes: number) => {
    if (minutes === 0) return '0';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins}m`;
  };

  const handleSave = async () => {
    if (!goal || !selectedDate) return;

    const effortValue = goal.progressType === 'dur' 
      ? inputHours * 60 + inputMinutes 
      : Number(inputEffort);

    if (effortValue <= 0) {
      setError('Effort must be greater than 0');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (jwt) {
        // Save to backend
        const response = await fetch(`${API_URL}/api/goals/${goal.id}/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`
          },
          body: JSON.stringify({
            date: selectedDate,
            effort: effortValue
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          // Extract just the message from error response
          const errorMessage = errorData?.message || errorData?.error || 'Failed to save effort';
          throw new Error(errorMessage);
        }
      } else {
        // Save to localStorage for anonymous users
        const localGoals = localStorage.getItem('goals');
        if (localGoals) {
          const goals = JSON.parse(localGoals);
          const goalIndex = goals.findIndex((g: any) => g.id === goal.id);
          
          if (goalIndex !== -1) {
            if (!goals[goalIndex].progressCalendar) {
              goals[goalIndex].progressCalendar = [];
            }
            
            // Update or add progress entry
            const existingEntryIndex = goals[goalIndex].progressCalendar.findIndex(
              (entry: any) => entry.date === selectedDate
            );
            
            if (existingEntryIndex !== -1) {
              goals[goalIndex].progressCalendar[existingEntryIndex].effort = effortValue;
            } else {
              goals[goalIndex].progressCalendar.push({ date: selectedDate, effort: effortValue });
            }
            
            // Update invested and remaining effort
            const totalInvested = goals[goalIndex].progressCalendar.reduce(
              (sum: number, entry: any) => sum + (Number(entry.effort) || 0), 0
            );
            goals[goalIndex].investedEffort = totalInvested;
            goals[goalIndex].remainingEffort = goals[goalIndex].estimatedEffort - totalInvested;
            
            localStorage.setItem('goals', JSON.stringify(goals));
          }
        }
      }

      onEffortSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save effort');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const formattedDate = selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString() : '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Add Effort</h2>
        <p className="text-gray-600 mb-4">
          Logging effort for <strong>{formattedDate}</strong>
        </p>
        <p className="text-gray-600 mb-4">
          Goal: <strong>{goal?.goalName}</strong>
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {goal?.progressType === 'dur' ? (
            // Duration input (hours and minutes)
            <div>
              <label className="block text-sm font-medium mb-2">Duration</label>
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Hours"
                    value={inputHours || ''}
                    onChange={e => {
                      const value = e.target.value;
                      if (value === '' || Number(value) >= 0) {
                        setInputHours(value === '' ? 0 : Number(value));
                      }
                    }}
                    min="0"
                    autoFocus
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Minutes"
                    value={inputMinutes || ''}
                    onChange={e => {
                      const value = e.target.value;
                      const numValue = Number(value);
                      if (value === '' || (numValue >= 0 && numValue <= 59)) {
                        setInputMinutes(value === '' ? 0 : numValue);
                      }
                    }}
                    min="0"
                    max="59"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
              {(inputHours > 0 || inputMinutes > 0) && (
                <div className="text-sm text-gray-600 mt-2">
                  Total: {formatDuration(inputHours * 60 + inputMinutes)}
                </div>
              )}
            </div>
          ) : (
            // Count input
            <div>
              <label className="block text-sm font-medium mb-2">Count</label>
              <input
                type="number"
                placeholder="Enter count"
                value={inputEffort}
                onChange={e => setInputEffort(e.target.value)}
                min="1"
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={isLoading || (goal?.progressType === 'dur' ? (inputHours === 0 && inputMinutes === 0) : !inputEffort || Number(inputEffort) <= 0)}
          >
            {isLoading ? 'Saving...' : 'Save Effort'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EffortModal;
