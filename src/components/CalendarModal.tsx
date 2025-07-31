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
}

const CalendarModal: React.FC<CalendarModalProps> = ({ showCalendar, setShowCalendar, calendarGoal, selectedDate, setSelectedDate, jwt, fetchGoals, onEffortSaved }) => {
  const [editingDate, setEditingDate] = React.useState<string | null>(null);
  const [inputEffort, setInputEffort] = React.useState<number>(0);
  const [saveError, setSaveError] = React.useState<string | null>(null);
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
            if (errorJson && errorJson.message) errorMsg = errorJson.message;
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

  // When a date is clicked, open input for that date
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
    // Format date as local YYYY-MM-DD
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
    setEditingDate(dateStr);
    // Pre-fill input with current effort value if exists, otherwise default to 0
    const entry = localProgress.find((e: any) => e.date === dateStr);
    setInputEffort(entry ? entry.effort : 0);
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
      return (
        <div className="flex items-center justify-center min-h-[48px]">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoFocus
            value={inputEffort}
            onChange={e => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              setInputEffort(val ? Number(val) : 0);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && inputEffort >= 0) {
                handleEffortSave(dateStr);
              }
              if (e.key === 'Escape') {
                setEditingDate(null);
              }
            }}
            className="w-10 text-center text-green-500 bg-gray-900 border rounded-none appearance-none focus:outline-none"
            style={{ fontSize: '0.9em', borderWidth: '1px', borderColor: 'var(--color-accent)' }}
          />
        </div>
      );
    }
    // Always show a value, 0 if no entry
    const effortValue = entry ? entry.effort : 0;
    return (
      <div className="flex items-center justify-center min-h-[48px]">
        <span className="bg-gray-100 text-gray-900 px-2 py-1 font-bold text-[0.9em] min-w-[24px] inline-block border border-gray-400 rounded-none">{effortValue}</span>
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
          className="p-4 sm:p-8 w-full max-w-[95vw] sm:min-w-[400px] sm:max-w-[500px] relative" style={{boxSizing: 'border-box', background: 'rgb(13,13,13)', boxShadow: 'none', borderRadius: 0}}
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
            <div className="mb-2 flex flex-col sm:flex-row justify-center gap-2 sm:gap-8 items-center text-xs sm:text-sm">
              <span className="font-bold text-green-600">Invested: {investedEffort}</span>
              <span className="font-bold text-gray-500">Remaining: {remainingEffort}</span>
              <span className="font-bold text-blue-600">Total: {totalEffort}</span>
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
          {saveError && (
            <div className="text-red-500 text-center mt-2">{saveError}</div>
          )}
        </div>
      </div>
    </>
  ) : null;
};

export default CalendarModal;
