import React, { useEffect, useState } from 'react';
import axios from 'axios';
import initialData from '../data/initialData.json';
import Header from './Header';
import GoalForm from './GoalForm';
import GoalTable from './GoalTable';
import ErrorAlert from './ErrorAlert';
import CalendarModal from './CalendarModal';
import GoogleSignInButton from './GoogleSignInButton';
import ImportChoiceModal from './ImportChoiceModal';

function Dashboard() {
  const [showImportChoice, setShowImportChoice] = useState(false);
  const [pendingJwt, setPendingJwt] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [jwt, setJwt] = useState<string | null>(localStorage.getItem('jwt'));
  const [user, setUser] = useState<any>(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null);

  const handleGoogleLogin = (token: string, userObj: any) => {
    // If there are local goals, show import choice modal
    const localGoals = localStorage.getItem('goals');
    if (localGoals && JSON.parse(localGoals).length > 0) {
      setPendingJwt(token);
      setPendingUser(userObj);
      setShowImportChoice(true);
      return;
    }
    setJwt(token);
    setUser(userObj);
    localStorage.setItem('jwt', token);
    localStorage.setItem('user', JSON.stringify(userObj));
    fetchGoals(token);
  };
  // Handle append local goals to server
  const handleAppendLocalGoals = async () => {
    if (!pendingJwt) return;
    try {
      const localGoals = localStorage.getItem('goals');
      if (localGoals) {
        // Transform progressCalendar from array to object for each goal
        const parsedGoals = JSON.parse(localGoals).map((goal: any) => {
          if (Array.isArray(goal.progressCalendar)) {
            const calendarObj: Record<string, number> = {};
            goal.progressCalendar.forEach((entry: any) => {
              if (entry.date && entry.effort != null) {
                calendarObj[entry.date] = entry.effort;
              }
            });
            goal.progressCalendar = calendarObj;
          }
          return goal;
        });
        await axios.post('http://localhost:8080/api/goals/import', { goals: parsedGoals, mode: 'append' }, {
          headers: { Authorization: `Bearer ${pendingJwt}` }
        });
      }
      localStorage.removeItem('goals');
      setJwt(pendingJwt);
      setUser(pendingUser);
      localStorage.setItem('jwt', pendingJwt);
      localStorage.setItem('user', JSON.stringify(pendingUser));
      setShowImportChoice(false);
      setPendingJwt(null);
      setPendingUser(null);
      fetchGoals(pendingJwt);
    } catch (err) {
      setError('Failed to import local goals');
      setShowImportChoice(false);
      setPendingJwt(null);
      setPendingUser(null);
    }
  };

  // Handle reset server goals with local goals
  const handleResetWithLocalGoals = async () => {
    if (!pendingJwt) return;
    try {
      // Import local goals with reset=true
      const localGoals = localStorage.getItem('goals');
      if (localGoals) {
        // Transform progressCalendar from array to object for each goal
        const parsedGoals = JSON.parse(localGoals).map((goal: any) => {
          if (Array.isArray(goal.progressCalendar)) {
            const calendarObj: Record<string, number> = {};
            goal.progressCalendar.forEach((entry: any) => {
              if (entry.date && entry.effort != null) {
                calendarObj[entry.date] = entry.effort;
              }
            });
            goal.progressCalendar = calendarObj;
          }
          return goal;
        });
        await axios.post('http://localhost:8080/api/goals/import', { goals: parsedGoals, mode: 'reset' }, {
          headers: { Authorization: `Bearer ${pendingJwt}` }
        });
      }
      localStorage.removeItem('goals');
      setJwt(pendingJwt);
      setUser(pendingUser);
      localStorage.setItem('jwt', pendingJwt);
      localStorage.setItem('user', JSON.stringify(pendingUser));
      setShowImportChoice(false);
      setPendingJwt(null);
      setPendingUser(null);
      fetchGoals(pendingJwt);
    } catch (err) {
      setError('Failed to reset and import local goals');
      setShowImportChoice(false);
      setPendingJwt(null);
      setPendingUser(null);
    }
  };

  // Cancel import choice
  const handleCancelImportChoice = () => {
    setShowImportChoice(false);
    setPendingJwt(null);
    setPendingUser(null);
  };

  const handleSignOut = () => {
    setJwt(null);
    setUser(null);
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    setGoals([]);
    setError("");
    fetchGoals(undefined);
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [effortValue, setEffortValue] = useState<number>(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (jwt) {
      fetchGoals(jwt);
    } else {
      // Load goals from localStorage for anonymous users
      const localGoals = localStorage.getItem('goals');
      if (localGoals) {
        setGoals(JSON.parse(localGoals));
      } else {
        setGoals([]);
      }
      setLoading(false);
      setError("");
    }
  }, [jwt]);

  const fetchGoals = async (token?: string) => {
    setLoading(true);
    if (!token) {
      // Anonymous user: load from localStorage
      const localGoals = localStorage.getItem('goals');
      if (localGoals) {
        setGoals(JSON.parse(localGoals));
      } else {
        setGoals([]);
      }
      setLoading(false);
      setError("");
      return;
    }
    try {
      const res = await axios.get<Goal[]>("http://localhost:8080/api/goals", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGoals(res.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch goals");
    }
    setLoading(false);
  };

  const addGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!jwt) {
      // Anonymous user: save to localStorage
      const localGoals = localStorage.getItem('goals');
      const goalsArr = localGoals ? JSON.parse(localGoals) : [];
      const newGoalObj = {
        ...newGoal,
        id: Date.now().toString(),
        progressCalendar: []
      };
      goalsArr.push(newGoalObj);
      localStorage.setItem('goals', JSON.stringify(goalsArr));
      setNewGoal({ id: '', goalName: '', progressType: '', estimatedEffort: 0, progressCalendar: [] });
      setGoals(goalsArr);
      setError("");
      return;
    }
    try {
      await axios.post("http://localhost:8080/api/goals", {
        goalName: newGoal.goalName,
        progressType: newGoal.progressType,
        estimatedEffort: newGoal.estimatedEffort
      }, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      setNewGoal({ id: '', goalName: '', progressType: '', estimatedEffort: 0, progressCalendar: [] });
      fetchGoals(jwt);
      setError("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error adding goal");
    }
  };

  const deleteGoal = async (id: string) => {
    if (!jwt) {
      // Anonymous user: delete from localStorage
      const localGoals = localStorage.getItem('goals');
      const goalsArr = localGoals ? JSON.parse(localGoals) : [];
      const updatedGoals = goalsArr.filter((g: any) => g.id !== id);
      localStorage.setItem('goals', JSON.stringify(updatedGoals));
      setGoals(updatedGoals);
      setError("");
      return;
    }
    try {
      await axios.delete(`http://localhost:8080/api/goals/${id}`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      fetchGoals(jwt);
    } catch (err) {
      setError("Error deleting goal");
    }
  };

  // Calendar modal logic
  const openCalendar = (goal: Goal) => {
    setCalendarGoal(goal);
    setShowCalendar(true);
    setSelectedDate(new Date());
    setEffortValue(0);
  };

  const closeCalendar = () => {
    setShowCalendar(false);
    setCalendarGoal(null);
    setSelectedDate(new Date());
    setEffortValue(0);
  };

  const handleEffortSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!calendarGoal || effortValue <= 0 || !selectedDate) return;
    const dateStr = selectedDate.toISOString().split('T')[0];
    let success = false;
    try {
      await axios.post(`http://localhost:8080/api/goals/${calendarGoal.id}/progress`, {
        date: dateStr,
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
    if (!jwt) {
      // Anonymous user: seed to localStorage, add unique id to each goal
      const rawGoals = initialData.goals || initialData;
      const goalsWithId = rawGoals.map((goal: any, idx: number) => ({
        ...goal,
        id: Date.now().toString() + '-' + idx
      }));
      localStorage.setItem('goals', JSON.stringify(goalsWithId));
      setGoals(goalsWithId);
      setError("");
      return;
    }
    try {
      await axios.post('http://localhost:8080/api/goals/import', initialData, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      fetchGoals(jwt);
      setError("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error seeding initial data");
    }
  };

  return (
    <div className="container mx-auto p-6 text-sm">
      <ImportChoiceModal
        show={showImportChoice}
        onAppend={handleAppendLocalGoals}
        onReset={handleResetWithLocalGoals}
        onCancel={handleCancelImportChoice}
      />
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
        selectedDate={selectedDate}
        setSelectedDate={(dateOrArray) => {
          if (Array.isArray(dateOrArray)) {
            setSelectedDate(dateOrArray[0] || new Date());
          } else if (dateOrArray instanceof Date) {
            setSelectedDate(dateOrArray);
          }
        }}
        handleEffortSubmit={handleEffortSubmit}
        closeCalendar={closeCalendar}
      />
    </div>
  );
}

export default Dashboard;
