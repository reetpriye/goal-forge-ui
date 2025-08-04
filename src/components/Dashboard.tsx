import React, { useEffect, useState } from 'react';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;
import Header from './Header';
import GoalForm from './GoalForm';
import GoalTable from './GoalTable';
import ErrorAlert from './ErrorAlert';
import CalendarModal from './CalendarModal';
import ImportChoiceModal from './ImportChoiceModal';
import EditGoalModal from './EditGoalModal';
import EffortModal from './EffortModal';

function Dashboard({ serverReady }: { serverReady?: boolean }) {
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
        await axios.post(`${API_URL}/api/goals/import`, { goals: parsedGoals, mode: 'append' }, {
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
        await axios.post(`${API_URL}/api/goals/import`, { goals: parsedGoals, mode: 'reset' }, {
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
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEffortModal, setShowEffortModal] = useState(false);
  const [effortDate, setEffortDate] = useState<string>('');
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
      const res = await axios.get<Goal[]>(`${API_URL}/api/goals`, {
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
      await axios.post(`${API_URL}/api/goals`, {
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

  // Calendar modal logic
  const openCalendar = (goal: Goal) => {
    setCalendarGoal(goal);
    setShowCalendar(true);
    setSelectedDate(new Date());
  };

  // Handle goal reordering from drag and drop
  const handleReorderGoals = async (reorderedGoals: Goal[]) => {
    setGoals(reorderedGoals);
    
    // Save to localStorage if not using server
    if (!jwt) {
      localStorage.setItem('goals', JSON.stringify(reorderedGoals));
      return;
    }
    
    // Save order to server
    try {
      const goalIds = reorderedGoals.map(goal => goal.id);
      await axios.put(`${API_URL}/api/goals/reorder`, {
        goalIds: goalIds
      }, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      
      // Refresh goals to get updated order from server
      await fetchGoals(jwt);
    } catch (err) {
      console.error('Failed to update goal order on server:', err);
      setError('Failed to save goal order. Please try again.');
      // Revert the local state change
      fetchGoals(jwt);
    }
  };

  const handleEditGoal = (goal: any) => {
    setEditGoal(goal);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditGoal(null);
  };

  const handleGoalUpdated = () => {
    if (jwt) {
      fetchGoals(jwt);
    }
  };

  const handleOpenEffortModal = (goal: Goal, dateStr: string) => {
    setCalendarGoal(goal);
    setEffortDate(dateStr);
    setShowEffortModal(true);
  };

  const handleCloseEffortModal = () => {
    setShowEffortModal(false);
    setEffortDate('');
    setCalendarGoal(null);
  };

  const handleEffortSaved = () => {
    if (jwt) {
      fetchGoals(jwt);
    } else {
      // For anonymous users, reload from localStorage
      const localGoals = localStorage.getItem('goals');
      if (localGoals) {
        setGoals(JSON.parse(localGoals));
      }
    }
  };

  // Handle skip import choice
  const handleSkipImportChoice = () => {
    if (pendingJwt && pendingUser) {
      setJwt(pendingJwt);
      setUser(pendingUser);
      localStorage.setItem('jwt', pendingJwt);
      localStorage.setItem('user', JSON.stringify(pendingUser));
      setShowImportChoice(false);
      setPendingJwt(null);
      setPendingUser(null);
      fetchGoals(pendingJwt);
    } else {
      setShowImportChoice(false);
      setPendingJwt(null);
      setPendingUser(null);
    }
  };
  return (
    <>
      <div className="container mx-auto p-4 text-sm min-h-screen bg-gray-50 dark:bg-gray-900">
        <ImportChoiceModal
          show={showImportChoice}
          onAppend={handleAppendLocalGoals}
          onReset={handleResetWithLocalGoals}
          onCancel={handleCancelImportChoice}
          onSkip={handleSkipImportChoice}
        />
        <div className="mb-0" style={{background: 'rgb(13,13,13)', boxShadow: 'none', borderRadius: 0}}>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 sm:gap-0">
            <Header user={user} onLogin={handleGoogleLogin} onLogout={() => {
              setJwt(null);
              setUser(null);
              localStorage.removeItem('jwt');
              localStorage.removeItem('user');
            }} />
            {/* Sign-in and user info now handled by Header. Remove duplicate UI here. */}
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
              <GoalTable 
                goals={goals} 
                fetchGoals={fetchGoals} 
                jwt={jwt} 
                openCalendar={openCalendar} 
                onReorderGoals={handleReorderGoals}
                onEditGoal={handleEditGoal}
              />
            )}
          </div>
        </div>
        <CalendarModal
          showCalendar={showCalendar}
          setShowCalendar={setShowCalendar}
          calendarGoal={calendarGoal}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          jwt={jwt}
          fetchGoals={fetchGoals}
          onOpenEffortModal={handleOpenEffortModal}
        />
        <EditGoalModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          goal={editGoal}
          jwt={jwt}
          onGoalUpdated={handleGoalUpdated}
        />
        <EffortModal
          isOpen={showEffortModal}
          onClose={handleCloseEffortModal}
          goal={calendarGoal}
          selectedDate={effortDate}
          jwt={jwt}
          onEffortSaved={handleEffortSaved}
        />
      </div>
      {/* Server status indicator in bottom left */}
      <div style={{
        position: 'fixed',
        left: 16,
        bottom: 16,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(20,20,20,0.95)',
        borderRadius: 8,
        padding: '6px 14px 6px 10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        fontSize: 13,
        color: '#e5e7eb',
        minWidth: 60
      }}>
        <span className="text-xs text-gray-400 mr-2">server</span>
        <span style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: serverReady ? '#22c55e' : '#ef4444',
          boxShadow: serverReady ? '0 0 4px #22c55e' : '0 0 4px #ef4444',
          transition: 'background 0.3s, box-shadow 0.3s'
        }} />
      </div>
    </>
  );
}

export default Dashboard;
