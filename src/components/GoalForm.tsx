import React, { useEffect } from 'react';

interface GoalFormProps {
  newGoal: any;
  setNewGoal: (goal: any) => void;
  addGoal: (e: React.FormEvent<HTMLFormElement>) => void;
}

const GoalForm: React.FC<GoalFormProps> = ({ newGoal, setNewGoal, addGoal }) => {
  useEffect(() => {
    if (newGoal.progressType !== 'hr' && newGoal.progressType !== 'cnt') {
      setNewGoal({ ...newGoal, progressType: 'hr' });
    }
  }, [newGoal, setNewGoal]);

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
            className={`px-3 py-2 rounded-lg border transition-colors duration-150 text-xs sm:text-base ${newGoal.progressType === 'hr' ? 'border-[rgb(138,5,255)] bg-blue-600 text-white' : 'border-gray-500 bg-transparent text-blue-600'} font-semibold shadow focus:outline-none focus:border-[rgb(138,5,255)]`}
            style={{ borderColor: newGoal.progressType === 'hr' ? 'var(--color-accent)' : '' }}
            onClick={() => setNewGoal({ ...newGoal, progressType: 'hr' })}
          >
            Hr
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
        <input
          type="number"
          placeholder="Estimated Effort"
          value={newGoal.estimatedEffort}
          onChange={e => setNewGoal({ ...newGoal, estimatedEffort: Number(e.target.value) })}
          required
          className="border border-transparent rounded-lg px-3 py-2 w-1/2 focus:outline-none focus-accent-border min-w-0"
        />
        <button
          type="submit"
          className="w-1/2 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow transition border"
          style={{ borderWidth: '0.5px', borderColor: 'var(--color-accent)' }}
        >
          Add Goal
        </button>
      </div>
    </form>
  );
};

export default GoalForm;
