import { Link } from "react-router-dom";
import { Clock, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTo12Hour } from "@/lib/time-utils";

interface GameCardProps {
  id: string;
  name: string;
  shortCode: string;
  scheduledTime: string;
  todayResult?: number;
  yesterdayResult?: number;
  status: "published" | "pending" | "manual";
}

const GameCard = ({ 
  id, 
  name, 
  shortCode, 
  scheduledTime, 
  todayResult, 
  yesterdayResult, 
  status 
}: GameCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "default";
      case "pending":
        return "secondary";
      case "manual":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "published":
        return "Published";
      case "pending":
        return "Pending";
      case "manual":
        return "Manual";
      default:
        return "Unknown";
    }
  };

  return (
    <Link to={`/game/${id}`}>
      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-card to-primary/5 border border-primary/20 hover:border-primary/40 transform hover:scale-[1.01]">
        <CardContent className="p-3">
          <div className="space-y-2">
            {/* Header */}
            <div>
              <h3 className="font-bold text-sm bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent truncate">{name}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3 text-primary flex-shrink-0" />
                {formatTo12Hour(scheduledTime)}
              </p>
            </div>

            {/* Results Display */}
            <div className="grid grid-cols-2 gap-2">
              {/* Yesterday's Result */}
              <div className="text-center">
                <div className="text-xs font-medium text-accent mb-1">
                  Yesterday
                </div>
                <div className="bg-accent/10 border border-accent/30 rounded-lg py-2 px-1 min-h-[45px] flex items-center justify-center">
                  {yesterdayResult !== undefined ? (
                    <span className="text-lg font-bold text-accent">
                      {yesterdayResult.toString().padStart(2, '0')}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">--</span>
                  )}
                </div>
              </div>

              {/* Today's Result */}
              <div className="text-center">
                <div className="text-xs font-medium text-primary mb-1">
                  Today
                </div>
                <div className="bg-primary/10 border border-primary/40 rounded-lg py-2 px-1 min-h-[45px] flex items-center justify-center">
                  {todayResult !== undefined ? (
                    <span className="text-lg font-bold text-primary">
                      {todayResult.toString().padStart(2, '0')}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-primary/70">
                      {status === "pending" ? "Pending" : "--"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default GameCard;