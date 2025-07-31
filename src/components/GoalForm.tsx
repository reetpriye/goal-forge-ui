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
      className="flex gap-4 mb-6 items-end"
    >
      <input
        type="text"
        placeholder="Goal Name"
        value={newGoal.goalName}
        onChange={e => setNewGoal({ ...newGoal, goalName: e.target.value })}
        required
        className="border rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-blue-400"
      />
      <div className="flex gap-2">
        <button
          type="button"
          className={`px-4 py-2 rounded-lg border transition-colors duration-150 ${newGoal.progressType === 'hr' ? 'bg-blue-600 text-white ring-2 ring-blue-400' : 'bg-white text-blue-600'} font-semibold shadow focus:outline-none`}
          style={{ boxShadow: newGoal.progressType === 'hr' ? '0 0 0 2px #2563eb' : undefined }}
          onClick={() => setNewGoal({ ...newGoal, progressType: 'hr' })}
        >
          Hr
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded-lg border transition-colors duration-150 ${newGoal.progressType === 'cnt' ? 'bg-blue-600 text-white ring-2 ring-blue-400' : 'bg-white text-blue-600'} font-semibold shadow focus:outline-none`}
          style={{ boxShadow: newGoal.progressType === 'cnt' ? '0 0 0 2px #2563eb' : undefined }}
          onClick={() => setNewGoal({ ...newGoal, progressType: 'cnt' })}
        >
          Cnt
        </button>
      </div>
      <input
        type="number"
        placeholder="Estimated Effort"
        value={newGoal.estimatedEffort}
        onChange={e => setNewGoal({ ...newGoal, estimatedEffort: Number(e.target.value) })}
        required
        className="border rounded-lg px-3 py-2 w-40 focus:ring-2 focus:ring-blue-400"
      />
      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow transition">Add Goal</button>
    </form>
  );
};

export default GoalForm;
