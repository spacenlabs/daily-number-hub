import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGames } from "@/hooks/useGames";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { toast } from "sonner";
import { formatTo12Hour } from "@/lib/time-utils";
import { WebsiteBuilder } from "@/components/WebsiteBuilder";
import { UserManagement } from "@/components/UserManagement";
import { ROLE_LABELS } from "@/types/permissions";
import { supabase } from "@/integrations/supabase/client";
import { Home, Settings, Users, BarChart3, Plus, Edit, Trash2, LogOut, Clock, Shield, Eye, GamepadIcon, FileText, Calendar, Smartphone } from "lucide-react";
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
  const {
    games,
    loading,
    updateGameResult,
    editGameResult,
    editYesterdayGameResult,
    addGame,
    updateGame,
    deleteGame
  } = useGames();
  const {
    user,
    profile,
    loading: authLoading,
    signOut,
    canManageUsers,
    canManageGames,
    canManageResults,
    canManageContent,
    canViewAnalytics,
    hasRoleOrHigher
  } = useAuth();
  const navigate = useNavigate();
  const [isAddResultOpen, setIsAddResultOpen] = useState(false);
  const [isEditResultOpen, setIsEditResultOpen] = useState(false);
  const [isEditYesterdayResultOpen, setIsEditYesterdayResultOpen] = useState(false);
  const [isAddGameOpen, setIsAddGameOpen] = useState(false);
  const [isEditGameOpen, setIsEditGameOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [editingGameId, setEditingGameId] = useState("");
  const [editingYesterdayGameId, setEditingYesterdayGameId] = useState("");
  const [newResult, setNewResult] = useState("");
  const [editResult, setEditResult] = useState("");
  const [editYesterdayResult, setEditYesterdayResult] = useState("");
  const [gameForm, setGameForm] = useState({
    name: "",
    short_code: "",
    scheduled_time: "",
    enabled: true
  });
  const [editGameForm, setEditGameForm] = useState({
    id: "",
    name: "",
    short_code: "",
    scheduled_time: "",
    enabled: true
  });

  // Check authentication and permissions
  useEffect(() => {
    if (!authLoading && (!user || !profile?.role || !hasRoleOrHigher('viewer'))) {
      navigate('/admin');
    }
  }, [user, profile, authLoading, navigate, hasRoleOrHigher]);

  // Set default tab only on initial load based on permissions
  useEffect(() => {
    const getDefaultTab = () => {
      if (canViewAnalytics) return 'overview';
      if (canManageResults) return 'results';
      if (canManageGames) return 'games';
      if (canManageContent) return 'website';
      if (canManageUsers) return 'users';
      return 'overview';
    };

    // Only set default tab if current tab is not available to user or on first load
    const defaultTab = getDefaultTab();
    const availableTabs = [...(canViewAnalytics ? ['overview'] : []), ...(canManageUsers ? ['users'] : []), ...(canManageGames ? ['games'] : []), ...(canManageResults ? ['results'] : []), ...(canManageContent ? ['website'] : [])];
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(defaultTab);
    }
  }, [canViewAnalytics, canManageUsers, canManageGames, canManageResults, canManageContent]);

  // Show loading while checking authentication
  if (authLoading || !user || !hasRoleOrHigher('viewer')) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4">Loading dashboard...</p>
        </div>
      </div>;
  }

  // Calculate stats dynamically
  const mockStats = {
    totalGames: games.length,
    todayResults: games.filter(game => game.today_result !== undefined && game.today_result !== null).length,
    pendingResults: games.filter(game => game.status === "pending").length,
    totalPlays: 1247
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

  const handleAddGame = async () => {
    if (!gameForm.name || !gameForm.short_code || !gameForm.scheduled_time) {
      toast.error("Please fill in all required fields");
      return;
    }

    const result = await addGame(gameForm);
    if (result.success) {
      toast.success("Game added successfully!");
      setIsAddGameOpen(false);
      setGameForm({ name: "", short_code: "", scheduled_time: "", enabled: true });
    } else {
      toast.error(result.error || "Failed to add game");
    }
  };

  const openEditGameDialog = (game: typeof games[0]) => {
    setEditGameForm({
      id: game.id,
      name: game.name,
      short_code: game.short_code,
      scheduled_time: game.scheduled_time,
      enabled: game.enabled
    });
    setIsEditGameOpen(true);
  };

  const handleEditGame = async () => {
    if (!editGameForm.name || !editGameForm.short_code || !editGameForm.scheduled_time) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { id, ...updates } = editGameForm;
    const result = await updateGame(id, updates);
    if (result.success) {
      toast.success("Game updated successfully!");
      setIsEditGameOpen(false);
    } else {
      toast.error(result.error || "Failed to update game");
    }
  };

  const handleDeleteGame = async (gameId: string, gameName: string) => {
    if (!confirm(`Are you sure you want to delete "${gameName}"? This action cannot be undone.`)) {
      return;
    }

    const result = await deleteGame(gameId);
    if (result.success) {
      toast.success("Game deleted successfully!");
    } else {
      toast.error(result.error || "Failed to delete game");
    }
  };
  const handleLogoutAllDevices = async () => {
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('logout-all-devices', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      if (error) {
        console.error('Logout all devices error:', error);
        toast.error('Failed to logout from all devices');
        return;
      }
      toast.success('Successfully logged out from all devices');
      // Wait a moment then redirect
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Failed to logout from all devices');
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage games and results</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Logged in as:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs">{profile?.email}</Badge>
                  <Badge variant="secondary" className="text-xs">
                    <div className="flex items-center gap-1">
                      {profile?.role === 'super_admin' && <Shield className="h-3 w-3" />}
                      {profile?.role === 'admin' && <Shield className="h-3 w-3" />}
                      {profile?.role === 'viewer' && <Eye className="h-3 w-3" />}
                      {profile?.role && ROLE_LABELS[profile.role]}
                    </div>
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link to="/">
                  <Button variant="outline" size="sm" className="gap-1 text-xs">
                    <Home className="h-3 w-3" />
                    <span className="hidden sm:inline">Public Site</span>
                  </Button>
                </Link>
                <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleLogoutAllDevices}>
                  <Smartphone className="h-3 w-3" />
                  <span className="hidden md:inline">Log Out All Devices</span>
                  <span className="md:hidden">All Devices Logout</span>
                </Button>
                <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={async () => {
                await signOut();
                toast.success("Logged out successfully");
                navigate('/');
              }}>
                  <LogOut className="h-3 w-3" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 md:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${canManageUsers ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : canManageContent ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'} gap-0.5 sm:gap-1 h-auto p-1`}>
            {canViewAnalytics && <TabsTrigger value="overview" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 sm:py-2 min-h-[32px] sm:min-h-[36px]">
                <BarChart3 className="mr-0.5 sm:mr-1 md:mr-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden truncate">Stats</span>
              </TabsTrigger>}
            {canManageUsers && <TabsTrigger value="users" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 sm:py-2 min-h-[32px] sm:min-h-[36px]">
                <Users className="mr-0.5 sm:mr-1 md:mr-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">Users</span>
              </TabsTrigger>}
            {canManageGames && <TabsTrigger value="games" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 sm:py-2 min-h-[32px] sm:min-h-[36px]">
                <GamepadIcon className="mr-0.5 sm:mr-1 md:mr-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">Games</span>
              </TabsTrigger>}
            {canManageResults && <TabsTrigger value="results" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 sm:py-2 min-h-[32px] sm:min-h-[36px]">
                <Calendar className="mr-0.5 sm:mr-1 md:mr-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">Results</span>
              </TabsTrigger>}
            {canManageContent && <TabsTrigger value="website" className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 sm:py-2 min-h-[32px] sm:min-h-[36px]">
                <FileText className="mr-0.5 sm:mr-1 md:mr-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">Website Builder</span>
                <span className="sm:hidden truncate">Site</span>
              </TabsTrigger>}
          </TabsList>

          {canViewAnalytics && <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
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
            </TabsContent>}

          {canManageUsers && <TabsContent value="users" className="space-y-6">
              <UserManagement />
            </TabsContent>}

          {canManageGames && <TabsContent value="games" className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <h2 className="text-lg sm:text-xl font-semibold">Manage Games</h2>
                <Dialog open={isAddGameOpen} onOpenChange={setIsAddGameOpen}>
                  <Button className="gap-2 w-full sm:w-auto" onClick={() => setIsAddGameOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add New Game
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Game</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="game-name">Game Name *</Label>
                        <Input id="game-name" value={gameForm.name} onChange={(e) => setGameForm({ ...gameForm, name: e.target.value })} placeholder="e.g., Daily Lottery" />
                      </div>
                      <div>
                        <Label htmlFor="short-code">Short Code *</Label>
                        <Input id="short-code" value={gameForm.short_code} onChange={(e) => setGameForm({ ...gameForm, short_code: e.target.value })} placeholder="e.g., DL" />
                      </div>
                      <div>
                        <Label htmlFor="scheduled-time">Scheduled Time (24-hour format) *</Label>
                        <Input id="scheduled-time" type="time" value={gameForm.scheduled_time} onChange={(e) => setGameForm({ ...gameForm, scheduled_time: e.target.value })} />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="enabled" checked={gameForm.enabled} onChange={(e) => setGameForm({ ...gameForm, enabled: e.target.checked })} className="h-4 w-4" />
                        <Label htmlFor="enabled">Enable game</Label>
                      </div>
                      <Button onClick={handleAddGame} className="w-full">
                        Add Game
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-3 sm:gap-4">
                {games.map(game => <Card key={game.id}>
                    <CardContent className="p-3 sm:p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base truncate">{game.name}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Code: {game.short_code} • {formatTo12Hour(game.scheduled_time)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={game.enabled ? "default" : "secondary"} className="text-xs">
                              {game.enabled ? "Active" : "Disabled"}
                            </Badge>
                            <Badge variant={game.status === "published" ? "default" : "secondary"} className="text-xs">
                              {game.status === "published" ? "Published" : "Pending"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                          <div className="flex gap-4 w-full sm:w-auto">
                            <div className="text-center flex-1 sm:flex-none">
                              <div className="text-xs text-muted-foreground">Yesterday</div>
                              <div className="text-sm sm:text-lg font-bold">
                                {game.yesterday_result !== undefined && game.yesterday_result !== null ? game.yesterday_result : "--"}
                              </div>
                              {canManageResults && <Button variant="outline" size="sm" onClick={() => openEditYesterdayDialog(game.id, game.yesterday_result)} className="mt-1 w-full sm:w-auto">
                                  <Edit className="h-3 w-3" />
                                </Button>}
                            </div>
                            <div className="text-center flex-1 sm:flex-none">
                              <div className="text-xs text-muted-foreground">Today</div>
                              <div className="text-lg sm:text-xl font-bold">
                                {game.today_result !== undefined && game.today_result !== null ? game.today_result : "--"}
                              </div>
                              {canManageResults && <Button variant="outline" size="sm" onClick={() => openEditDialog(game.id, game.today_result)} disabled={game.today_result === null || game.today_result === undefined} className="mt-1 w-full sm:w-auto">
                                  <Edit className="h-3 w-3" />
                                </Button>}
                            </div>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => openEditGameDialog(game)}>
                              <Edit className="h-3 w-3" />
                              <span className="ml-1">Edit</span>
                            </Button>
                            <Button variant="destructive" size="sm" className="flex-1 sm:flex-none" onClick={() => handleDeleteGame(game.id, game.name)}>
                              <Trash2 className="h-3 w-3" />
                              <span className="ml-1">Delete</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>)}
              </div>
            </TabsContent>}

          {canManageResults && <TabsContent value="results" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h2 className="text-lg sm:text-xl font-semibold">Manage Results</h2>
              <div className="flex flex-col sm:flex-row gap-2">
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
                            {games.filter(game => game.enabled).map(game => <SelectItem key={game.id} value={game.id}>
                                {game.name} ({game.short_code}) - {formatTo12Hour(game.scheduled_time)}
                              </SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="result-input">Result (0-99)</Label>
                        <Input id="result-input" type="number" min="0" max="99" value={newResult} onChange={e => setNewResult(e.target.value)} placeholder="Enter result number" />
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
                        <Input id="edit-result-input" type="number" min="0" max="99" value={editResult} onChange={e => setEditResult(e.target.value)} placeholder="Enter result number" />
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
                        <Input id="edit-yesterday-result-input" type="number" min="0" max="99" value={editYesterdayResult} onChange={e => setEditYesterdayResult(e.target.value)} placeholder="Enter yesterday result number" />
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

                {/* Edit Game Dialog */}
                <Dialog open={isEditGameOpen} onOpenChange={setIsEditGameOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Game</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-game-name">Game Name *</Label>
                        <Input id="edit-game-name" value={editGameForm.name} onChange={(e) => setEditGameForm({ ...editGameForm, name: e.target.value })} placeholder="e.g., Daily Lottery" />
                      </div>
                      <div>
                        <Label htmlFor="edit-short-code">Short Code *</Label>
                        <Input id="edit-short-code" value={editGameForm.short_code} onChange={(e) => setEditGameForm({ ...editGameForm, short_code: e.target.value })} placeholder="e.g., DL" />
                      </div>
                      <div>
                        <Label htmlFor="edit-scheduled-time">Scheduled Time (24-hour format) *</Label>
                        <Input id="edit-scheduled-time" type="time" value={editGameForm.scheduled_time} onChange={(e) => setEditGameForm({ ...editGameForm, scheduled_time: e.target.value })} />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="edit-enabled" checked={editGameForm.enabled} onChange={(e) => setEditGameForm({ ...editGameForm, enabled: e.target.checked })} className="h-4 w-4" />
                        <Label htmlFor="edit-enabled">Enable game</Label>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsEditGameOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleEditGame}>
                          Update Game
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
                  {games.map(game => <div key={game.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
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
                                <Button variant="outline" size="sm" onClick={() => openEditYesterdayDialog(game.id, game.yesterday_result)} className="h-6 w-6 p-0 mt-1">
                                  <Edit className="h-2 w-2" />
                                </Button>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Today</div>
                                <div className="text-lg font-bold">
                                  {game.today_result !== undefined && game.today_result !== null ? game.today_result : "--"}
                                </div>
                                {game.today_result !== undefined && game.today_result !== null && <Button variant="outline" size="sm" onClick={() => openEditDialog(game.id, game.today_result)} className="h-6 w-6 p-0 mt-1">
                                    <Edit className="h-2 w-2" />
                                  </Button>}
                              </div>
                            </div>
                          </div>
                    </div>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>}

          {canManageContent && <TabsContent value="website" className="space-y-6">
              <WebsiteBuilder />
            </TabsContent>}
        </Tabs>
      </div>
    </div>;
};
export default AdminDashboard;