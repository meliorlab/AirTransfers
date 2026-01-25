import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, UserCog } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setEditingUser(null);
  };

  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: currentAdmin } = useQuery<{ id: string }>({
    queryKey: ["/api/admin/me"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { username: string; email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/admin/users", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Admin user created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: error.message || "Failed to create admin user", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { username?: string; email?: string; password?: string } }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Admin user updated successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: error.message || "Failed to update admin user", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Admin user deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: error.message || "Failed to delete admin user", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.email) {
      toast({ 
        title: "Username and email are required", 
        variant: "destructive" 
      });
      return;
    }
    
    if (!editingUser && !formData.password) {
      toast({ 
        title: "Password is required for new users", 
        variant: "destructive" 
      });
      return;
    }
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast({ 
        title: "Passwords do not match", 
        variant: "destructive" 
      });
      return;
    }
    
    if (formData.password && formData.password.length < 6) {
      toast({ 
        title: "Password must be at least 6 characters", 
        variant: "destructive" 
      });
      return;
    }
    
    if (editingUser) {
      const updateData: { username?: string; email?: string; password?: string } = {
        username: formData.username,
        email: formData.email,
      };
      if (formData.password) {
        updateData.password = formData.password;
      }
      updateMutation.mutate({ id: editingUser.id, data: updateData });
    } else {
      createMutation.mutate({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
    }
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      confirmPassword: "",
    });
    setIsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold">Admin Users</h1>
            <p className="text-muted-foreground mt-1">Manage administrator accounts</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-user">
                <Plus className="w-4 h-4 mr-2" />
                Add Admin User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? "Edit Admin User" : "Add New Admin User"}</DialogTitle>
                <DialogDescription>
                  {editingUser ? "Update admin user details" : "Create a new administrator account"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="username">Username <span className="text-destructive">*</span></Label>
                  <Input
                    id="username"
                    data-testid="input-username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="johndoe"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                  <Input
                    id="email"
                    data-testid="input-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">
                    Password {!editingUser && <span className="text-destructive">*</span>}
                    {editingUser && <span className="text-muted-foreground text-xs ml-1">(leave blank to keep current)</span>}
                  </Label>
                  <Input
                    id="password"
                    data-testid="input-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? "Enter new password" : "Enter password"}
                    required={!editingUser}
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">
                    Confirm Password {formData.password && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="confirmPassword"
                    data-testid="input-confirm-password"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm password"
                    required={!!formData.password}
                  />
                </div>
                
                <Button
                  type="submit"
                  data-testid="button-submit"
                  className="w-full"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending 
                    ? "Saving..." 
                    : editingUser ? "Update User" : "Create User"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Admin Users</CardTitle>
            <CardDescription>
              {users?.length || 0} administrator{users?.length !== 1 ? "s" : ""} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : !users || users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserCog className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No admin users found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell className="font-medium">
                        {user.username}
                        {currentAdmin?.id === user.id && (
                          <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                        )}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-edit-${user.id}`}
                            onClick={() => handleEdit(user)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-delete-${user.id}`}
                            disabled={currentAdmin?.id === user.id}
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this admin user?")) {
                                deleteMutation.mutate(user.id);
                              }
                            }}
                            title={currentAdmin?.id === user.id ? "Cannot delete your own account" : "Delete user"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
