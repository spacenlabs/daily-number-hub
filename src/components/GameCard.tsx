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
      <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-card via-card/95 to-primary/5 border-2 border-primary/20 hover:border-primary/40 transform hover:scale-[1.02] animate-fade-in">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-xl bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">{name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 font-medium">
                  <Clock className="h-4 w-4 text-primary" />
                  ⏰ {scheduledTime}
                </p>
              </div>
              <Badge variant={getStatusColor(status)} className={`text-xs font-bold px-3 py-1 ${
                status === 'published' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : 
                'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
              }`}>
                {getStatusText(status)}
              </Badge>
            </div>

            {/* Results Display */}
            <div className="grid grid-cols-2 gap-3">
              {/* Today's Result */}
              <div className="text-center">
                <div className="text-xs font-bold text-primary mb-2 flex items-center justify-center gap-1">
                  <Calendar className="h-4 w-4" />
                  🟢 TODAY
                </div>
                <div className="bg-gradient-to-br from-primary/10 to-primary-glow/20 border-3 border-primary/50 rounded-xl py-4 px-2 min-h-[80px] flex items-center justify-center animate-glow-pulse">
                  {todayResult !== undefined ? (
                    <span className="text-3xl font-black text-primary animate-pulse-result drop-shadow-lg">
                      {todayResult}
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-primary/70 animate-pulse">
                      {status === "pending" ? "⏳ PENDING" : "--"}
                    </span>
                  )}
                </div>
              </div>

              {/* Yesterday's Result */}
              <div className="text-center">
                <div className="text-xs font-bold text-accent mb-2 flex items-center justify-center gap-1">
                  <Calendar className="h-4 w-4" />
                  🔵 YESTERDAY
                </div>
                <div className="bg-gradient-to-br from-accent/10 to-accent-glow/20 border-2 border-accent/40 rounded-xl py-4 px-2 min-h-[80px] flex items-center justify-center">
                  {yesterdayResult !== undefined ? (
                    <span className="text-2xl font-bold text-accent drop-shadow-md">
                      {yesterdayResult}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">--</span>
                  )}
                </div>
              </div>
            </div>

            {/* Game Code */}
            <div className="text-center mt-3">
              <span className="text-xs font-bold text-primary/80 font-mono bg-gradient-to-r from-primary/10 to-primary-glow/10 px-3 py-2 rounded-full border border-primary/30">
                #{shortCode}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default GameCard;