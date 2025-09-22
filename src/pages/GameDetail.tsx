import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock data for now
const mockGame = {
  id: "1",
  name: "Daily Lottery",
  shortCode: "DL",
  scheduledTime: "15:00",
};

const mockResults = [
  { date: "2025-01-22", result: 45, publishedTime: "15:00", mode: "auto", note: "" },
  { date: "2025-01-21", result: 82, publishedTime: "15:00", mode: "auto", note: "" },
  { date: "2025-01-20", result: 13, publishedTime: "15:00", mode: "manual", note: "Technical delay" },
  // ... more mock data
];

const GameDetail = () => {
  const { id } = useParams();
  const [selectedDate, setSelectedDate] = useState("");

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Games
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{mockGame.name}</h1>
              <p className="text-muted-foreground">Scheduled at {mockGame.scheduledTime} daily</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Results History
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Jump to Date
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Results List */}
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {mockResults.map((result, index) => (
                  <div key={index} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground w-24">
                          {result.date}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="bg-result-bg border-2 border-result-border rounded-lg px-4 py-2 min-w-[60px] text-center">
                            <span className="text-2xl font-bold text-result-text">
                              {result.result}
                            </span>
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">Published {result.publishedTime}</div>
                            {result.note && (
                              <div className="text-muted-foreground">{result.note}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant={result.mode === "auto" ? "default" : "secondary"}>
                        {result.mode}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GameDetail;