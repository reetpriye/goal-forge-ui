import axios from 'axios';
import React, { useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { FaEllipsisV } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL;

interface GoalTableProps {
  goals: any[];
  fetchGoals: (token?: string) => void;
  jwt: string | null;
  openCalendar: (goal: any) => void;
}

const GoalTable: React.FC<GoalTableProps> = ({ goals, fetchGoals, jwt, openCalendar }) => {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{top: number, left: number} | null>(null);
  const menuBtnRefs = useRef<{[key: string]: HTMLButtonElement | null}>({});


  React.useEffect(() => {
    const closeMenu = (e: MouseEvent) => {
      if (!(e.target as HTMLElement)?.closest('.menu-icon-btn') && !(e.target as HTMLElement)?.closest('.menu-dropdown')) {
        setMenuOpenId(null);
      }
    };
    if (menuOpenId) {
      document.addEventListener('mousedown', closeMenu);
      return () => document.removeEventListener('mousedown', closeMenu);
    }
  }, [menuOpenId]);

  const formatStartDate = (dateStr: string | null | undefined, status: string) => {
    if (!dateStr || status === 'NOT_STARTED') return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    const day = date.getDate();
    const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear() % 100;
    function getOrdinal(n: number) {
        if (n > 3 && n < 21) return 'th';
        switch (n % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
        }
    }
    return `${day}${getOrdinal(day)} ${month} ${year.toString().padStart(2, '0')}`;
  }

  const handleComplete = async (goal: any) => {
    if (!jwt) return;
    const confirmed = window.confirm(`Are you sure you want to mark "${goal.goalName}" as completed?`);
    if (!confirmed) return;
    setActionLoadingId(goal.id);
    try {
      await axios.post(`${API_URL}/api/goals/${goal.id}/complete`, {}, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      await fetchGoals(jwt);
    } catch (err) {
      alert('Failed to mark goal as completed');
    }
    setActionLoadingId(null);
  };
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);
  const handleStatusAction = async (goal: any, action: 'start' | 'pause' | 'resume') => {
    if (!jwt) return;
    setActionLoadingId(goal.id);
    try {
      let endpoint = '';
      if (action === 'start') endpoint = 'start';
      else if (action === 'pause') endpoint = 'pause';
      else if (action === 'resume') endpoint = 'resume';
      await axios.post(`${API_URL}/api/goals/${goal.id}/${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      await fetchGoals(jwt);
    } catch (err) {
      alert('Failed to update goal status');
    }
    setActionLoadingId(null);
  };
  const handleDeleteGoal = async (goal: any) => {
    if (!jwt) return;
    const confirmed = window.confirm(`Are you sure you want to delete "${goal.goalName}"? This cannot be undone.`);
    if (!confirmed) return;
    setActionLoadingId(goal.id);
    try {
      await axios.delete(`${API_URL}/api/goals/${goal.id}`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      await fetchGoals(jwt);
    } catch (err) {
      alert('Failed to delete goal');
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
      <div className="overflow-x-auto" style={{ overflow: 'visible' }}>
        <table className="min-w-full bg-white rounded-xl shadow-md text-xs sm:text-sm" style={{ overflow: 'visible' }}>
          <thead>
            <tr className="bg-blue-50">
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold whitespace-nowrap">Goal Name</th>
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold whitespace-nowrap">Progress</th>
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold whitespace-nowrap" style={{ minWidth: 70, maxWidth: 120, width: 90 }}>Status</th>
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold whitespace-nowrap" style={{ minWidth: 90, maxWidth: 120, width: 100 }}>Start Date</th>
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold whitespace-nowrap">Menu</th>
            </tr>
          </thead>
          <tbody>
            {goals.map(goal => (
              <tr key={goal.id} className="border-b group hover:bg-blue-50 cursor-pointer" style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}
                onClick={e => {
                  // Only open calendar if not clicking a button or the menu icon
                  if (
                    e.target instanceof HTMLElement &&
                    !e.target.closest('button') &&
                    !e.target.closest('.menu-icon-btn')
                  ) {
                    openCalendar(goal);
                  }
                }}
              >
                <td className="py-1 sm:py-2 px-2 sm:px-4 font-semibold max-w-[120px] truncate">{goal.goalName}</td>
                <td className="py-1 sm:py-2 px-2 sm:px-4">
                {/* Progress Bar */}
                {(() => {
                  const totalEffort = goal.estimatedEffort ?? 0;
                  let investedEffort = 0;
                  if (Array.isArray(goal.progressCalendar)) {
                    investedEffort = goal.progressCalendar.reduce((sum: number, entry: any) => sum + (Number(entry.effort) || 0), 0);
                  } else if (goal.progressCalendar && typeof goal.progressCalendar === 'object') {
                    investedEffort = Object.values(goal.progressCalendar).reduce((sum: number, effort: any) => sum + (Number(effort) || 0), 0);
                  }
                  const remainingEffort = Math.max(totalEffort - investedEffort, 0);
                  const investedPercent = totalEffort ? (investedEffort / totalEffort) * 100 : 0;
                  const remainingPercent = totalEffort ? (remainingEffort / totalEffort) * 100 : 0;
                  return (
                    <div className="w-full h-0.5 bg-gray-200 rounded flex overflow-hidden min-w-[120px] relative">
                      <div
                        className="h-full"
                        style={{ width: `${investedPercent}%`, backgroundColor: 'var(--color-accent)' }}
                        title={`Invested: ${investedEffort}`}
                      ></div>
                      <div
                        className="h-full bg-gray-400"
                        style={{ width: `${remainingPercent}%` }}
                        title={`Remaining: ${remainingEffort}`}
                      ></div>
                      <span className="absolute left-1 top-1 text-xs font-bold" style={{ color: 'var(--color-accent)' }}>{investedEffort}/{totalEffort}</span>
                    </div>
                  );
                })()}
              </td>
                <td className="py-1 sm:py-2 px-2 sm:px-4" style={{ minWidth: 70, maxWidth: 120, width: 90, whiteSpace: 'nowrap' }}>{
                  goal.status
                    ? goal.status
                        .toLowerCase()
                        .split('_')
                        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')
                    : ''
                }</td>
                <td className="py-1 sm:py-2 px-2 sm:px-4" style={{ minWidth: 90, maxWidth: 120, width: 100, whiteSpace: 'nowrap' }}>{formatStartDate(goal.startDate, goal.status)}</td>
                <td
                  className="py-1 sm:py-2 px-2 sm:px-4 relative"
                  style={{ width: '1%', whiteSpace: 'nowrap', overflow: 'visible' }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex justify-end">
                    <button
                      ref={el => { menuBtnRefs.current[goal.id] = el; }}
                      className="menu-icon-btn bg-gray-700 text-white px-2 py-1 rounded-full shadow flex items-center justify-center cursor-pointer focus:outline-none focus-accent-border"
                      onClick={e => {
                        e.stopPropagation();
                        if (menuOpenId === goal.id) {
                          setMenuOpenId(null);
                          setMenuPosition(null);
                        } else {
                          setMenuOpenId(goal.id);
                          // Calculate position for portal
                          const rect = menuBtnRefs.current[goal.id]?.getBoundingClientRect();
                          if (rect) {
                            setMenuPosition({
                              top: rect.bottom + window.scrollY + 4,
                              left: rect.right + window.scrollX - 144 // 144px = menu width
                            });
                          }
                        }
                      }}
                      title="Actions"
                    >
                      <FaEllipsisV />
                    </button>
                    {menuOpenId === goal.id && menuPosition && ReactDOM.createPortal(
                      <div className="menu-dropdown w-36 bg-white border rounded shadow-lg z-[99999] flex flex-col"
                        style={{
                          position: 'absolute',
                          top: menuPosition.top,
                          left: menuPosition.left,
                          overflow: 'visible',
                          minWidth: 144
                        }}
                      >
                        {goal.status === 'NOT_STARTED' && (
                          <button
                            className="text-left px-4 py-2 hover:bg-blue-50"
                            onClick={e => { e.stopPropagation(); handleStatusAction(goal, 'start'); setMenuOpenId(null); }}
                            disabled={actionLoadingId === goal.id}
                          >
                            Start
                          </button>
                        )}
                        {goal.status === 'ACTIVE' && (
                          <button
                            className="text-left px-4 py-2 hover:bg-blue-50"
                            onClick={e => { e.stopPropagation(); handleStatusAction(goal, 'pause'); setMenuOpenId(null); }}
                            disabled={actionLoadingId === goal.id}
                          >
                            Pause
                          </button>
                        )}
                        {goal.status === 'PAUSED' && (
                          <button
                            className="text-left px-4 py-2 hover:bg-blue-50"
                            onClick={e => { e.stopPropagation(); handleStatusAction(goal, 'resume'); setMenuOpenId(null); }}
                            disabled={actionLoadingId === goal.id}
                          >
                            Resume
                          </button>
                        )}
                        {(goal.status === 'ACTIVE' || goal.status === 'PAUSED') && (
                          <button
                            className="text-left px-4 py-2 hover:bg-blue-50"
                            onClick={e => { e.stopPropagation(); handleComplete(goal); setMenuOpenId(null); }}
                            disabled={actionLoadingId === goal.id}
                          >
                            Complete
                          </button>
                        )}
                        {(goal.status === 'NOT_STARTED' || goal.status === 'ACTIVE' || goal.status === 'PAUSED' || goal.status === 'COMPLETED') && (
                          <button
                            className="text-left px-4 py-2 hover:bg-red-50 text-red-600"
                            onClick={e => { e.stopPropagation(); handleDeleteGoal(goal); setMenuOpenId(null); }}
                            disabled={actionLoadingId === goal.id}
                          >
                            Delete
                          </button>
                        )}
                      </div>,
                      document.body
                    )}
                  </div>
                </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default GoalTable;