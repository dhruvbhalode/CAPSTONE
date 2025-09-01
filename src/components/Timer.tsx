import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  running: boolean;
}

export default function Timer({ running }: TimerProps) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (running) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [running]);

  useEffect(() => {
    if (!running && time > 0) {
        // You could add logic here when the timer stops, e.g., log the final time.
    }
     if(running) setTime(0); // Reset timer when it starts
  }, [running]);


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-2">
      <Clock className={`h-5 w-5 ${running ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} />
      <span className="text-white font-mono text-lg">{formatTime(time)}</span>
    </div>
  );
}
