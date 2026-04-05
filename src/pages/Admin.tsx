import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Shield, UserCheck, UserX, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type UserRole = {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  approved: boolean;
  created_at: string;
};

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
};

type DeleteRequest = {
  id: string;
  requested_by: string;
  table_name: string;
  record_id: string;
  status: string;
  created_at: string;
};

export default function Admin() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [deleteRequests, setDeleteRequests] = useState<DeleteRequest[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    // Check if current user is admin
    const { data: adminCheck } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' } as any);
    setIsAdmin(!!adminCheck);

    // Load roles
    const { data: rolesData } = await supabase.from('user_roles').select('*').order('created_at', { ascending: false });
    setRoles((rolesData as any[]) || []);

    // Load profiles
    const { data: profilesData } = await supabase.from('profiles').select('*');
    setProfiles((profilesData as any[]) || []);

    // Load delete requests
    const { data: delReqs } = await supabase.from('delete_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false });
    setDeleteRequests((delReqs as any[]) || []);

    setLoading(false);
  };

  const getProfileInfo = (userId: string) => {
    const p = profiles.find(pr => pr.id === userId);
    return p ? (p.full_name || p.email || 'Unknown') : 'Unknown';
  };

  const handleApprove = async (roleId: string) => {
    const { error } = await supabase.from('user_roles').update({ approved: true } as any).eq('id', roleId);
    if (error) { toast.error('Failed to approve'); return; }
    toast.success('Member approved!');
    loadData();
  };

  const handleReject = async (roleId: string) => {
    const { error } = await supabase.from('user_roles').delete().eq('id', roleId);
    if (error) { toast.error('Failed to reject'); return; }
    toast.success('Request rejected');
    loadData();
  };

  const handlePromoteToAdmin = async (userId: string) => {
    const { error } = await supabase.from('user_roles').update({ role: 'admin' } as any).eq('user_id', userId);
    if (error) { toast.error('Failed to promote'); return; }
    toast.success('Promoted to admin!');
    loadData();
  };

  const handleApproveDelete = async (req: DeleteRequest) => {
    // Perform the actual delete
    const { error: delError } = await supabase.from(req.table_name as any).delete().eq('id', req.record_id);
    if (delError) { toast.error('Failed to delete record'); return; }
    // Update request status
    await supabase.from('delete_requests').update({ status: 'approved' } as any).eq('id', req.id);
    toast.success('Delete approved and executed');
    loadData();
  };

  const handleRejectDelete = async (reqId: string) => {
    await supabase.from('delete_requests').update({ status: 'rejected' } as any).eq('id', reqId);
    toast.success('Delete request rejected');
    loadData();
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-20 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Admin Access Required</h2>
        <p className="text-muted-foreground">You don't have admin privileges. Contact your administrator.</p>
      </div>
    );
  }

  const pendingMembers = roles.filter(r => !r.approved);
  const approvedMembers = roles.filter(r => r.approved);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Pending Approvals */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <UserCheck className="w-4 h-4" /> Pending Member Approvals ({pendingMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No pending approvals</p>
          ) : (
            <div className="space-y-2">
              {pendingMembers.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{getProfileInfo(r.user_id)}</p>
                    <p className="text-xs text-muted-foreground">Requested: {new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default" className="gap-1" onClick={() => handleApprove(r.id)}>
                      <Check className="w-3 h-3" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleReject(r.id)}>
                      <X className="w-3 h-3" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Members */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4" /> Active Members ({approvedMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {approvedMembers.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{getProfileInfo(r.user_id)}</p>
                  <Badge variant={r.role === 'admin' ? 'default' : 'secondary'} className="text-[10px]">
                    {r.role}
                  </Badge>
                  {r.user_id === currentUserId && (
                    <Badge variant="outline" className="text-[10px]">You</Badge>
                  )}
                </div>
                {r.role !== 'admin' && r.user_id !== currentUserId && (
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => handlePromoteToAdmin(r.user_id)}>
                    Make Admin
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete Requests */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Pending Delete Requests ({deleteRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deleteRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No pending delete requests</p>
          ) : (
            <div className="space-y-2">
              {deleteRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Delete from {req.table_name}</p>
                    <p className="text-xs text-muted-foreground">
                      By: {getProfileInfo(req.requested_by)} • {new Date(req.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleApproveDelete(req)}>
                      <Check className="w-3 h-3" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => handleRejectDelete(req.id)}>
                      <X className="w-3 h-3" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
