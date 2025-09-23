import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Home, 
  Settings, 
  Users, 
  BarChart3, 
  Plus,
  Edit,
  Trash2,
  LogOut,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Games data - synced with public site
const initialGames = [
  {
    id: "1",
    name: "Darbhanga King",
    shortCode: "DK",
    scheduledTime: "11:00",
    todayResult: 73,
    yesterdayResult: 45,
    status: "published" as const,
    enabled: true,
  },
  {
    id: "2", 
    name: "Samastipur King",
    shortCode: "SK",
    scheduledTime: "14:00",
    todayResult: 28,
    yesterdayResult: 92,
    status: "published" as const,
    enabled: true,
  },
  {
    id: "3",
    name: "Madhubani King", 
    shortCode: "MK",
    scheduledTime: "15:00",
    todayResult: 56,
    yesterdayResult: 17,
    status: "published" as const,
    enabled: true,
  },
  {
    id: "4",
    name: "Sitamarhi King",
    shortCode: "SMK", 
    scheduledTime: "16:00",
    todayResult: undefined,
    yesterdayResult: 84,
    status: "pending" as const,
    enabled: true,
  },
  {
    id: "5",
    name: "Shri Ganesh",
    shortCode: "SG", 
    scheduledTime: "16:30",
    todayResult: undefined,
    yesterdayResult: 63,
    status: "pending" as const,
    enabled: true,
  },
  {
    id: "6",
    name: "Chakiya King",
    shortCode: "CK", 
    scheduledTime: "17:00",
    todayResult: undefined,
    yesterdayResult: 39,
    status: "pending" as const,
    enabled: true,
  },
  {
    id: "7",
    name: "Faridabad",
    shortCode: "FB", 
    scheduledTime: "18:00",
    todayResult: undefined,
    yesterdayResult: 75,
    status: "pending" as const,
    enabled: true,
  },
  {
    id: "8",
    name: "Muzaffarpur King",
    shortCode: "MZK", 
    scheduledTime: "19:00",
    todayResult: undefined,
    yesterdayResult: 21,
    status: "pending" as const,
    enabled: true,
  },
  {
    id: "9",
    name: "Ghaziabad",
    shortCode: "GZB", 
    scheduledTime: "20:30",
    todayResult: undefined,
    yesterdayResult: 68,
    status: "pending" as const,
    enabled: true,
  },
  {
    id: "10",
    name: "Ara King",
    shortCode: "AK", 
    scheduledTime: "21:30",
    todayResult: undefined,
    yesterdayResult: 94,
    status: "pending" as const,
    enabled: true,
  },
  {
    id: "11",
    name: "Chhapra King",
    shortCode: "CHK", 
    scheduledTime: "21:45",
    todayResult: undefined,
    yesterdayResult: 12,
    status: "pending" as const,
    enabled: true,
  },
  {
    id: "12",
    name: "Patna King",
    shortCode: "PK", 
    scheduledTime: "22:00",
    todayResult: undefined,
    yesterdayResult: 87,
    status: "pending" as const,
    enabled: true,
  },
  {
    id: "13",
    name: "Gali",
    shortCode: "GL", 
    scheduledTime: "23:30",
    todayResult: undefined,
    yesterdayResult: 35,
    status: "pending" as const,
    enabled: true,
  },
  {
    id: "14",
    name: "Disawar",
    shortCode: "DS", 
    scheduledTime: "05:00",
    todayResult: 49,
    yesterdayResult: 76,
    status: "published" as const,
    enabled: true,
  },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [games, setGames] = useState(initialGames);
  const [isAddResultOpen, setIsAddResultOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [newResult, setNewResult] = useState("");

  // Calculate stats dynamically
  const mockStats = {
    totalGames: games.length,
    todayResults: games.filter(game => game.todayResult !== undefined).length,
    pendingResults: games.filter(game => game.status === "pending").length,
    totalPlays: 1247,
  };

  const handleAddResult = () => {
    if (!selectedGameId || !newResult) return;
    
    const resultNumber = parseInt(newResult);
    if (isNaN(resultNumber) || resultNumber < 0 || resultNumber > 99) {
      alert("Please enter a valid result (0-99)");
      return;
    }

    setGames(prevGames => 
      prevGames.map(game => 
        game.id === selectedGameId 
          ? { 
              ...game, 
              todayResult: resultNumber, 
              status: "published" as const 
            }
          : game
      )
    );
    
    setIsAddResultOpen(false);
    setSelectedGameId("");
    setNewResult("");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage games and results</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <Home className="h-4 w-4" />
                  Public Site
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Games</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.totalGames}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Results</CardTitle>
                  <Badge variant="default">{mockStats.todayResults}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">{mockStats.todayResults}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Results</CardTitle>
                  <Badge variant="secondary">{mockStats.pendingResults}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">{mockStats.pendingResults}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.totalPlays.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system activities and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="default">Auto</Badge>
                    <span>Daily Lottery result published: 45</span>
                    <span className="text-muted-foreground ml-auto">2 hours ago</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="default">Auto</Badge>
                    <span>Evening Draw result published: 82</span>
                    <span className="text-muted-foreground ml-auto">6 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="games" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Manage Games</h2>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add New Game
              </Button>
            </div>

            <div className="grid gap-4">
              {games.map((game) => (
                <Card key={game.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold">{game.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Code: {game.shortCode} • Scheduled: {game.scheduledTime}
                          </p>
                        </div>
                        <Badge variant={game.enabled ? "default" : "secondary"}>
                          {game.enabled ? "Active" : "Disabled"}
                        </Badge>
                        <Badge variant={game.status === "published" ? "default" : "secondary"}>
                          {game.status === "published" ? "Published" : "Pending"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-4">
                          <div className="text-sm text-muted-foreground">Today's Result</div>
                          <div className="text-xl font-bold">
                            {game.todayResult !== undefined ? game.todayResult : "--"}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Manage Results</h2>
              <Dialog open={isAddResultOpen} onOpenChange={setIsAddResultOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Result
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Result</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="game-select">Select Game</Label>
                      <Select value={selectedGameId} onValueChange={setSelectedGameId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a game" />
                        </SelectTrigger>
                        <SelectContent>
                          {games.filter(game => game.status === "pending").map((game) => (
                            <SelectItem key={game.id} value={game.id}>
                              {game.name} ({game.shortCode}) - {game.scheduledTime}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="result-input">Result (0-99)</Label>
                      <Input
                        id="result-input"
                        type="number"
                        min="0"
                        max="99"
                        value={newResult}
                        onChange={(e) => setNewResult(e.target.value)}
                        placeholder="Enter result number"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddResultOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddResult}>
                        Add Result
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Today's Results</CardTitle>
                <CardDescription>Published and pending results for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {games.map((game) => (
                    <div key={game.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-medium">{game.name}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {game.scheduledTime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={game.status === "published" ? "default" : "secondary"}>
                          {game.status === "published" ? "Published" : "Pending"}
                        </Badge>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {game.todayResult !== undefined ? game.todayResult : "--"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure your results management system</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Settings panel coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;