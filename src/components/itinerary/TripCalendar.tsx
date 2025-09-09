import React from 'react';

interface TripCalendarProps {
  startDate: string;
  endDate: string;
  onDateSelect: (date: string) => void;
}

const TripCalendar: React.FC<TripCalendarProps> = ({ startDate, endDate, onDateSelect }) => {
  // A simplified calendar focusing on the trip's duration
  const start = new Date(startDate + "T00:00:00-03:00");
  const end = new Date(endDate + "T00:00:00-03:00");
  const tripDays: string[] = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    tripDays.push(d.toISOString().split('T')[0]);
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
      <h4 className="text-sm font-semibold mb-2 text-center text-gray-700 dark:text-gray-200">
        {new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(start)}
      </h4>
      <div className="flex flex-wrap gap-2 justify-center">
        {tripDays.map(day => {
          const date = new Date(day + "T00:00:00-03:00");
          const dayOfMonth = date.getDate();
          const dayOfWeek = new Intl.DateTimeFormat('es-AR', { weekday: 'short' }).format(date).charAt(0).toUpperCase();
          return (
            <button
              key={day}
              onClick={() => onDateSelect(day)}
              className="w-12 h-14 flex flex-col items-center justify-center rounded-lg bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="text-xs text-gray-500 dark:text-gray-400">{dayOfWeek}</span>
              <span className="font-bold text-lg">{dayOfMonth}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TripCalendar;
