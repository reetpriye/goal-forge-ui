import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: any;
  jwt: string | null;
  onGoalUpdated: () => void;
}

const EditGoalModal: React.FC<EditGoalModalProps> = ({ isOpen, onClose, goal, jwt, onGoalUpdated }) => {
  const [editedGoal, setEditedGoal] = useState({
    goalName: '',
    progressType: 'dur',
    estimatedEffort: 0
  });
  const [durationHours, setDurationHours] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (goal && isOpen) {
      setEditedGoal({
        goalName: goal.goalName || '',
        progressType: goal.progressType || 'dur',
        estimatedEffort: goal.estimatedEffort || 0
      });

      // If it's a duration goal, split the estimated effort into hours and minutes
      if (goal.progressType === 'dur' && goal.estimatedEffort) {
        const hours = Math.floor(goal.estimatedEffort / 60);
        const minutes = goal.estimatedEffort % 60;
        setDurationHours(hours > 0 ? hours.toString() : '');
        setDurationMinutes(minutes > 0 ? minutes.toString() : '');
      } else {
        setDurationHours('');
        setDurationMinutes('');
      }
    }
  }, [goal, isOpen]);

  // Update estimatedEffort when duration changes
  useEffect(() => {
    if (editedGoal.progressType === 'dur') {
      const hours = durationHours === '' ? 0 : Number(durationHours);
      const minutes = durationMinutes === '' ? 0 : Number(durationMinutes);
      const totalMinutes = hours * 60 + minutes;
      setEditedGoal(prev => ({ ...prev, estimatedEffort: totalMinutes }));
    }
  }, [durationHours, durationMinutes, editedGoal.progressType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jwt || !goal) return;

    setIsLoading(true);
    try {
      await axios.put(`${API_URL}/api/goals/${goal.id}`, editedGoal, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      onGoalUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to update goal:', err);
      alert('Failed to update goal');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Edit Goal</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Goal Name</label>
            <input
              type="text"
              value={editedGoal.goalName}
              onChange={e => setEditedGoal({ ...editedGoal, goalName: e.target.value })}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Progress Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  editedGoal.progressType === 'dur' 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setEditedGoal({ ...editedGoal, progressType: 'dur' })}
              >
                Duration
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  editedGoal.progressType === 'cnt' 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setEditedGoal({ ...editedGoal, progressType: 'cnt' })}
              >
                Count
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {editedGoal.progressType === 'dur' ? 'Estimated Duration' : 'Estimated Count'}
            </label>
            {editedGoal.progressType === 'dur' ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Hours"
                  value={durationHours}
                  onChange={e => {
                    const value = e.target.value;
                    if (value === '' || Number(value) >= 0) {
                      setDurationHours(value);
                    }
                  }}
                  min="0"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <input
                  type="number"
                  placeholder="Minutes"
                  value={durationMinutes}
                  onChange={e => {
                    const value = e.target.value;
                    const numValue = Number(value);
                    if (value === '' || (numValue >= 0 && numValue <= 59)) {
                      setDurationMinutes(value);
                    }
                  }}
                  min="0"
                  max="59"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            ) : (
              <input
                type="number"
                value={editedGoal.estimatedEffort || ''}
                onChange={e => setEditedGoal({ ...editedGoal, estimatedEffort: e.target.value === '' ? 0 : Number(e.target.value) })}
                required
                min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isLoading || (editedGoal.progressType === 'dur' && editedGoal.estimatedEffort === 0)}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGoalModal;
