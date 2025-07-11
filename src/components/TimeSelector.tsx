import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';

interface TimeSelectorProps {
  value: string; // Expects EST ISO string or HH:MM format
  onChange: (timeString: string) => void; // Returns EST ISO string
  className?: string;
  timezone?: string; // Default to EST
}

export default function TimeSelector({ 
  value, 
  onChange, 
  className = '', 
  timezone = 'America/New_York' 
}: TimeSelectorProps) {
  // Internal state for 12-hour format display
  const [hour, setHour] = useState<number>(9);
  const [minute, setMinute] = useState<number>(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

  // Initialize from value prop (EST ISO string or HH:MM format)
  useEffect(() => {
    try {
      // Determine if input is ISO string or just time
      const isISOString = value.includes('T') || value.includes(' ');
      
      let displayTime;
      
      if (isISOString) {
        // Parse as EST and convert to display timezone
        displayTime = DateTime.fromISO(value, { zone: timezone });
      } else {
        // Handle case where just time is provided (HH:MM format)
        const today = DateTime.now().setZone(timezone);
        const [hours, minutes] = value.split(':').map(Number);
        displayTime = today.set({ hour: hours, minute: minutes });
      }
      
      if (!displayTime.isValid) {
        throw new Error('Invalid time');
      }
      
      // Convert to 12-hour format for display
      let displayHour = displayTime.hour % 12;
      displayHour = displayHour === 0 ? 12 : displayHour;
      
      setHour(displayHour);
      setMinute(displayTime.minute);
      setPeriod(displayTime.hour >= 12 ? 'PM' : 'AM');
    } catch (e) {
      // Default to 9:00 AM if parsing fails
      setHour(9);
      setMinute(0);
      setPeriod('AM');
    }
  }, [value, timezone]);

  // Update the time when any component changes
  const updateTime = (newHour: number, newMinute: number, newPeriod: 'AM' | 'PM') => {
    // Convert 12-hour format to 24-hour format in the specified timezone
    let hour24 = newHour;
    
    if (newPeriod === 'AM' && newHour === 12) {
      hour24 = 0; // 12 AM becomes 0
    } else if (newPeriod === 'PM' && newHour < 12) {
      hour24 = newHour + 12; // PM times get +12
    }
    
    // Create a DateTime in the specified timezone
    const now = DateTime.now().setZone(timezone);
    const localTime = now.set({ 
      hour: hour24, 
      minute: newMinute, 
      second: 0, 
      millisecond: 0 
    });
    
    // Convert to EST ISO string for storage (no UTC conversion)
    const estISO = localTime.toISO();
    
    if (estISO) {
      onChange(estISO);
    }
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