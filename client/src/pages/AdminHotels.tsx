import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Hotel, InsertHotel } from "@shared/schema";

export default function AdminHotels() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  
  const [formData, setFormData] = useState<Partial<InsertHotel>>({
    name: "",
    address: "",
    zone: "",
    isActive: true,
  });

  const { data: hotels, isLoading } = useQuery<Hotel[]>({
    queryKey: ["/api/admin/hotels"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertHotel) => {
      const response = await apiRequest("POST", "/api/admin/hotels", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hotels"] });
      toast({ title: "Hotel created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create hotel", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertHotel> }) => {
      const response = await apiRequest("PATCH", `/api/admin/hotels/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hotels"] });
      toast({ title: "Hotel updated successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update hotel", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/hotels/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hotels"] });
      toast({ title: "Hotel deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete hotel", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      zone: "",
      isActive: true,
    });
    setEditingHotel(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({ 
        title: "Name is required", 
        variant: "destructive" 
      });
      return;
    }
    
    if (editingHotel) {
      updateMutation.mutate({ id: editingHotel.id, data: formData });
    } else {
      createMutation.mutate(formData as InsertHotel);
    }
  };

  const handleEdit = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setFormData({
      name: hotel.name,
      address: hotel.address || "",
      zone: hotel.zone || "",
      isActive: hotel.isActive,
    });
    setIsDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold">Hotels</h1>
            <p className="text-muted-foreground mt-1">Manage pickup/dropoff hotel locations</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-hotel">
                <Plus className="w-4 h-4 mr-2" />
                Add Hotel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingHotel ? "Edit Hotel" : "Add New Hotel"}</DialogTitle>
                <DialogDescription>
                  {editingHotel ? "Update hotel information" : "Add a new hotel to the booking options"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Hotel Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="name"
                    data-testid="input-hotel-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Sandals Grande St. Lucian"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    data-testid="input-hotel-address"
                    value={formData.address || ""}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Pigeon Island Causeway, Gros Islet"
                  />
                </div>
                
                <div>
                  <Label htmlFor="zone">Zone</Label>
                  <Input
                    id="zone"
                    data-testid="input-hotel-zone"
                    value={formData.zone || ""}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    placeholder="North, South, Rodney Bay, etc."
                  />
                </div>
                
                <div className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <Label htmlFor="isActive" className="font-medium">Hotel Status</Label>
                    <p className="text-sm text-muted-foreground">
                      {formData.isActive ? "Visible in booking form" : "Hidden from booking form"}
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    data-testid="switch-active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
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
                    : editingHotel ? "Update Hotel" : "Create Hotel"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Hotels</CardTitle>
            <CardDescription>
              {hotels?.length || 0} hotel{hotels?.length !== 1 ? "s" : ""} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : !hotels || hotels.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hotels found. Add your first hotel to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hotel Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hotels.map((hotel) => (
                    <TableRow key={hotel.id} data-testid={`row-hotel-${hotel.id}`}>
                      <TableCell className="font-medium">{hotel.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {hotel.address || "-"}
                      </TableCell>
                      <TableCell>
                        {hotel.zone ? (
                          <Badge variant="outline">{hotel.zone}</Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={hotel.isActive ? "default" : "secondary"}>
                          {hotel.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-edit-${hotel.id}`}
                            onClick={() => handleEdit(hotel)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-delete-${hotel.id}`}
                            onClick={() => deleteMutation.mutate(hotel.id)}
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
