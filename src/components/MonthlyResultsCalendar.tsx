import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { GameResultHistory } from "@/hooks/useGameResultsHistory";
import { cn } from "@/lib/utils";

interface MonthlyResultsCalendarProps {
  results: GameResultHistory[];
}

export const MonthlyResultsCalendar = ({ results }: MonthlyResultsCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the starting day of week (0 = Sunday, 1 = Monday, etc.)
  const startDayOfWeek = monthStart.getDay();

  // Create array of empty cells for alignment
  const emptyCells = Array(startDayOfWeek).fill(null);

  const getResultForDate = (date: Date) => {
    return results.find(result => 
      isSameDay(new Date(result.result_date), date)
    );
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToCurrentMonth}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for alignment */}
            {emptyCells.map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {/* Days with results */}
            {daysInMonth.map(day => {
              const result = getResultForDate(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "aspect-square border rounded-lg p-2 flex flex-col items-center justify-center transition-all",
                    isToday && "border-primary border-2",
                    result ? "bg-primary/10 hover:bg-primary/20" : "bg-muted/30 hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isToday && "text-primary font-bold"
                  )}>
                    {format(day, 'd')}
                  </div>
                  {result && (
                    <div className="text-lg font-bold text-primary">
                      {result.result.toString().padStart(2, '0')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary rounded" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary/10 rounded" />
          <span>Has Result</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-muted/30 rounded" />
          <span>No Result</span>
        </div>
      </div>
    </div>
  );
};
