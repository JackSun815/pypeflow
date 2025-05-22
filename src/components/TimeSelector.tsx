import React, { useState, useEffect } from 'react';

interface TimeSelectorProps {
  value: string;
  onChange: (timeString: string) => void;
  className?: string;
}

export default function TimeSelector({ value, onChange, className = '' }: TimeSelectorProps) {
  // Parse the initial time value (format: HH:MM)
  const [hour, setHour] = useState<number>(0);
  const [minute, setMinute] = useState<number>(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

  // Initialize from value prop
  useEffect(() => {
    if (value) {
      try {
        const [hourStr, minuteStr] = value.split(':');
        let hourVal = parseInt(hourStr, 10);
        const minuteVal = parseInt(minuteStr, 10);
        
        // Determine AM/PM
        let periodVal: 'AM' | 'PM' = 'AM';
        if (hourVal >= 12) {
          periodVal = 'PM';
          if (hourVal > 12) {
            hourVal -= 12;
          }
        }
        if (hourVal === 0) {
          hourVal = 12;
        }
        
        setHour(hourVal);
        setMinute(minuteVal);
        setPeriod(periodVal);
      } catch (e) {
        // Default to 9:00 AM if parsing fails
        setHour(9);
        setMinute(0);
        setPeriod('AM');
      }
    }
  }, [value]);

  // Update the time when any component changes
  const updateTime = (newHour: number, newMinute: number, newPeriod: 'AM' | 'PM') => {
    // Convert to 24-hour format for the output
    let hour24 = newHour;
    
    // Convert 12 AM to 0
    if (newPeriod === 'AM' && newHour === 12) {
      hour24 = 0;
    }
    // Convert PM times to 24-hour format
    else if (newPeriod === 'PM' && newHour < 12) {
      hour24 = newHour + 12;
    }
    
    // Format as HH:MM
    const timeString = `${hour24.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
    onChange(timeString);
  };

  // Handle hour change
  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHour = parseInt(e.target.value, 10);
    setHour(newHour);
    updateTime(newHour, minute, period);
  };

  // Handle minute change
  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinute = parseInt(e.target.value, 10);
    setMinute(newMinute);
    updateTime(hour, newMinute, period);
  };

  // Handle period change
  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = e.target.value as 'AM' | 'PM';
    setPeriod(newPeriod);
    updateTime(hour, minute, newPeriod);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Hour selector */}
      <select
        value={hour}
        onChange={handleHourChange}
        className="rounded-md border border-gray-300 px-2 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
      >
        {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      
      <span className="text-gray-500">:</span>
      
      {/* Minute selector */}
      <select
        value={minute}
        onChange={handleMinuteChange}
        className="rounded-md border border-gray-300 px-2 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
      >
        {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
          <option key={m} value={m}>
            {m.toString().padStart(2, '0')}
          </option>
        ))}
      </select>
      
      {/* AM/PM selector */}
      <select
        value={period}
        onChange={handlePeriodChange}
        className="rounded-md border border-gray-300 px-2 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}