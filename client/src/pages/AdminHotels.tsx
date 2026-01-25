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
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Building2, DollarSign, ArrowUpDown } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Hotel, InsertHotel, Zone, Port } from "@shared/schema";

interface PortWithRate extends Port {
  price: string | null;
}

export default function AdminHotels() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [isPricingDialogOpen, setIsPricingDialogOpen] = useState(false);
  const [pricingHotel, setPricingHotel] = useState<Hotel | null>(null);
  const [portRates, setPortRates] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{ key: keyof Hotel; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  
  const [formData, setFormData] = useState<Partial<InsertHotel>>({
    name: "",
    address: "",
    zoneId: "",
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      zoneId: "",
      isActive: true,
    });
    setEditingHotel(null);
  };

  const { data: hotels, isLoading } = useQuery<Hotel[]>({
    queryKey: ["/api/admin/hotels"],
  });

  const { data: zones } = useQuery<Zone[]>({
    queryKey: ["/api/zones"],
  });

  const { data: portsWithRates, isLoading: isLoadingPorts } = useQuery<PortWithRate[]>({
    queryKey: [`/api/admin/hotels/${pricingHotel?.id}/port-rates`],
    enabled: !!pricingHotel,
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

  const savePortRatesMutation = useMutation({
    mutationFn: async ({ hotelId, rates }: { hotelId: string; rates: { portId: string; price: string }[] }) => {
      const response = await apiRequest("POST", `/api/admin/hotels/${hotelId}/port-rates`, { rates });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/hotels/${pricingHotel?.id}/port-rates`] });
      toast({ title: "Port prices saved successfully" });
      setIsPricingDialogOpen(false);
      setPricingHotel(null);
      setPortRates({});
    },
    onError: () => {
      toast({ title: "Failed to save port prices", variant: "destructive" });
    },
  });

  const handleOpenPricing = (hotel: Hotel) => {
    setPricingHotel(hotel);
    setPortRates({});
    setIsPricingDialogOpen(true);
  };

  const handleSavePortRates = () => {
    if (!pricingHotel) return;
    
    const rates = Object.entries(portRates)
      .filter(([_, price]) => price !== "" && price !== null)
      .map(([portId, price]) => ({ portId, price }));
    
    savePortRatesMutation.mutate({ hotelId: pricingHotel.id, rates });
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
      zoneId: hotel.zoneId || "",
      isActive: hotel.isActive,
    });
    setIsDialogOpen(true);
  };

  const getZoneName = (zoneId: string | null) => {
    if (!zoneId || !zones) return null;
    const zone = zones.find((z) => z.id === zoneId);
    return zone?.name || null;
  };

  const sortedHotels = hotels ? [...hotels].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const valA = a[key];
    const valB = b[key];

    if (valA === null || valA === undefined) return direction === 'asc' ? 1 : -1;
    if (valB === null || valB === undefined) return direction === 'asc' ? -1 : 1;

    if (typeof valA === 'string' && typeof valB === 'string') {
      const comparison = valA.localeCompare(valB);
      return direction === 'asc' ? comparison : -comparison;
    }

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  }) : [];

  const handleSort = (key: keyof Hotel) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold">Hotels</h1>
            <p className="text-muted-foreground mt-1">Manage pickup/dropoff hotel locations</p>
          </div>
          <div className="flex gap-2">
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
                  <Label htmlFor="zone">Zone <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.zoneId || ""}
                    onValueChange={(value) => setFormData({ ...formData, zoneId: value })}
                  >
                    <SelectTrigger id="zone" data-testid="select-hotel-zone">
                      <SelectValue placeholder="Select a zone..." />
                    </SelectTrigger>
                    <SelectContent>
                      {zones?.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-2">
                        Hotel Name
                        <ArrowUpDown className="w-4 h-4 opacity-50" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('address')}>
                      <div className="flex items-center gap-2">
                        Address
                        <ArrowUpDown className="w-4 h-4 opacity-50" />
                      </div>
                    </TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedHotels.map((hotel) => {
                    const zoneName = getZoneName(hotel.zoneId);
                    return (
                      <TableRow key={hotel.id} data-testid={`row-hotel-${hotel.id}`}>
                        <TableCell className="font-medium">{hotel.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {hotel.address || "-"}
                        </TableCell>
                        <TableCell>
                          {zoneName ? (
                            <Badge variant="outline">{zoneName}</Badge>
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
                              data-testid={`button-pricing-${hotel.id}`}
                              onClick={() => handleOpenPricing(hotel)}
                              title="Set port prices"
                            >
                              <DollarSign className="w-4 h-4" />
                            </Button>
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
                              onClick={() => {
                                if (window.confirm("Are you sure you want to delete this hotel?")) {
                                  deleteMutation.mutate(hotel.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isPricingDialogOpen} onOpenChange={(open) => {
          setIsPricingDialogOpen(open);
          if (!open) {
            setPricingHotel(null);
            setPortRates({});
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Port Pricing</DialogTitle>
              <DialogDescription>
                Set fixed rates for {pricingHotel?.name} from each arrival port
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {isLoadingPorts ? (
                <div className="text-center py-4">Loading ports...</div>
              ) : (
                portsWithRates?.map((port) => (
                  <div key={port.id} className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={`port-${port.id}`} className="col-span-2">
                      {port.name}
                    </Label>
                    <div className="col-span-2 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input
                        id={`port-${port.id}`}
                        type="number"
                        className="pl-7"
                        placeholder="0.00"
                        value={portRates[port.id] ?? port.price ?? ""}
                        onChange={(e) => setPortRates({ ...portRates, [port.id]: e.target.value })}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <Button 
              onClick={handleSavePortRates}
              disabled={savePortRatesMutation.isPending}
              className="w-full"
            >
              {savePortRatesMutation.isPending ? "Saving..." : "Save Prices"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
