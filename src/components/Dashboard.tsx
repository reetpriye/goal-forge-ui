import React, { useEffect, useState } from 'react';
import axios from 'axios';
import initialData from '../data/initialData.json';
import Header from './Header';
import GoalForm from './GoalForm';
import GoalTable from './GoalTable';
import ErrorAlert from './ErrorAlert';
import CalendarModal from './CalendarModal';
import GoogleSignInButton from './GoogleSignInButton';

function Dashboard() {
  const [jwt, setJwt] = useState<string | null>(localStorage.getItem('jwt'));
  const [user, setUser] = useState<any>(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null);

  const handleGoogleLogin = (token: string, userObj: any) => {
    setJwt(token);
    setUser(userObj);
    localStorage.setItem('jwt', token);
    localStorage.setItem('user', JSON.stringify(userObj));
    fetchGoals(token);
  };

  const handleSignOut = () => {
    setJwt(null);
    setUser(null);
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    fetchGoals();
  };
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
    fetchGoals(jwt);
  }, [jwt]);

  const fetchGoals = async (token?: string) => {
    setLoading(true);
    try {
      const res = await axios.get<Goal[]>("http://localhost:8080/api/goals", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      setGoals(res.data);
    } catch (err) {
      setError("Failed to fetch goals");
    }
    setLoading(false);
  };

  const addGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8080/api/goals", {
        goalName: newGoal.goalName,
        progressType: newGoal.progressType,
        estimatedEffort: newGoal.estimatedEffort
      }, {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined
      });
      setNewGoal({ id: '', goalName: '', progressType: '', estimatedEffort: 0, progressCalendar: [] });
      fetchGoals(jwt || undefined);
      setError("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error adding goal");
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await axios.delete(`http://localhost:8080/api/goals/${id}`, {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined
      });
      fetchGoals(jwt || undefined);
    } catch (err) {
      setError("Error deleting goal");
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
    let success = false;
    try {
      await axios.post(`http://localhost:8080/api/goals/${calendarGoal.id}/progress`, {
        date: today,
        effort: effortValue,
      }, {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined
      });
      fetchGoals(jwt || undefined);
      setError("");
      success = true;
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error adding effort");
    }
    if (success) closeCalendar();
  };

  // Seed initial data
  const seedInitialData = async () => {
    try {
      await axios.post('http://localhost:8080/api/goals/import', initialData, {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined
      });
      fetchGoals(jwt || undefined);
      setError("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error seeding initial data");
    }
  };

  return (
    <div className="container mx-auto p-6 text-sm">
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div className="flex justify-between items-center mb-4">
          <Header seedInitialData={seedInitialData} />
          {user ? (
            <div className="flex items-center gap-3">
              <span className="font-semibold">{user.name}</span>
              <button onClick={handleSignOut} className="bg-gray-700 text-white px-3 py-1 rounded">Sign Out</button>
            </div>
          ) : (
            <GoogleSignInButton onLogin={handleGoogleLogin} />
          )}
        </div>
        <GoalForm newGoal={newGoal} setNewGoal={setNewGoal} addGoal={addGoal} />
        <ErrorAlert error={error} />
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center w-full h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid"></div>
              <span className="ml-4 text-blue-600 font-semibold text-lg">Loading...</span>
            </div>
          ) : (
            <GoalTable goals={goals} fetchGoals={fetchGoals} jwt={jwt} openCalendar={openCalendar} />
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
