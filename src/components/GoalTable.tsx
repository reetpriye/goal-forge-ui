import React from 'react';
import { FaPlay, FaPause, FaRedo } from 'react-icons/fa';
import axios from 'axios';

interface GoalTableProps {
  goals: any[];
  fetchGoals: (token?: string) => void;
  jwt: string | null;
  openCalendar: (goal: any) => void;
}

const GoalTable: React.FC<GoalTableProps> = ({ goals, fetchGoals, jwt, openCalendar }) => {
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);
  const handleStatusAction = async (goal: any, action: 'start' | 'pause' | 'resume') => {
    if (!jwt) return;
    setActionLoadingId(goal.id);
    try {
      let endpoint = '';
      if (action === 'start') endpoint = 'start';
      else if (action === 'pause') endpoint = 'pause';
      else if (action === 'resume') endpoint = 'resume';
      await axios.post(`http://localhost:8080/api/goals/${goal.id}/${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      await fetchGoals(jwt);
    } catch (err) {
      alert('Failed to update goal status');
    }
    setActionLoadingId(null);
  };
  return (
    <div className="relative">
      {actionLoadingId && (
        <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center z-10">
          <span className="text-lg font-semibold text-gray-700">Updating...</span>
        </div>
      )}
      <table className="min-w-full bg-white rounded-xl shadow-md">
        <thead>
          <tr className="bg-blue-50">
            <th className="py-3 px-4 text-left font-semibold">Actions</th>
            <th className="py-3 px-4 text-left font-semibold">Calendar</th>
            <th className="py-3 px-4 text-left font-semibold">Goal Name</th>
            <th className="py-3 px-4 text-left font-semibold">Estimated Effort</th>
            <th className="py-3 px-4 text-left font-semibold">Invested Effort</th>
            <th className="py-3 px-4 text-left font-semibold">Remaining Effort</th>
            <th className="py-3 px-4 text-left font-semibold">Start Date</th>
            <th className="py-3 px-4 text-left font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {goals.map(goal => (
            <tr key={goal.id} className="border-b">
              <td className="py-2 px-4">
                {goal.status === 'NOT_STARTED' && (
                  <button
                    onClick={() => handleStatusAction(goal, 'start')}
                    className={`bg-gray-700 text-white px-2 py-1 rounded-full shadow transition flex items-center justify-center ${actionLoadingId === goal.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Start Goal"
                    disabled={actionLoadingId === goal.id}
                  >
                    {actionLoadingId === goal.id ? '...' : <FaPlay />}
                  </button>
                )}
                {goal.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleStatusAction(goal, 'pause')}
                    className={`bg-gray-700 text-white px-2 py-1 rounded-full shadow transition flex items-center justify-center ${actionLoadingId === goal.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Pause Goal"
                    disabled={actionLoadingId === goal.id}
                  >
                    {actionLoadingId === goal.id ? '...' : <FaPause />}
                  </button>
                )}
                {goal.status === 'PAUSED' && (
                  <button
                    onClick={() => handleStatusAction(goal, 'resume')}
                    className={`bg-gray-700 text-white px-2 py-1 rounded-full shadow transition flex items-center justify-center ${actionLoadingId === goal.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Resume Goal"
                    disabled={actionLoadingId === goal.id}
                  >
                    {actionLoadingId === goal.id ? '...' : <FaRedo />}
                  </button>
                )}
              </td>
              <td className="py-2 px-4">
                <button onClick={() => openCalendar(goal)} className="bg-blue-500 text-white px-3 py-1 rounded-lg shadow transition">Calendar</button>
              </td>
              <td className="py-2 px-4 font-semibold">{goal.goalName}</td>
              <td className="py-2 px-4">{goal.progressType === 'hr' ? `${goal.estimatedEffort} hr` : goal.estimatedEffort}</td>
              <td className="py-2 px-4">{goal.progressType === 'hr' ? `${goal.investedEffort ?? 0} hr` : (goal.investedEffort ?? 0)}</td>
              <td className="py-2 px-4">{goal.progressType === 'hr' ? `${goal.remainingEffort ?? (goal.estimatedEffort - (goal.investedEffort ?? 0))} hr` : (goal.remainingEffort ?? (goal.estimatedEffort - (goal.investedEffort ?? 0)))}</td>
              <td className="py-2 px-4">{goal.startDate ?? '-'}</td>
              <td className="py-2 px-4">{goal.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GoalTable;
