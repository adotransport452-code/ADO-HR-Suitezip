import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Plus, Pencil, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils";

const KEY = "/api/admin/users";

interface Profile {
  id: string;
  email: string;
  fullName?: string;
  role: string;
  createdAt?: string;
}

function useProfiles() {
  const { getToken } = useAuth();
  return useQuery<Profile[]>({
    queryKey: [KEY],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(KEY, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });
}

export default function AdminUsers() {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: profiles, isLoading } = useProfiles();

  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Profile | null>(null);

  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formFullName, setFormFullName] = useState("");
  const [formRole, setFormRole] = useState("user");
  const [formNewPassword, setFormNewPassword] = useState("");

  async function authFetch(url: string, opts: RequestInit = {}) {
    const token = await getToken();
    return fetch(url, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(opts.headers ?? {}),
      },
    });
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await authFetch(KEY, {
        method: "POST",
        body: JSON.stringify({ email: formEmail, password: formPassword, fullName: formFullName, role: formRole }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast({ title: "User created" });
      setAddOpen(false);
      setFormEmail(""); setFormPassword(""); setFormFullName(""); setFormRole("user");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editUser) return;
      const body: any = { fullName: formFullName, role: formRole };
      if (formNewPassword) body.password = formNewPassword;
      const res = await authFetch(`${KEY}/${editUser.id}`, { method: "PATCH", body: JSON.stringify(body) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast({ title: "User updated" });
      setEditUser(null); setFormNewPassword("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`${KEY}/${id}`, { method: "DELETE" });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast({ title: "User deleted" });
      setDeleteConfirm(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function openEdit(p: Profile) {
    setFormFullName(p.fullName ?? "");
    setFormRole(p.role);
    setFormNewPassword("");
    setEditUser(p);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" /> User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Admin panel — manage who can access the portal</p>
        </div>
        <Button onClick={() => { setFormEmail(""); setFormPassword(""); setFormFullName(""); setFormRole("user"); setAddOpen(true); }} data-testid="button-add-user">
          <Plus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Note:</strong> Your very first Admin account must be created via the Supabase dashboard (Authentication → Users → Add User), then given the admin role by running the SQL in <code>supabase/migrations/002_salary_auth.sql</code>.
      </div>

      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading users…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Email</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Role</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(profiles ?? []).length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">No users yet. Add the first user above.</td></tr>
              )}
              {(profiles ?? []).map(p => (
                <tr key={p.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium">{p.fullName || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                      p.role === "admin"
                        ? "bg-purple-100 text-purple-700 border-purple-200"
                        : "bg-blue-100 text-blue-700 border-blue-200"
                    )}>
                      {p.role === "admin" ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm" className="h-7 px-2 rounded-lg" onClick={() => openEdit(p)} data-testid={`button-edit-user-${p.id}`}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 px-2 rounded-lg text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDeleteConfirm(p)} data-testid={`button-delete-user-${p.id}`}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input placeholder="John Doe" value={formFullName} onChange={e => setFormFullName(e.target.value)} data-testid="input-full-name" />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input type="email" placeholder="user@example.com" value={formEmail} onChange={e => setFormEmail(e.target.value)} data-testid="input-user-email" />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" placeholder="Min 6 characters" value={formPassword} onChange={e => setFormPassword(e.target.value)} data-testid="input-user-password" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={formRole} onValueChange={setFormRole}>
                <SelectTrigger data-testid="select-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={() => createMutation.mutate()} disabled={createMutation.isPending} data-testid="button-create-user">
                {createMutation.isPending ? "Creating…" : "Create User"}
              </Button>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={open => !open && setEditUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="text-sm text-muted-foreground">{editUser?.email}</div>
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input placeholder="John Doe" value={formFullName} onChange={e => setFormFullName(e.target.value)} data-testid="input-edit-full-name" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={formRole} onValueChange={setFormRole}>
                <SelectTrigger data-testid="select-edit-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>New Password (leave blank to keep)</Label>
              <Input type="password" placeholder="New password…" value={formNewPassword} onChange={e => setFormNewPassword(e.target.value)} data-testid="input-new-password" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} data-testid="button-update-user">
                {updateMutation.isPending ? "Saving…" : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={open => !open && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete User</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <strong>{deleteConfirm?.email}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="destructive" className="flex-1" onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending} data-testid="button-confirm-delete">
                {deleteMutation.isPending ? "Deleting…" : "Delete User"}
              </Button>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
