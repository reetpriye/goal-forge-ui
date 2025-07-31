import React from 'react';

interface CalendarModalProps {
  showCalendar: boolean;
  calendarGoal: any;
  effortValue: number;
  setEffortValue: (val: number) => void;
  handleEffortSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  closeCalendar: () => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ showCalendar, calendarGoal, effortValue, setEffortValue, handleEffortSubmit, closeCalendar }) => (
  showCalendar && calendarGoal ? (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 min-w-[400px] shadow-lg">
        <h2 className="text-xl font-bold mb-4">Effort Calendar for {calendarGoal.goalName}</h2>
        <table className="min-w-full rounded mb-4" style={{ background: '#23232a' }}>
          <thead>
            <tr>
              <th className="py-2 px-4 text-left" style={{ color: '#e5e7eb' }}>Date</th>
              <th className="py-2 px-4 text-left" style={{ color: '#e5e7eb' }}>Effort</th>
            </tr>
          </thead>
          <tbody>
            {calendarGoal.progressCalendar && Array.isArray(calendarGoal.progressCalendar) && calendarGoal.progressCalendar.length > 0 ? (
              calendarGoal.progressCalendar.map((entry: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-2 px-4" style={{ color: '#e5e7eb' }}>{entry.date}</td>
                  <td className="py-2 px-4" style={{ color: '#e5e7eb' }}>{entry.effort}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-2 px-4 text-gray-400" colSpan={2} style={{ color: '#a1a1aa' }}>No effort history</td>
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
  ) : null
);

export default CalendarModal;
