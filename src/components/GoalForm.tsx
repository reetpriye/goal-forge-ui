import React from 'react';

interface GoalFormProps {
  newGoal: any;
  setNewGoal: (goal: any) => void;
  addGoal: (e: React.FormEvent<HTMLFormElement>) => void;
}

const GoalForm: React.FC<GoalFormProps> = ({ newGoal, setNewGoal, addGoal }) => (
  <form onSubmit={addGoal} className="flex gap-4 mb-6 items-end">
    <input
      type="text"
      placeholder="Goal Name"
      value={newGoal.goalName}
      onChange={e => setNewGoal({ ...newGoal, goalName: e.target.value })}
      required
      className="border rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-blue-400"
    />
    <select
      value={newGoal.progressType}
      onChange={e => setNewGoal({ ...newGoal, progressType: e.target.value })}
      required
      className="border rounded-lg px-3 py-2 w-40 focus:ring-2 focus:ring-blue-400"
    >
      <option value="" disabled>Select Type</option>
      <option value="hr">Hours (hr)</option>
      <option value="cnt">Count (cnt)</option>
    </select>
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

export default GoalForm;
