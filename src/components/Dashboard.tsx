import React, { useEffect, useState } from 'react';
import axios from 'axios';
import initialData from '../data/initialData.json';
import Header from './Header';
import GoalForm from './GoalForm';
import ErrorAlert from './ErrorAlert';
import SkeletonTable from './SkeletonTable';
import GoalTable from './GoalTable';
import CalendarModal from './CalendarModal';

function Dashboard() {
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await axios.get<Goal[]>('http://localhost:8080/api/goals');
      console.log('Fetched goals:', res.data);
      setGoals(res.data);
    } catch (err) {
      setError('Failed to fetch goals');
    }
    setLoading(false);
  };

  const addGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8080/api/goals', {
        goalName: newGoal.goalName,
        progressType: newGoal.progressType,
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
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <Header seedInitialData={seedInitialData} />
        <GoalForm newGoal={newGoal} setNewGoal={setNewGoal} addGoal={addGoal} />
        <ErrorAlert error={error} />
        <div className="overflow-x-auto">
          {loading ? (
            <SkeletonTable columns={8} />
          ) : (
            <GoalTable goals={goals} deleteGoal={deleteGoal} openCalendar={openCalendar} />
          )}
        </div>
      </div>
      <CalendarModal
        showCalendar={showCalendar}
        calendarGoal={calendarGoal}
        effortValue={effortValue}
        setEffortValue={setEffortValue}
        handleEffortSubmit={handleEffortSubmit}
        closeCalendar={closeCalendar}
      />
    </div>
  );
}

export default Dashboard;
