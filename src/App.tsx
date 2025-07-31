import React, { useEffect, useState } from 'react';
import axios from 'axios';
import initialData from './data/initialData.json';

function App() {
  type EffortEntry = {
    date: string;
    effort: number;
  };
  type Goal = {
    id: string;
    goalName: string;
    progressType: string;
    estimatedEffort: number;
    progressCalendar?: EffortEntry[];
    investedEffort?: number;
    remainingEffort?: number;
    startDate?: string | null;
    status?: string;
  };
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState<Goal>({ id: '', goalName: '', progressType: '', estimatedEffort: 0, progressCalendar: [] });
  const [error, setError] = useState('');
  const [calendarGoal, setCalendarGoal] = useState<Goal | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [effortValue, setEffortValue] = useState<number>(0);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await axios.get<Goal[]>('http://localhost:8080/api/goals');
      console.log('Fetched goals:', res.data);
      setGoals(res.data);
    } catch (err) {
      setError('Failed to fetch goals');
    }
  };

  const addGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8080/api/goals', {
        goalName: newGoal.goalName,
        estimatedEffort: newGoal.estimatedEffort
      });
      setNewGoal({ id: '', goalName: '', progressType: '', estimatedEffort: 0, progressCalendar: [] });
      fetchGoals();
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error adding goal');
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await axios.delete(`http://localhost:8080/api/goals/${id}`);
      fetchGoals();
    } catch (err) {
      setError('Error deleting goal');
    }
  };

  // Calendar modal logic
  const openCalendar = (goal: Goal) => {
    setCalendarGoal(goal);
    setShowCalendar(true);
    setSelectedDate('');
    setEffortValue(0);
  };

  const closeCalendar = () => {
    setShowCalendar(false);
    setCalendarGoal(null);
    setSelectedDate('');
    setEffortValue(0);
  };

  const handleEffortSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!calendarGoal || effortValue <= 0) return;
    const today = new Date().toLocaleDateString('en-CA');
    console.log(today);
    let success = false;
    try {
      await axios.post(`http://localhost:8080/api/goals/${calendarGoal.id}/progress`, {
        date: today,
        effort: effortValue,
      });
      fetchGoals();
      setError('');
      success = true;
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error adding effort');
    }
    if (success) closeCalendar();
  };

  // Seed initial data
  const seedInitialData = async () => {
    try {
      await axios.post('http://localhost:8080/api/goals/import', initialData);
      fetchGoals();
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error seeding initial data');
    }
  };

  return (
    <>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Goal Forge</h1>
          <button onClick={seedInitialData} className="bg-green-600 text-white px-4 py-2 rounded">Seed Initial Data</button>
        </div>
        <form onSubmit={addGoal} className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Goal Name"
            value={newGoal.goalName}
            onChange={e => setNewGoal({ ...newGoal, goalName: e.target.value })}
            required
            className="border rounded px-3 py-2 flex-1"
          />
          <input
            type="number"
            placeholder="Estimated Effort"
            value={newGoal.estimatedEffort}
            onChange={e => setNewGoal({ ...newGoal, estimatedEffort: Number(e.target.value) })}
            required
            className="border rounded px-3 py-2 w-40"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Add Goal</button>
        </form>
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">Goal Name</th>
                <th className="py-2 px-4 text-left">Progress Type</th>
                <th className="py-2 px-4 text-left">Estimated Effort</th>
                <th className="py-2 px-4 text-left">Invested Effort</th>
                <th className="py-2 px-4 text-left">Remaining Effort</th>
                <th className="py-2 px-4 text-left">Start Date</th>
                <th className="py-2 px-4 text-left">Status</th>
                <th className="py-2 px-4 text-left">Effort History</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {goals.map(goal => (
                <tr key={goal.id} className="border-b">
                  <td className="py-2 px-4 font-semibold">{goal.goalName}</td>
                  <td className="py-2 px-4">{goal.progressType}</td>
                  <td className="py-2 px-4">{goal.estimatedEffort}</td>
                  <td className="py-2 px-4">{goal.investedEffort ?? 0}</td>
                  <td className="py-2 px-4">{goal.remainingEffort ?? (goal.estimatedEffort - (goal.investedEffort ?? 0))}</td>
                  <td className="py-2 px-4">{goal.startDate ?? '-'}</td>
                  <td className="py-2 px-4">{goal.status}</td>
                  <td className="py-2 px-4">
                    {goal.progressCalendar && Array.isArray(goal.progressCalendar) && goal.progressCalendar.length > 0 ? (
                      <ul className="list-disc ml-4">
                        {goal.progressCalendar.map((entry, idx) => (
                          <li key={idx}>{entry.date}: {entry.effort}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400">No effort yet</span>
                    )}
                  </td>
                  <td className="py-2 px-4">
                    <button onClick={() => deleteGoal(goal.id)} className="bg-red-500 text-white px-3 py-1 rounded mr-2">Delete</button>
                    <button onClick={() => openCalendar(goal)} className="bg-blue-500 text-white px-3 py-1 rounded">Calendar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calendar Modal */}
        {showCalendar && calendarGoal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 min-w-[400px] shadow-lg">
              <h2 className="text-xl font-bold mb-4">Effort Calendar for {calendarGoal.goalName}</h2>
              <table className="min-w-full bg-gray-50 rounded mb-4">
                <thead>
                  <tr>
                    <th className="py-2 px-4 text-left">Date</th>
                    <th className="py-2 px-4 text-left">Effort</th>
                  </tr>
                </thead>
                <tbody>
                  {calendarGoal.progressCalendar && Array.isArray(calendarGoal.progressCalendar) && calendarGoal.progressCalendar.length > 0 ? (
                    calendarGoal.progressCalendar.map((entry, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-4">{entry.date}</td>
                        <td className="py-2 px-4">{entry.effort}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-2 px-4 text-gray-400" colSpan={2}>No effort history</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <form onSubmit={handleEffortSubmit} className="flex gap-4 mb-4">
                <div>
                  <label className="block mb-1 text-gray-700">Today's Effort:</label>
                  <input
                    type="number"
                    min={1}
                    value={effortValue}
                    onChange={e => setEffortValue(Number(e.target.value))}
                    required
                    className="border rounded px-2 py-1 w-full"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">Add Effort</button>
                  <button type="button" className="bg-gray-400 text-white px-3 py-1 rounded" onClick={closeCalendar}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App
