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

export const isGameUpcoming = (scheduledTime: string): boolean => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  // Handle different time formats
  let gameTime: string;
  if (scheduledTime.includes('AM') || scheduledTime.includes('PM')) {
    // Convert 12-hour to 24-hour for comparison
    const timePart = scheduledTime.replace(/(AM|PM)/i, '').trim();
    const [hours, minutes] = timePart.split(':').map(Number);
    const isPM = scheduledTime.toUpperCase().includes('PM');
    const hour24 = isPM && hours !== 12 ? hours + 12 : (!isPM && hours === 12 ? 0 : hours);
    gameTime = `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } else {
    gameTime = scheduledTime;
  }
  
  const [gameHours, gameMinutes] = gameTime.split(':').map(Number);
  const gameTimeInMinutes = gameHours * 60 + gameMinutes;
  
  return currentTime < gameTimeInMinutes;
};

export const isGameOverdue = (scheduledTime: string): boolean => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  // Handle different time formats
  let gameTime: string;
  if (scheduledTime.includes('AM') || scheduledTime.includes('PM')) {
    // Convert 12-hour to 24-hour for comparison
    const timePart = scheduledTime.replace(/(AM|PM)/i, '').trim();
    const [hours, minutes] = timePart.split(':').map(Number);
    const isPM = scheduledTime.toUpperCase().includes('PM');
    const hour24 = isPM && hours !== 12 ? hours + 12 : (!isPM && hours === 12 ? 0 : hours);
    gameTime = `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } else {
    gameTime = scheduledTime;
  }
  
  const [gameHours, gameMinutes] = gameTime.split(':').map(Number);
  const gameTimeInMinutes = gameHours * 60 + gameMinutes;
  
  return currentTime >= gameTimeInMinutes;
};

export const shouldShowWait = (scheduledTime: string, hasResult: boolean): boolean => {
  // Show WAIT only if time has passed AND no result is published
  return !hasResult && isGameOverdue(scheduledTime);
};

export const getDisplayStatus = (game: { scheduled_time: string; today_result?: number | null; status: string }) => {
  const hasResult = game.today_result !== null && game.today_result !== undefined;
  
  if (hasResult) {
    return { type: 'result', value: game.today_result };
  }
  
  if (shouldShowWait(game.scheduled_time, hasResult)) {
    return { type: 'wait', value: 'WAIT' };
  }
  
  // Show scheduled time for upcoming games
  return { type: 'scheduled', value: formatTo12Hour(game.scheduled_time) };
};