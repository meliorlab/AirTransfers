import { useState, useRef } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Pencil, Trash2, Upload, User, Car } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Driver, InsertDriver } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

const vehicleClassLabels: Record<string, string> = {
  standard: "Standard",
  luxury: "Luxury",
  minivan: "Minivan",
};

export default function AdminDrivers() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const driverPhotoInputRef = useRef<HTMLInputElement>(null);
  const vehiclePhotoInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<InsertDriver>>({
    name: "",
    email: "",
    phone: "",
    vehicleClass: "standard",
    vehicleDetails: "",
    vehicleNumber: "",
    vehiclePhotoUrl: "",
    driverPhotoUrl: "",
    bankName: "",
    accountNumber: "",
    bankAddress: "",
    isActive: true,
  });

  const { data: drivers, isLoading } = useQuery<Driver[]>({
    queryKey: ["/api/admin/drivers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertDriver) => {
      const response = await apiRequest("POST", "/api/admin/drivers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/drivers"] });
      toast({ title: "Driver created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create driver", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertDriver> }) => {
      const response = await apiRequest("PATCH", `/api/admin/drivers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/drivers"] });
      toast({ title: "Driver updated successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update driver", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/drivers/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/drivers"] });
      toast({ title: "Driver deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete driver", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      vehicleClass: "standard",
      vehicleDetails: "",
      vehicleNumber: "",
      vehiclePhotoUrl: "",
      driverPhotoUrl: "",
      bankName: "",
      accountNumber: "",
      bankAddress: "",
      isActive: true,
    });
    setEditingDriver(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone || !formData.vehicleClass) {
      toast({ 
        title: "Required fields missing", 
        description: "Please fill in all required fields",
        variant: "destructive" 
      });
      return;
    }
    
    if (editingDriver) {
      updateMutation.mutate({ id: editingDriver.id, data: formData });
    } else {
      createMutation.mutate(formData as InsertDriver);
    }
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      vehicleClass: driver.vehicleClass,
      vehicleDetails: driver.vehicleDetails || "",
      vehicleNumber: driver.vehicleNumber || "",
      vehiclePhotoUrl: driver.vehiclePhotoUrl || "",
      driverPhotoUrl: driver.driverPhotoUrl || "",
      bankName: driver.bankName || "",
      accountNumber: driver.accountNumber || "",
      bankAddress: driver.bankAddress || "",
      isActive: driver.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'driverPhotoUrl' | 'vehiclePhotoUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData({ ...formData, [field]: base64 });
    };
    reader.readAsDataURL(file);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold">Drivers</h1>
            <p className="text-muted-foreground mt-1">Manage driver accounts</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-driver">
                <Plus className="w-4 h-4 mr-2" />
                Add Driver
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>{editingDriver ? "Edit Driver" : "Add New Driver"}</DialogTitle>
                <DialogDescription>
                  {editingDriver ? "Update driver information" : "Create a new driver account"}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] pr-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                      <Input
                        id="name"
                        data-testid="input-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
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
                        placeholder="driver@example.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
                      <Input
                        id="phone"
                        data-testid="input-phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 555-123-4567"
                        required
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label htmlFor="vehicleClass">Vehicle Class <span className="text-destructive">*</span></Label>
                      <Select 
                        value={formData.vehicleClass || "standard"} 
                        onValueChange={(value) => setFormData({ ...formData, vehicleClass: value })}
                      >
                        <SelectTrigger data-testid="select-vehicle-class">
                          <SelectValue placeholder="Select vehicle class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="luxury">Luxury</SelectItem>
                          <SelectItem value="minivan">Minivan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="vehicleDetails">Vehicle Details</Label>
                      <Input
                        id="vehicleDetails"
                        data-testid="input-vehicle-details"
                        value={formData.vehicleDetails || ""}
                        onChange={(e) => setFormData({ ...formData, vehicleDetails: e.target.value })}
                        placeholder="Black Toyota Camry"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="vehicleNumber">Vehicle #</Label>
                      <Input
                        id="vehicleNumber"
                        data-testid="input-vehicle-number"
                        value={formData.vehicleNumber || ""}
                        onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                        placeholder="ABC-1234"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label>Driver Photo</Label>
                      <div className="mt-2 flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={formData.driverPhotoUrl || undefined} />
                          <AvatarFallback>
                            <User className="h-8 w-8 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <input
                            ref={driverPhotoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'driverPhotoUrl')}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => driverPhotoInputRef.current?.click()}
                            data-testid="button-upload-driver-photo"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Photo
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">
                            Max 5MB, JPG/PNG
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <Label>Vehicle Photo</Label>
                      <div className="mt-2 flex items-center gap-4">
                        <div className="h-16 w-24 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                          {formData.vehiclePhotoUrl ? (
                            <img 
                              src={formData.vehiclePhotoUrl} 
                              alt="Vehicle" 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Car className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            ref={vehiclePhotoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'vehiclePhotoUrl')}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => vehiclePhotoInputRef.current?.click()}
                            data-testid="button-upload-vehicle-photo"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Photo
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">
                            Max 5MB, JPG/PNG
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-2 border-t pt-4 mt-2">
                      <Label className="text-base font-medium">Bank Details</Label>
                      <p className="text-sm text-muted-foreground mb-3">Payment information for driver compensation</p>
                    </div>
                    
                    <div className="col-span-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        data-testid="input-bank-name"
                        value={formData.bankName || ""}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        placeholder="Bank of St. Lucia"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input
                        id="accountNumber"
                        data-testid="input-account-number"
                        value={formData.accountNumber || ""}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        placeholder="1234567890"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="bankAddress">Bank Address</Label>
                      <Input
                        id="bankAddress"
                        data-testid="input-bank-address"
                        value={formData.bankAddress || ""}
                        onChange={(e) => setFormData({ ...formData, bankAddress: e.target.value })}
                        placeholder="123 Main Street, Castries"
                      />
                    </div>
                    
                    <div className="col-span-2 flex items-center justify-between border rounded-md p-3">
                      <div>
                        <Label htmlFor="isActive" className="font-medium">Driver Status</Label>
                        <p className="text-sm text-muted-foreground">
                          {formData.isActive ? "Driver is active and available" : "Driver is inactive"}
                        </p>
                      </div>
                      <Switch
                        id="isActive"
                        data-testid="switch-active"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    data-testid="button-submit"
                    className="w-full"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending 
                      ? "Saving..." 
                      : editingDriver ? "Update Driver" : "Create Driver"}
                  </Button>
                </form>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Drivers</CardTitle>
            <CardDescription>
              {drivers?.length || 0} driver{drivers?.length !== 1 ? "s" : ""} registered
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : !drivers || drivers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No drivers found. Add your first driver to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver) => (
                    <TableRow key={driver.id} data-testid={`row-driver-${driver.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={driver.driverPhotoUrl || undefined} />
                            <AvatarFallback>
                              {driver.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{driver.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{driver.email}</div>
                        <div className="text-xs text-muted-foreground">{driver.phone}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <Badge variant="outline" className="mb-1">
                            {vehicleClassLabels[driver.vehicleClass] || driver.vehicleClass}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {driver.vehicleDetails || "No details"}
                          {driver.vehicleNumber && ` • ${driver.vehicleNumber}`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={driver.isActive ? "default" : "secondary"}>
                          {driver.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-edit-${driver.id}`}
                            onClick={() => handleEdit(driver)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-delete-${driver.id}`}
                            onClick={() => deleteMutation.mutate(driver.id)}
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
