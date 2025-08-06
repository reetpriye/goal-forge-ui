import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// Custom dark mode styles for react-calendar
const calendarDarkStyles = `
  .react-calendar {
    background: var(--color-bg);
    color: #e5e7eb;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }
  .react-calendar__tile {
    background: var(--color-bg);
    color: #e5e7eb;
  }
.react-calendar__tile--active {
  background: #2563eb !important;
  color: #fff !important;
}
.react-calendar__tile--now {
  background: #1e293b !important;
  color: #60a5fa !important;
}
.react-calendar__month-view__days__day--weekend {
  color: #fbbf24 !important;
}
.react-calendar__navigation {
  background: var(--color-bg);
  color: #e5e7eb;
}
.react-calendar__navigation button {
  color: #e5e7eb;
}
.react-calendar__tile:disabled {
  background: #111827 !important;
  color: #6b7280 !important;
}
.react-calendar__tile--effort {
  background: transparent !important;
  color: inherit !important;
  border-radius: 0;
  font-weight: bold;
  border: 1px solid #4b5563 !important;
}
`;

interface CalendarModalProps {
  showCalendar: boolean;
  setShowCalendar: (show: boolean) => void;
  calendarGoal: any;
  selectedDate: Date | null;
  setSelectedDate: any;
  jwt?: string | null;
  fetchGoals?: (token?: string) => void;
  onEffortSaved?: () => void;
  onOpenEffortModal?: (goal: any, dateStr: string) => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ showCalendar, setShowCalendar, calendarGoal, selectedDate, setSelectedDate, jwt, fetchGoals, onEffortSaved, onOpenEffortModal }) => {
  const [editingDate, setEditingDate] = React.useState<string | null>(null);
  const [inputEffort, setInputEffort] = React.useState<number>(0);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [showStartGoalError, setShowStartGoalError] = React.useState(false);
  
  // For duration goals, separate hours and minutes input
  const [inputHours, setInputHours] = React.useState<number>(0);
  const [inputMinutes, setInputMinutes] = React.useState<number>(0);
  
  // Update inputEffort when hours or minutes change for duration goals
  React.useEffect(() => {
    if (calendarGoal?.progressType === 'dur') {
      setInputEffort(inputHours * 60 + inputMinutes);
    }
  }, [inputHours, inputMinutes, calendarGoal?.progressType]);

  // Helper function to format duration for display
  const formatDuration = (minutes: number) => {
    if (minutes === 0) return '0';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins}m`;
  };
  // Normalize progressCalendar to array of { date, effort }
  const normalizeProgress = (progress: any) => {
    if (Array.isArray(progress)) return progress;
    if (progress && typeof progress === 'object') {
      return Object.entries(progress).map(([date, effort]) => ({ date, effort }));
    }
    return [];
  };
  const sortProgress = (progress: any[]) => {
    return [...progress].sort((a, b) => a.date.localeCompare(b.date));
  };
  const [localProgress, setLocalProgress] = React.useState<any[]>(
    calendarGoal && calendarGoal.progressCalendar
      ? sortProgress(normalizeProgress(calendarGoal.progressCalendar))
      : []
  );

  // Listen for changes to calendarGoal.progressCalendar
  React.useEffect(() => {
    setLocalProgress(
      calendarGoal && calendarGoal.progressCalendar
        ? sortProgress(normalizeProgress(calendarGoal.progressCalendar))
        : []
    );
  }, [calendarGoal?.progressCalendar]);

  // Calculate invested, remaining, and total effort from localProgress for instant UI update
  const totalEffort = calendarGoal?.estimatedEffort ?? 0;
  const investedEffort = localProgress.reduce((sum, entry) => sum + (Number(entry.effort) || 0), 0);
  const remainingEffort = Math.max(totalEffort - investedEffort, 0);

  // Helper to disable past dates
  const tileDisabled = ({ date }: { date: Date }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Save effort for a date
  const handleEffortSave = async (dateStr: string) => {
    setSaveError(null);
    console.log('handleEffortSave called. jwt:', jwt, 'calendarGoal:', calendarGoal);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Parse dateStr as local date
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    dateObj.setHours(0, 0, 0, 0); // Normalize to midnight
    console.log('inputEffort:', inputEffort, 'dateObj:', dateObj, 'today:', today);
    if (!calendarGoal) {
      setSaveError('Goal not found.');
      setEditingDate(null);
      return;
    }
    if (inputEffort < 0) {
      setSaveError('Effort must be 0 or greater.');
      setEditingDate(null);
      return;
    }
    // If signed in, save to backend
    if (jwt) {
      try {
        const API_URL = import.meta.env.VITE_API_URL;
        const response = await fetch(`${API_URL}/api/goals/` + calendarGoal.id + '/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(jwt ? { Authorization: `Bearer ${jwt}` } : {})
          },
          body: JSON.stringify({ date: dateStr, effort: inputEffort })
        });
        if (!response.ok) {
          let errorMsg = 'Failed to save effort.';
          try {
            const errorJson = await response.json();
            // Extract just the message from error response
            errorMsg = errorJson?.message || errorJson?.error || 'Failed to save effort';
          } catch {
            errorMsg = await response.text();
          }
          setSaveError(errorMsg);
          return;
        }
        // Update localProgress immediately for instant UI feedback
        setLocalProgress(prev => {
          const filtered = prev.filter((e: any) => e.date !== dateStr);
          return sortProgress([...filtered, { date: dateStr, effort: inputEffort }]);
        });
        // Fetch latest goals and update UI only after successful save
        if (fetchGoals) {
          await fetchGoals(jwt);
        }
        if (typeof onEffortSaved === 'function') onEffortSaved();
        setEditingDate(null);
      } catch (err: any) {
        setSaveError(err?.message || 'Network error.');
      }
    } else {
      try {
        // Find local goals
        const localGoalsRaw = localStorage.getItem('goals');
        let localGoals = [];
        if (localGoalsRaw) {
          localGoals = JSON.parse(localGoalsRaw);
        }
        // Find this goal
        const idx = localGoals.findIndex((g: any) => g.id === calendarGoal.id);
        if (idx === -1) {
          setSaveError('Goal not found in localStorage.');
          setEditingDate(null);
          return;
        }
        // Normalize progressCalendar to array
        let progressArr = normalizeProgress(localGoals[idx].progressCalendar);
        // Update progressCalendar
        const filtered = progressArr.filter((e: any) => e.date !== dateStr);
        // Calculate new total effort
        const newTotalEffort = filtered.reduce((sum: number, entry: any) => sum + (Number(entry.effort) || 0), 0) + inputEffort;
        if (newTotalEffort > (calendarGoal.estimatedEffort ?? 0)) {
          setSaveError('Effort exceeds the remaining allowed effort for this goal.');
          return;
        }
        const newProgress = [...filtered, { date: dateStr, effort: inputEffort }];
        localGoals[idx].progressCalendar = newProgress;
        localStorage.setItem('goals', JSON.stringify(localGoals));
        // Fetch latest goals and update UI only after successful save
        if (fetchGoals) {
          await fetchGoals();
        }
        // Immediately update localProgress for localStorage after save
        setLocalProgress(sortProgress(normalizeProgress(newProgress)));
        if (typeof onEffortSaved === 'function') onEffortSaved();
        setEditingDate(null);
      } catch (err: any) {
        setSaveError(err?.message || 'LocalStorage error.');
      }
    }
  };

  // When a date is clicked, open effort modal instead of inline editing
  const handleDateClick = (value: any) => {
    let dateObj: Date | null = null;
    if (Array.isArray(value)) {
      dateObj = value[0] as Date;
    } else if (value instanceof Date) {
      dateObj = value;
    }
    if (!dateObj) return;
    // Normalize both to midnight
    dateObj.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj < today) return; // Only allow today/future
    
    // Check if goal has been started before allowing effort entry
    if (calendarGoal?.status === 'NOT_STARTED') {
      setShowStartGoalError(true);
      return;
    }
    
    // Format date as local YYYY-MM-DD
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
    
    // Open effort modal instead of inline editing
    if (onOpenEffortModal && calendarGoal) {
      onOpenEffortModal(calendarGoal, dateStr);
    }
    
    setSelectedDate(dateObj);
  };

  // Helper to show effort on calendar, and input if editing (no button in tile)
  const tileContent = ({ date }: { date: Date }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const isFutureOrToday = date >= today;
    const entry = localProgress.find((e: any) => e.date === dateStr);
    if (editingDate === dateStr && isFutureOrToday) {
      // Show a simple indicator that this date is being edited
      return (
        <div className="flex items-center justify-center min-h-[36px]">
          <span className="bg-blue-500 text-white py-1 text-[0.9em] min-w-[44px] inline-block border border-blue-400 rounded-none animate-pulse">Edit</span>
        </div>
      );
    }
    // Always show a value, 0 if no entry
    const effortValue = entry ? entry.effort : 0;
    const displayValue = calendarGoal?.progressType === 'dur' ? formatDuration(effortValue) : effortValue.toString();
    return (
      <div className="flex items-center justify-center min-h-[36px]">
        <span className="bg-gray-100 text-gray-900 py-1 text-[0.9em] min-w-[44px] inline-block border border-gray-400 rounded-none">{displayValue}</span>
      </div>
    );
  };

  return showCalendar && calendarGoal ? (
    <>
      <style>{calendarDarkStyles}</style>
      <div
        className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
        onClick={e => {
          if (e.target === e.currentTarget) {
            setShowCalendar(false);
            setSelectedDate(null);
            setEditingDate(null);
          }
        }}
      >
        <div
          className="p-4 sm:p-8 w-full max-w-[95vw] sm:min-w-[400px] sm:max-w-[500px] relative" style={{boxSizing: 'border-box', background: 'rgb(12,12,12)', boxShadow: 'none', borderRadius: 0}}
        >
          <button
            onClick={() => {
              setShowCalendar(false);
              setSelectedDate(null);
              setEditingDate(null);
            }}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: '40px',
              height: '40px',
              background: 'rgb(12,12,12)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              fontSize: '2rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              transition: 'background 0.2s'
            }}
            aria-label="Close calendar"
            onMouseOver={e => (e.currentTarget.style.background = '#2563eb')}
            onMouseOut={e => (e.currentTarget.style.background = 'var(--color-bg)')}
          >×</button>
          <h2 className="text-base sm:text-lg font-bold mb-4 text-center break-words">
            Effort Calendar for {calendarGoal.goalName}
          </h2>
          <div className="overflow-x-auto flex justify-center">
            <Calendar
              value={selectedDate || new Date()}
              onChange={handleDateClick}
              tileDisabled={tileDisabled}
              tileContent={tileContent}
              tileClassName={({ date }) => {
                // Format date as local YYYY-MM-DD
                const pad = (n: number) => n.toString().padStart(2, '0');
                const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
                const entry = localProgress.find((e: any) => e.date === dateStr);
                return entry ? 'react-calendar__tile--effort' : undefined;
              }}
            />
          </div>
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="mb-2 flex flex-row justify-center gap-1 sm:gap-8 items-center text-xs sm:text-sm">
              <span className="font-bold text-green-600 text-center">Invested: {calendarGoal?.progressType === 'dur' ? formatDuration(investedEffort) : investedEffort}</span>
              <span className="font-bold text-gray-500 text-center">Remaining: {calendarGoal?.progressType === 'dur' ? formatDuration(remainingEffort) : remainingEffort}</span>
              <span className="font-bold text-blue-600 text-center">Total: {calendarGoal?.progressType === 'dur' ? formatDuration(totalEffort) : totalEffort}</span>
            </div>
            <div className="w-full h-2 sm:h-2 bg-gray-200 flex overflow-hidden" style={{ borderRadius: 0 }}>
              <div
                className="h-full bg-green-500"
                style={{ width: `${totalEffort ? (investedEffort / totalEffort) * 100 : 0}%` }}
              ></div>
              <div
                className="h-full bg-gray-400"
                style={{ width: `${totalEffort ? (remainingEffort / totalEffort) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Input Area */}
          {editingDate && (
            <div className="mt-6 p-4 bg-gray-800 rounded-lg border" style={{ borderColor: 'var(--color-accent)' }}>
              <div className="text-center mb-3">
                <span className="text-sm font-semibold">
                  Logging effort for {new Date(editingDate + 'T00:00:00').toLocaleDateString()}
                </span>
              </div>
              
              {calendarGoal?.progressType === 'dur' ? (
                // Duration input (hours and minutes)
                <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-4 items-center">
                    <div className="flex flex-col items-center">
                      <label className="text-xs text-gray-400 mb-1">Hours</label>
                      <input
                        type="number"
                        autoFocus
                        value={inputHours}
                        onChange={e => setInputHours(Math.max(0, Number(e.target.value)))}
                        min="0"
                        className="w-16 text-center text-white bg-gray-700 border rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                        style={{ borderColor: 'var(--color-accent)' }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && (inputHours > 0 || inputMinutes > 0)) {
                            handleEffortSave(editingDate);
                          }
                          if (e.key === 'Escape') {
                            setEditingDate(null);
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <label className="text-xs text-gray-400 mb-1">Minutes</label>
                      <input
                        type="number"
                        value={inputMinutes}
                        onChange={e => setInputMinutes(Math.max(0, Math.min(59, Number(e.target.value))))}
                        min="0"
                        max="59"
                        className="w-16 text-center text-white bg-gray-700 border rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                        style={{ borderColor: 'var(--color-accent)' }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && (inputHours > 0 || inputMinutes > 0)) {
                            handleEffortSave(editingDate);
                          }
                          if (e.key === 'Escape') {
                            setEditingDate(null);
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 text-center">
                    Total: {formatDuration(inputEffort)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEffortSave(editingDate)}
                      disabled={inputHours === 0 && inputMinutes === 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingDate(null)}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Count input
                <div className="flex flex-col items-center gap-3">
                  <div className="flex flex-col items-center">
                    <label className="text-xs text-gray-400 mb-1">Count</label>
                    <input
                      type="number"
                      autoFocus
                      value={inputEffort}
                      onChange={e => setInputEffort(Math.max(0, Number(e.target.value)))}
                      min="0"
                      className="w-20 text-center text-white bg-gray-700 border rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                      style={{ borderColor: 'var(--color-accent)' }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && inputEffort > 0) {
                          handleEffortSave(editingDate);
                        }
                        if (e.key === 'Escape') {
                          setEditingDate(null);
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEffortSave(editingDate)}
                      disabled={inputEffort === 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingDate(null)}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {saveError && (
            <div className="text-red-500 text-center mt-2">{saveError}</div>
          )}
        </div>
      </div>
      
      {/* Start Goal Error Modal */}
      {showStartGoalError && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4 transform transition-all duration-200">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Goal Not Started</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Please start the goal before adding effort. You can start it by going back to the goal table and clicking the menu button, then selecting "Start".
                </p>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowStartGoalError(false)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  ) : null;
};

export default CalendarModal;
