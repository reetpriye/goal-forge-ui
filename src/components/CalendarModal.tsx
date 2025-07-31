import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

interface CalendarModalProps {
  showCalendar: boolean;
  calendarGoal: any;
  effortValue: number;
  setEffortValue: (val: number) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date | Date[] | null) => void;
  handleEffortSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  closeCalendar: () => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ showCalendar, calendarGoal, effortValue, setEffortValue, selectedDate, setSelectedDate, handleEffortSubmit, closeCalendar }) => {
  // Helper to disable past dates
  const tileDisabled = ({ date }: { date: Date }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Helper to show effort on calendar
  const tileContent = ({ date }: { date: Date }) => {
    if (!calendarGoal.progressCalendar) return null;
    const entry = calendarGoal.progressCalendar.find((e: any) => e.date === date.toISOString().split('T')[0]);
    return entry ? <div style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '0.9em' }}>{entry.effort}</div> : null;
  };

  return showCalendar && calendarGoal ? (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 min-w-[400px] shadow-lg">
        <h2 className="text-xl font-bold mb-4">Effort Calendar for {calendarGoal.goalName}</h2>
        <Calendar
          value={selectedDate}
          onChange={(value) => {
            if (Array.isArray(value)) {
              setSelectedDate(value[0] || new Date());
            } else if (value instanceof Date) {
              setSelectedDate(value);
            } else {
              setSelectedDate(new Date());
            }
          }}
          tileDisabled={tileDisabled}
          tileContent={tileContent}
        />
        <form onSubmit={handleEffortSubmit} className="flex gap-4 mt-6 mb-4">
          <div>
            <label className="block mb-1 text-gray-700">Effort Value:</label>
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
  ) : null;
};

export default CalendarModal;
