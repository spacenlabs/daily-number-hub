import { Link } from "react-router-dom";
import { Clock, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      <Card className="hover:shadow-card-hover transition-all duration-200 cursor-pointer bg-gradient-card border-border/50">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg text-foreground">{name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {scheduledTime}
                </p>
              </div>
              <Badge variant={getStatusColor(status)} className="text-xs">
                {getStatusText(status)}
              </Badge>
            </div>

            {/* Results Display */}
            <div className="grid grid-cols-2 gap-4">
              {/* Today's Result */}
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Today
                </div>
                <div className="bg-result-bg border-2 border-result-border rounded-lg py-3 px-2 min-h-[60px] flex items-center justify-center">
                  {todayResult !== undefined ? (
                    <span className="text-2xl font-bold text-result-text">
                      {todayResult}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {status === "pending" ? "Pending" : "--"}
                    </span>
                  )}
                </div>
              </div>

              {/* Yesterday's Result */}
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Yesterday
                </div>
                <div className="bg-muted/50 border border-border rounded-lg py-3 px-2 min-h-[60px] flex items-center justify-center">
                  {yesterdayResult !== undefined ? (
                    <span className="text-xl font-semibold text-muted-foreground">
                      {yesterdayResult}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">--</span>
                  )}
                </div>
              </div>
            </div>

            {/* Game Code */}
            <div className="text-center">
              <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                {shortCode}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default GameCard;