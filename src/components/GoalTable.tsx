import React from 'react';

interface GoalTableProps {
  goals: any[];
  deleteGoal: (id: string) => void;
  openCalendar: (goal: any) => void;
}

const GoalTable: React.FC<GoalTableProps> = ({ goals, deleteGoal, openCalendar }) => (
  <table className="min-w-full bg-white rounded-xl shadow-md">
    <thead>
      <tr className="bg-blue-50">
        <th className="py-3 px-4 text-left font-semibold">Goal Name</th>
        <th className="py-3 px-4 text-left font-semibold">Estimated Effort</th>
        <th className="py-3 px-4 text-left font-semibold">Invested Effort</th>
        <th className="py-3 px-4 text-left font-semibold">Remaining Effort</th>
        <th className="py-3 px-4 text-left font-semibold">Start Date</th>
        <th className="py-3 px-4 text-left font-semibold">Status</th>
        <th className="py-3 px-4 text-left font-semibold">Effort History</th>
        <th className="py-3 px-4 text-left font-semibold">Actions</th>
      </tr>
    </thead>
    <tbody>
      {goals.map(goal => (
        <tr key={goal.id} className="border-b">
          <td className="py-2 px-4 font-semibold">{goal.goalName}</td>
          <td className="py-2 px-4">{goal.progressType === 'hr' ? `${goal.estimatedEffort} hr` : goal.estimatedEffort}</td>
          <td className="py-2 px-4">{goal.progressType === 'hr' ? `${goal.investedEffort ?? 0} hr` : (goal.investedEffort ?? 0)}</td>
          <td className="py-2 px-4">{goal.progressType === 'hr' ? `${goal.remainingEffort ?? (goal.estimatedEffort - (goal.investedEffort ?? 0))} hr` : (goal.remainingEffort ?? (goal.estimatedEffort - (goal.investedEffort ?? 0)))}</td>
          <td className="py-2 px-4">{goal.startDate ?? '-'}</td>
          <td className="py-2 px-4">{goal.status}</td>
          <td className="py-2 px-4">
            {goal.progressCalendar && Array.isArray(goal.progressCalendar) && goal.progressCalendar.length > 0 ? (
              <ul className="list-disc ml-4">
                {goal.progressCalendar.map((entry: any, idx: number) => (
                  <li key={idx}>{entry.date}: {entry.effort}</li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-400">No effort yet</span>
            )}
          </td>
          <td className="py-2 px-4">
            <button onClick={() => deleteGoal(goal.id)} className="bg-red-500 text-white px-3 py-1 rounded-lg mr-2 shadow transition">Delete</button>
            <button onClick={() => openCalendar(goal)} className="bg-blue-500 text-white px-3 py-1 rounded-lg shadow transition">Calendar</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default GoalTable;
