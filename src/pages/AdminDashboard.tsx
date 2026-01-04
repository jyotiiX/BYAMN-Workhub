import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ref, get, update, remove } from 'firebase/database';
import { database } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Users,
    Briefcase,
    CheckCircle2,
    XCircle,
    AlertCircle,
    IndianRupee,
    Shield,
    Clock,
    ExternalLink
} from 'lucide-react';
import { approveWorkAndCredit, processMoneyRequest, rejectWorkAndRestoreCampaignBudget } from '@/lib/data-cache';

// Interfaces
interface UserData {
    uid: string;
    fullName: string;
    email: string;
    role: 'user' | 'admin';
    isBlocked: boolean;
    earnedMoney: number;
    addedMoney: number;
    profileImage?: string;
}

interface CampaignData {
    id: string;
    title: string;
    creatorId: string;
    status: 'active' | 'completed' | 'paused';
    totalBudget: number;
    remainingBudget: number;
}

interface WorkData {
    id: string; // workId
    userId: string; // workerId
    campaignId: string;
    campaignTitle: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: number;
    proofUrl?: string;
    reward: number;
}

interface MoneyRequest {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: number;
    type: 'add_money' | 'withdrawal';
    upiTransactionId?: string; // For add money
    upiId?: string; // For withdrawal
    transactionId: string;
}

