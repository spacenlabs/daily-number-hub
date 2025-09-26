import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGames } from "@/hooks/useGames";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { toast } from "sonner";
import { formatTo12Hour } from "@/lib/time-utils";
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

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { games, loading, updateGameResult, editGameResult, editYesterdayGameResult } = useGames();
  const { user, isAdmin, loading: authLoading, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const [isAddResultOpen, setIsAddResultOpen] = useState(false);
  const [isEditResultOpen, setIsEditResultOpen] = useState(false);
  const [isEditYesterdayResultOpen, setIsEditYesterdayResultOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [editingGameId, setEditingGameId] = useState("");
  const [editingYesterdayGameId, setEditingYesterdayGameId] = useState("");
  const [newResult, setNewResult] = useState("");
  const [editResult, setEditResult] = useState("");
  const [editYesterdayResult, setEditYesterdayResult] = useState("");

  // Check authentication and admin privileges
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        toast.error("Please log in to access the admin dashboard");
        navigate('/admin');
        return;
      }
      
      if (!isAdmin) {
        toast.error("You don't have admin privileges to access this dashboard");
        navigate('/');
        return;
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  // Show loading while checking authentication
  if (authLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate stats dynamically
  const mockStats = {
    totalGames: games.length,
    todayResults: games.filter(game => game.today_result !== undefined && game.today_result !== null).length,
    pendingResults: games.filter(game => game.status === "pending").length,
    totalPlays: 1247,
  };

  const handleAddResult = async () => {
    if (!selectedGameId || !newResult) return;
    
    const resultNumber = parseInt(newResult);
    if (isNaN(resultNumber) || resultNumber < 0 || resultNumber > 99) {
      toast.error("Please enter a valid result (0-99)");
      return;
    }

    const result = await updateGameResult(selectedGameId, resultNumber);
    
    if (result.success) {
      toast.success("Result added successfully!");
      setIsAddResultOpen(false);
      setSelectedGameId("");
      setNewResult("");
    } else {
      toast.error(result.error || "Failed to add result");
    }
  };

  const handleEditResult = async () => {
    if (!editingGameId || !editResult) return;
    
    const resultNumber = parseInt(editResult);
    if (isNaN(resultNumber) || resultNumber < 0 || resultNumber > 99) {
      toast.error("Please enter a valid result (0-99)");
      return;
    }

    const result = await editGameResult(editingGameId, resultNumber);
    
    if (result.success) {
      toast.success("Result updated successfully!");
      setIsEditResultOpen(false);
      setEditingGameId("");
      setEditResult("");
    } else {
      toast.error(result.error || "Failed to update result");
    }
  };

  const openEditDialog = (gameId: string, currentResult: number | null) => {
    setEditingGameId(gameId);
    setEditResult(currentResult?.toString() || "");
    setIsEditResultOpen(true);
  };

  const handleEditYesterdayResult = async () => {
    if (!editingYesterdayGameId || !editYesterdayResult) return;
    
    const resultNumber = parseInt(editYesterdayResult);
    if (isNaN(resultNumber) || resultNumber < 0 || resultNumber > 99) {
      toast.error("Please enter a valid result (0-99)");
      return;
    }

    const result = await editYesterdayGameResult(editingYesterdayGameId, resultNumber);
    
    if (result.success) {
      toast.success("Yesterday result updated successfully!");
      setIsEditYesterdayResultOpen(false);
      setEditingYesterdayGameId("");
      setEditYesterdayResult("");
    } else {
      toast.error(result.error || "Failed to update yesterday result");
    }
  };

  const openEditYesterdayDialog = (gameId: string, currentResult: number | null) => {
    setEditingYesterdayGameId(gameId);
    setEditYesterdayResult(currentResult?.toString() || "");
    setIsEditYesterdayResultOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

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
              <div className="text-sm text-muted-foreground">
                Welcome, {profile?.email}
              </div>
              <Link to="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <Home className="h-4 w-4" />
                  Public Site
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={async () => {
                  await signOut();
                  toast.success("Logged out successfully");
                  navigate('/');
                }}
              >
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
                            Code: {game.short_code} • Scheduled: {formatTo12Hour(game.scheduled_time)}
                          </p>
                        </div>
                        <Badge variant={game.enabled ? "default" : "secondary"}>
                          {game.enabled ? "Active" : "Disabled"}
                        </Badge>
                        <Badge variant={game.status === "published" ? "default" : "secondary"}>
                          {game.status === "published" ? "Published" : "Pending"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Yesterday's Result</div>
                          <div className="text-lg font-bold">
                            {game.yesterday_result !== undefined && game.yesterday_result !== null ? game.yesterday_result : "--"}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditYesterdayDialog(game.id, game.yesterday_result)}
                            className="mt-1"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Today's Result</div>
                          <div className="text-xl font-bold">
                            {game.today_result !== undefined && game.today_result !== null ? game.today_result : "--"}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(game.id, game.today_result)}
                            disabled={game.today_result === null || game.today_result === undefined}
                            className="mt-1"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
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
              <div className="flex gap-2">
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
                                {game.name} ({game.short_code}) - {formatTo12Hour(game.scheduled_time)}
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

                <Dialog open={isEditResultOpen} onOpenChange={setIsEditResultOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Result</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Game</Label>
                        <div className="text-sm text-muted-foreground">
                          {games.find(g => g.id === editingGameId)?.name || "Unknown Game"}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="edit-result-input">Result (0-99)</Label>
                        <Input
                          id="edit-result-input"
                          type="number"
                          min="0"
                          max="99"
                          value={editResult}
                          onChange={(e) => setEditResult(e.target.value)}
                          placeholder="Enter result number"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsEditResultOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleEditResult}>
                          Update Result
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isEditYesterdayResultOpen} onOpenChange={setIsEditYesterdayResultOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Yesterday Result</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Game</Label>
                        <div className="text-sm text-muted-foreground">
                          {games.find(g => g.id === editingYesterdayGameId)?.name || "Unknown Game"}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="edit-yesterday-result-input">Yesterday Result (0-99)</Label>
                        <Input
                          id="edit-yesterday-result-input"
                          type="number"
                          min="0"
                          max="99"
                          value={editYesterdayResult}
                          onChange={(e) => setEditYesterdayResult(e.target.value)}
                          placeholder="Enter yesterday result number"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsEditYesterdayResultOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleEditYesterdayResult}>
                          Update Yesterday Result
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
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
                            {formatTo12Hour(game.scheduled_time)}
                          </p>
                        </div>
                      </div>
                          <div className="flex items-center gap-4">
                            <Badge variant={game.status === "published" ? "default" : "secondary"}>
                              {game.status === "published" ? "Published" : "Pending"}
                            </Badge>
                            <div className="text-right flex items-center gap-2">
                              <div>
                                <div className="text-xs text-muted-foreground">Yesterday</div>
                                <div className="text-sm font-bold">
                                  {game.yesterday_result !== undefined && game.yesterday_result !== null ? game.yesterday_result : "--"}
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openEditYesterdayDialog(game.id, game.yesterday_result)}
                                  className="h-6 w-6 p-0 mt-1"
                                >
                                  <Edit className="h-2 w-2" />
                                </Button>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Today</div>
                                <div className="text-lg font-bold">
                                  {game.today_result !== undefined && game.today_result !== null ? game.today_result : "--"}
                                </div>
                                {game.today_result !== undefined && game.today_result !== null && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => openEditDialog(game.id, game.today_result)}
                                    className="h-6 w-6 p-0 mt-1"
                                  >
                                    <Edit className="h-2 w-2" />
                                  </Button>
                                )}
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