export const formatTo12Hour = (time24: string): string => {
  // Handle different time formats: "14:30", "2:30 PM", etc.
  if (time24.includes('AM') || time24.includes('PM')) {
    return time24; // Already in 12-hour format
  }

  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12; // Convert 0 to 12 for midnight
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};