const AdminDashboard = () => {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [imageUpdateUrl, setImageUpdateUrl] = useState<Record<string, string>>({});

    const [stats, setStats] = useState({
        totalUsers: 0,
        activeCampaigns: 0,
        pendingApprovals: 0,
    });

    const [users, setUsers] = useState<UserData[]>([]);
    const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
    const [pendingWorks, setPendingWorks] = useState<WorkData[]>([]);
    const [moneyRequests, setMoneyRequests] = useState<MoneyRequest[]>([]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Users
            const usersSnap = await get(ref(database, 'users'));
            const usersList: UserData[] = [];
            if (usersSnap.exists()) {
                usersSnap.forEach((child) => {
                    usersList.push(child.val());
                });
            }
            setUsers(usersList);

            // 2. Fetch Campaigns
            const campaignsSnap = await get(ref(database, 'campaigns'));
            const campaignsList: CampaignData[] = [];
            if (campaignsSnap.exists()) {
                campaignsSnap.forEach((child) => {
                    campaignsList.push({ id: child.key, ...child.val() });
                });
            }
            setCampaigns(campaignsList);

            // 3. Fetch Pending Works (Iterate all users' works)
            const worksSnap = await get(ref(database, 'works'));
            const pendingWorksList: WorkData[] = [];
            if (worksSnap.exists()) {
                worksSnap.forEach((userWorks) => {
                    userWorks.forEach((work) => {
                        const w = work.val();
                        if (w.status === 'pending') {
                            pendingWorksList.push({ id: work.key, userId: userWorks.key, ...w });
                        }
                    });
                });
            }
            setPendingWorks(pendingWorksList);

            // 4. Fetch Money Requests
            const addMoneySnap = await get(ref(database, 'adminRequests/addMoney'));
            const withdrawSnap = await get(ref(database, 'adminRequests/withdrawals'));

            const requests: MoneyRequest[] = [];

            if (addMoneySnap.exists()) {
                addMoneySnap.forEach((child) => {
                    const val = child.val();
                    if (val.status === 'pending') {
                        requests.push({ id: child.key, type: 'add_money', ...val });
                    }
                });
            }

            if (withdrawSnap.exists()) {
                withdrawSnap.forEach((child) => {
                    const val = child.val();
                    if (val.status === 'pending') {
                        requests.push({ id: child.key, type: 'withdrawal', ...val });
                    }
                });
            }

            // Sort requests by date
            requests.sort((a, b) => b.createdAt - a.createdAt);
            setMoneyRequests(requests);

            // Update Stats
            setStats({
                totalUsers: usersList.length,
                activeCampaigns: campaignsList.filter(c => c.status === 'active').length,
                pendingApprovals: pendingWorksList.length + requests.length,
            });

        } catch (error) {
            console.error("Error fetching admin data:", error);
            toast({
                title: "Error",
                description: "Failed to load admin dashboard data.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (profile?.role === 'admin') {
            fetchAllData();
        }
    }, [profile]);

    // Actions
    const handleUserAction = async (userId: string, action: 'block' | 'unblock') => {
        try {
            await update(ref(database, `users/${userId}`), {
                isBlocked: action === 'block'
            });
            toast({ title: `User ${action === 'block' ? 'Blocked' : 'Unblocked'} Successfully` });
            fetchAllData();
        } catch (error) {
            toast({ title: "Action Failed", variant: "destructive" });
        }
    };

    const handleProfileImageUpdate = async (userId: string, newImageUrl: string) => {
        try {
            await update(ref(database, `users/${userId}`), {
                profileImage: newImageUrl || null
            });
            toast({ title: "Profile Image Updated Successfully" });
            fetchAllData();
        } catch (error) {
            toast({ title: "Failed to Update Profile Image", variant: "destructive" });
        }
    };

    const handleProfileImageUpdateSubmit = (userId: string) => {
        const imageUrl = imageUpdateUrl[userId] || '';
        handleProfileImageUpdate(userId, imageUrl);
    };

    const handleCampaignAction = async (campaignId: string, action: 'delete' | 'pause' | 'resume') => {
        if (!confirm(`Are you sure you want to ${action} this campaign?`)) return;

        try {
            if (action === 'delete') {
                // Note: Ideally should also refund remaining budget to creator
                await remove(ref(database, `campaigns/${campaignId}`));
            } else {
                await update(ref(database, `campaigns/${campaignId}`), {
                    status: action === 'pause' ? 'paused' : 'active'
                });
            }
            toast({ title: "Campaign Updated" });
            fetchAllData();
        } catch (error) {
            toast({ title: "Action Failed", variant: "destructive" });
        }
    };

    const handleWorkAction = async (work: WorkData, action: 'approve' | 'reject') => {
        try {
            // Validate work data before processing
            if (!work || !work.id || !work.userId || !work.campaignId || typeof work.reward !== 'number' || work.reward <= 0 || work.reward > 10000) {
                toast({ title: "Invalid Work Data", description: "Work data is invalid or incomplete.", variant: "destructive" });
                return;
            }
            
            if (action === 'approve') {
                // Use atomic operation to approve work and credit user
                const success = await approveWorkAndCredit(work.id, work.userId, work.campaignId, work.reward, profile?.uid);
                if (success) {
                    toast({ title: `Work approved and credited` });
                } else {
                    toast({ title: "Work approval failed", variant: "destructive" });
                    return;
                }
            } else {
                // Use atomic operation to reject work and restore campaign budget
                const success = await rejectWorkAndRestoreCampaignBudget(work.id, work.userId, work.campaignId, profile?.uid);
                if (success) {
                    toast({ title: `Work rejected` });
                } else {
                    toast({ title: "Work rejection failed", variant: "destructive" });
                    return;
                }
            }
            fetchAllData();
        } catch (error) {
            console.error(error);
            toast({ title: "Action Failed", variant: "destructive" });
        }
    };

    const handleMoneyRequest = async (req: MoneyRequest, action: 'approve' | 'reject') => {
        try {
            // Validate request data before processing
            if (!req || !req.id || !req.userId || !req.type || typeof req.amount !== 'number' || req.amount <= 0 || 
                (req.type === 'add_money' && (req.amount < 10 || req.amount > 100000)) ||
                (req.type === 'withdrawal' && (req.amount < 500 || req.amount > 50000))) {
                toast({ title: "Invalid Request Data", description: "Request data is invalid or incomplete.", variant: "destructive" });
                return;
            }
            
            const status = action === 'approve' ? 'approved' : 'rejected';
            const success = await processMoneyRequest(req.id, req.type, req.userId, req.amount, status, profile?.uid);
            if (success) {
                toast({ title: `Request ${action}d` });
            } else {
                toast({ title: "Request processing failed", variant: "destructive" });
                return;
            }
            fetchAllData();
        } catch (error) {
            console.error(error);
            toast({ title: "Action Failed", variant: "destructive" });
        }
    };

    if (profile?.role !== 'admin') {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center">
                <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
                <p>You do not have permission to view this page.</p>
                <Button className="mt-4" onClick={() => window.location.href = '/'}>Go Home</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-8">
                    <Shield className="h-8 w-8 text-primary" />
                    <h1 className="font-display text-3xl font-bold text-foreground">Admin Dashboard</h1>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-pending">{stats.pendingApprovals}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="works" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 lg:w-[600px] mb-8">
                        <TabsTrigger value="works">Work Approvals</TabsTrigger>
                        <TabsTrigger value="money">Money Requests</TabsTrigger>
                        <TabsTrigger value="users">Users</TabsTrigger>
                        <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                    </TabsList>

                    <TabsContent value="works" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pending Work Submissions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {pendingWorks.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">No pending works to review.</p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Campaign</TableHead>
                                                <TableHead>User ID</TableHead>
                                                <TableHead>Reward</TableHead>
                                                <TableHead>Proof</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingWorks.map((work) => (
                                                <TableRow key={work.id}>
                                                    <TableCell>{work.campaignTitle}</TableCell>
                                                    <TableCell className="font-mono text-xs">{work.userId}</TableCell>
                                                    <TableCell>₹{work.reward}</TableCell>
                                                    <TableCell>
                                                        {work.proofUrl && (
                                                            <a href={work.proofUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                                                                View <ExternalLink className="h-3 w-3" />
                                                            </a>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => handleWorkAction(work, 'approve')}>Approve</Button>
                                                            <Button size="sm" variant="destructive" onClick={() => handleWorkAction(work, 'reject')}>Reject</Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="money" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Financial Requests</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {moneyRequests.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">No pending requests.</p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Type</TableHead>
                                                <TableHead>User</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Details</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {moneyRequests.map((req) => (
                                                <TableRow key={req.id}>
                                                    <TableCell>
                                                        <Badge variant={req.type === 'add_money' ? 'default' : 'outline'}>
                                                            {req.type === 'add_money' ? 'Add Money' : 'Withdrawal'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{req.userName}</span>
                                                            <span className="text-xs text-muted-foreground">{req.userEmail}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-bold">₹{req.amount}</TableCell>
                                                    <TableCell>
                                                        {req.type === 'add_money' ? (
                                                            <div className="text-xs">
                                                                <span className="text-muted-foreground">Txn ID:</span>
                                                                <span className="ml-1 font-mono">{req.upiTransactionId}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs">
                                                                <span className="text-muted-foreground">UPI:</span>
                                                                <span className="ml-1 font-mono">{req.upiId}</span>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => handleMoneyRequest(req, 'approve')}>
                                                                {req.type === 'add_money' ? 'Confirm' : 'Paid'}
                                                            </Button>
                                                            <Button size="sm" variant="destructive" onClick={() => handleMoneyRequest(req, 'reject')}>Reject</Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="users" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>User Management</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user) => (
                                            <TableRow key={user.uid}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{user.fullName || 'No Name'}</span>
                                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{user.role}</TableCell>
                                                <TableCell>
                                                    {user.isBlocked ? (
                                                        <Badge variant="destructive">Blocked</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-success/10 text-success">Active</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {user.role !== 'admin' && (
                                                        <div className="flex flex-col gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant={user.isBlocked ? "outline" : "destructive"}
                                                                onClick={() => handleUserAction(user.uid, user.isBlocked ? 'unblock' : 'block')}
                                                            >
                                                                {user.isBlocked ? "Unblock" : "Block"}
                                                            </Button>
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button size="sm" variant="outline">
                                                                        Update Image
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent>
                                                                    <DialogHeader>
                                                                        <DialogTitle>Update Profile Image</DialogTitle>
                                                                        <DialogDescription>
                                                                            Enter a new profile image URL for {user.fullName}
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    <div className="space-y-4 mt-4">
                                                                        <div className="space-y-2">
                                                                            <Label htmlFor="profileImage">Profile Image URL</Label>
                                                                            <Input
                                                                                id="profileImage"
                                                                                placeholder="https://example.com/image.jpg"
                                                                                defaultValue={user.profileImage || ''}
                                                                                onChange={(e) => setImageUpdateUrl(prev => ({
                                                                                    ...prev,
                                                                                    [user.uid]: e.target.value
                                                                                }))}
                                                                            />
                                                                        </div>
                                                                        <Button 
                                                                            onClick={() => handleProfileImageUpdateSubmit(user.uid)}
                                                                            className="w-full"
                                                                        >
                                                                            Update Image
                                                                        </Button>
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="campaigns" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Campaign Management</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Budget</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {campaigns.map((camp) => (
                                            <TableRow key={camp.id}>
                                                <TableCell>{camp.title}</TableCell>
                                                <TableCell>
                                                    <div className="text-xs">
                                                        <p>Total: ₹{camp.totalBudget}</p>
                                                        <p>Left: ₹{camp.remainingBudget}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={camp.status === 'active' ? 'default' : 'secondary'}>{camp.status}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Button size="sm" variant="destructive" onClick={() => handleCampaignAction(camp.id, 'delete')}>Delete</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
            <Footer />
        </div>
    );
};

export default AdminDashboard;