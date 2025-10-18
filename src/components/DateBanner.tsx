import { useState, useEffect } from 'react';

const DateBanner = () => {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      };
      setCurrentDate(now.toLocaleDateString('en-US', options));
    };

    updateDate();
    const interval = setInterval(updateDate, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 border-y border-primary/30 py-3">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <span className="text-base font-bold text-primary animate-pulse">
            📅 TODAY: {currentDate} 📅
          </span>
        </div>
      </div>
    </div>
  );
};

export default DateBanner;