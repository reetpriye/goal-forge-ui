import React, { useEffect } from 'react';

interface GoalFormProps {
  newGoal: any;
  setNewGoal: (goal: any) => void;
  addGoal: (e: React.FormEvent<HTMLFormElement>) => void;
}

const GoalForm: React.FC<GoalFormProps> = ({ newGoal, setNewGoal, addGoal }) => {
  useEffect(() => {
    if (newGoal.progressType !== 'dur' && newGoal.progressType !== 'cnt') {
      setNewGoal({ ...newGoal, progressType: 'dur' });
    }
  }, [newGoal, setNewGoal]);

  // For duration goals, we need to handle hours and minutes separately
  const [durationHours, setDurationHours] = React.useState<string>('');
  const [durationMinutes, setDurationMinutes] = React.useState<string>('');

  // Reset duration fields when newGoal is reset (when goalName becomes empty)
  useEffect(() => {
    if (newGoal.goalName === '') {
      setDurationHours('');
      setDurationMinutes('');
    }
  }, [newGoal.goalName]);

  // Update estimatedEffort when duration changes
  useEffect(() => {
    if (newGoal.progressType === 'dur') {
      const hours = durationHours === '' ? 0 : Number(durationHours);
      const minutes = durationMinutes === '' ? 0 : Number(durationMinutes);
      const totalMinutes = hours * 60 + minutes;
      setNewGoal({ ...newGoal, estimatedEffort: totalMinutes });
    }
  }, [durationHours, durationMinutes, newGoal.progressType]);

  // Reset duration when switching to count type
  useEffect(() => {
    if (newGoal.progressType === 'cnt') {
      setDurationHours('');
      setDurationMinutes('');
    }
  }, [newGoal.progressType]);

  return (
    <form
      onSubmit={addGoal}
      className="flex flex-col gap-3 sm:flex-row sm:gap-4 mb-6 items-stretch sm:items-end w-full"
    >
      <div className="flex flex-row gap-2 w-full">
        <input
          type="text"
          placeholder="Goal Name"
          value={newGoal.goalName}
          onChange={e => setNewGoal({ ...newGoal, goalName: e.target.value })}
          required
          className="border border-transparent rounded-lg px-3 py-2 flex-1 focus:outline-none focus-accent-border min-w-0"
        />
        <div className="flex gap-1 min-w-[90px]">
          <button
            type="button"
            className={`px-3 py-2 rounded-lg border transition-colors duration-150 text-xs sm:text-base ${newGoal.progressType === 'dur' ? 'border-[rgb(138,5,255)] bg-blue-600 text-white' : 'border-gray-500 bg-transparent text-blue-600'} font-semibold shadow focus:outline-none focus:border-[rgb(138,5,255)]`}
            style={{ borderColor: newGoal.progressType === 'dur' ? 'var(--color-accent)' : '' }}
            onClick={() => setNewGoal({ ...newGoal, progressType: 'dur' })}
          >
            Dur
          </button>
          <button
            type="button"
            className={`px-3 py-2 rounded-lg border transition-colors duration-150 text-xs sm:text-base ${newGoal.progressType === 'cnt' ? 'bg-blue-600 text-white' : 'border-gray-500 bg-transparent text-blue-600'} font-semibold shadow focus:outline-none focus:border-[rgb(138,5,255)]`}
            style={{ borderColor: newGoal.progressType === 'cnt' ? 'var(--color-accent)' : '' }}
            onClick={() => setNewGoal({ ...newGoal, progressType: 'cnt' })}
          >
            Cnt
          </button>
        </div>
      </div>
      <div className="flex flex-row gap-2 w-full">
        {newGoal.progressType === 'dur' ? (
          // Duration input (hours and minutes)
          <div className="flex gap-2 w-1/2">
            <div className="flex-1">
              <input
                type="number"
                placeholder="Hr"
                value={durationHours}
                onChange={e => {
                  const value = e.target.value;
                  if (value === '' || Number(value) >= 0) {
                    setDurationHours(value);
                  }
                }}
                min="0"
                className="border border-transparent rounded-lg px-3 py-2 w-full focus:outline-none focus-accent-border h-[42px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="flex-1">
              <input
                type="number"
                placeholder="Min"
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
                className="border border-transparent rounded-lg px-3 py-2 w-full focus:outline-none focus-accent-border h-[42px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
        ) : (
          // Count input
          <input
            type="number"
            placeholder="Estimated Count"
            value={newGoal.estimatedEffort || ''}
            onChange={e => setNewGoal({ ...newGoal, estimatedEffort: e.target.value === '' ? '' : Number(e.target.value) })}
            required
            min="1"
            className="border border-transparent rounded-lg px-3 py-2 w-1/2 focus:outline-none focus-accent-border min-w-0 h-[42px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        )}
        <button
          type="submit"
          className="w-1/2 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow transition border disabled:cursor-not-allowed h-[42px] flex items-center justify-center"
          style={{ borderWidth: '0.5px', borderColor: 'var(--color-accent)' }}
          disabled={newGoal.progressType === 'dur' && (durationHours === '' && durationMinutes === '') || (durationHours === '0' && durationMinutes === '0')}
        >
          Add Goal
        </button>
      </div>
    </form>
  );
};

export default GoalForm;
