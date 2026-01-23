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
import { Plus, Pencil, Trash2, Building2, DollarSign, Upload, FileSpreadsheet, AlertCircle, ArrowUpDown } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Hotel, InsertHotel, Zone, Port } from "@shared/schema";

interface PortWithRate extends Port {
  price: string | null;
}

interface BulkImportResult {
  created: number;
  errors: { row: number; name: string; error: string }[];
}

interface RateImportResult {
  created: number;
  updated: number;
  errors: { row: number; name: string; error: string }[];
}

export default function AdminHotels() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [isPricingDialogOpen, setIsPricingDialogOpen] = useState(false);
  const [pricingHotel, setPricingHotel] = useState<Hotel | null>(null);
  const [portRates, setPortRates] = useState<Record<string, string>>({});
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [csvContent, setCsvContent] = useState("");
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [isRateImportDialogOpen, setIsRateImportDialogOpen] = useState(false);
  const [rateCsvContent, setRateCsvContent] = useState("");
  const [rateImportResult, setRateImportResult] = useState<RateImportResult | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Hotel; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  
  const [formData, setFormData] = useState<Partial<InsertHotel>>({
    name: "",
    address: "",
    zoneId: "",
    isActive: true,
  });

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

  const bulkImportMutation = useMutation({
    mutationFn: async (hotels: { name: string; address: string; zone: string }[]) => {
      const response = await apiRequest("POST", "/api/admin/hotels/bulk-import", { hotels });
      return response.json();
    },
    onSuccess: (data: BulkImportResult) => {
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hotels"] });
      if (data.created > 0) {
        toast({ title: `Successfully imported ${data.created} hotels` });
      }
      if (data.errors.length > 0) {
        toast({ 
          title: `${data.errors.length} rows had errors`, 
          variant: "destructive" 
        });
      }
    },
    onError: () => {
      toast({ title: "Failed to import hotels", variant: "destructive" });
    },
  });

  const parseCSV = (csv: string): { name: string; address: string; zone: string }[] => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const nameIndex = headers.findIndex(h => h === 'name' || h === 'hotel name' || h === 'hotel');
    const addressIndex = headers.findIndex(h => h === 'address' || h === 'location');
    const zoneIndex = headers.findIndex(h => h === 'zone' || h === 'area' || h === 'region');
    
    if (nameIndex === -1) return [];
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      return {
        name: values[nameIndex] || '',
        address: addressIndex !== -1 ? values[addressIndex] || '' : '',
        zone: zoneIndex !== -1 ? values[zoneIndex] || '' : '',
      };
    }).filter(row => row.name);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvContent(text);
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    const hotels = parseCSV(csvContent);
    if (hotels.length === 0) {
      toast({ 
        title: "No valid rows found", 
        description: "Make sure your CSV has a 'name' column",
        variant: "destructive" 
      });
      return;
    }
    bulkImportMutation.mutate(hotels);
  };

  const resetImportDialog = () => {
    setCsvContent("");
    setImportResult(null);
  };

  // Rate import functions
  const bulkImportRatesMutation = useMutation({
    mutationFn: async (rates: { name: string; rateFromUVF: string; rateFromGFL: string; rateFromPortCastries: string }[]) => {
      const response = await apiRequest("POST", "/api/admin/hotels/bulk-import-rates", { rates });
      return response.json();
    },
    onSuccess: (data: RateImportResult) => {
      setRateImportResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hotels"] });
      if (data.created > 0 || data.updated > 0) {
        toast({ 
          title: `Successfully imported ${data.created + data.updated} rates`,
          description: `${data.created} new, ${data.updated} updated`
        });
      }
      if (data.errors.length > 0) {
        toast({ 
          title: `${data.errors.length} rows had errors`, 
          variant: "destructive" 
        });
      }
    },
    onError: () => {
      toast({ title: "Failed to import rates", variant: "destructive" });
    },
  });

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  const parseRatesCSV = (csv: string): { name: string; rateFromUVF: string; rateFromGFL: string; rateFromPortCastries: string }[] => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
    const nameIndex = headers.findIndex(h => h === 'name' || h === 'hotel name' || h === 'hotel');
    const uvfIndex = headers.findIndex(h => h.includes('uvf') || h.includes('hewanorra'));
    const gflIndex = headers.findIndex(h => h.includes('gfl') || h.includes('slu') || h.includes('george'));
    const portCastriesIndex = headers.findIndex(h => h.includes('port_castries') || h.includes('port castries') || (h.includes('castries') && !h.includes('port')));
    
    if (nameIndex === -1) return [];
    
    return lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      return {
        name: values[nameIndex] || '',
        rateFromUVF: uvfIndex !== -1 ? values[uvfIndex] || '' : '',
        rateFromGFL: gflIndex !== -1 ? values[gflIndex] || '' : '',
        rateFromPortCastries: portCastriesIndex !== -1 ? values[portCastriesIndex] || '' : '',
      };
    }).filter(row => row.name);
  };

  const handleRateFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRateCsvContent(text);
      setRateImportResult(null);
    };
    reader.readAsText(file);
  };

  const handleRateImport = () => {
    const rates = parseRatesCSV(rateCsvContent);
    if (rates.length === 0) {
      toast({ 
        title: "No valid rows found", 
        description: "Make sure your CSV has a 'name' column and rate columns",
        variant: "destructive" 
      });
      return;
    }
    bulkImportRatesMutation.mutate(rates);
  };

  const resetRateImportDialog = () => {
    setRateCsvContent("");
    setRateImportResult(null);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      zoneId: "",
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
            <Button 
              variant="outline" 
              data-testid="button-import-hotels"
              onClick={() => setIsImportDialogOpen(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Hotels
            </Button>
            <Button 
              variant="outline" 
              data-testid="button-import-rates"
              onClick={() => setIsRateImportDialogOpen(true)}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Import Rates
            </Button>
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
                              onClick={() => deleteMutation.mutate(hotel.id)}
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
                Set transfer prices from each port to {pricingHotel?.name}
              </DialogDescription>
            </DialogHeader>
            {isLoadingPorts ? (
              <div className="text-center py-4 text-muted-foreground">Loading ports...</div>
            ) : (
              <div className="space-y-4">
                {portsWithRates?.map((port) => (
                  <div key={port.id} className="space-y-2">
                    <Label htmlFor={`port-${port.id}`} className="flex items-center justify-between">
                      <span>{port.name}</span>
                      <Badge variant="outline" className="text-xs">{port.code}</Badge>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id={`port-${port.id}`}
                        data-testid={`input-port-price-${port.code}`}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={port.price || "Not set"}
                        value={portRates[port.id] ?? (port.price || "")}
                        onChange={(e) => setPortRates({ ...portRates, [port.id]: e.target.value })}
                        className="pl-7"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  className="w-full"
                  data-testid="button-save-port-rates"
                  onClick={handleSavePortRates}
                  disabled={savePortRatesMutation.isPending}
                >
                  {savePortRatesMutation.isPending ? "Saving..." : "Save Port Prices"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
          setIsImportDialogOpen(open);
          if (!open) resetImportDialog();
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Import Hotels from CSV
              </DialogTitle>
              <DialogDescription>
                Upload a CSV file with columns: name, address, zone
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                  data-testid="input-csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {csvContent ? "File loaded - click to replace" : "Click to select CSV file"}
                  </p>
                </label>
              </div>

              {csvContent && (
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-sm font-medium mb-1">Preview</p>
                  <p className="text-xs text-muted-foreground">
                    {parseCSV(csvContent).length} hotels found in file
                  </p>
                </div>
              )}

              {importResult && (
                <div className="space-y-2">
                  {importResult.created > 0 && (
                    <div className="bg-primary/10 rounded-md p-3">
                      <p className="text-sm text-primary font-medium">
                        Successfully imported {importResult.created} hotels
                      </p>
                    </div>
                  )}
                  {importResult.errors.length > 0 && (
                    <div className="bg-destructive/10 rounded-md p-3 space-y-1">
                      <p className="text-sm text-destructive font-medium flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {importResult.errors.length} errors
                      </p>
                      <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                        {importResult.errors.map((err, i) => (
                          <p key={i} className="text-destructive/80">
                            Row {err.row}: {err.name} - {err.error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-muted/30 rounded-md p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>CSV Format:</strong> The file should have headers like "name", "address", "zone". 
                  Zone names must match exactly with existing zones in the system.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsImportDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  data-testid="button-import-submit"
                  onClick={handleImport}
                  disabled={!csvContent || bulkImportMutation.isPending}
                >
                  {bulkImportMutation.isPending ? "Importing..." : "Import Hotels"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isRateImportDialogOpen} onOpenChange={(open) => {
          setIsRateImportDialogOpen(open);
          if (!open) resetRateImportDialog();
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Import Pricing Rates from CSV
              </DialogTitle>
              <DialogDescription>
                Upload a CSV file with columns: name, rate from UVF, rate from GFL, rate from PORT_Castries
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleRateFileUpload}
                  className="hidden"
                  id="rate-csv-upload"
                  data-testid="input-rate-csv-upload"
                />
                <label htmlFor="rate-csv-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {rateCsvContent ? "File loaded - click to replace" : "Click to select CSV file"}
                  </p>
                </label>
              </div>

              {rateCsvContent && (
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-sm font-medium mb-1">Preview</p>
                  <p className="text-xs text-muted-foreground">
                    {parseRatesCSV(rateCsvContent).length} hotel rates found in file
                  </p>
                </div>
              )}

              {rateImportResult && (
                <div className="space-y-2">
                  {(rateImportResult.created > 0 || rateImportResult.updated > 0) && (
                    <div className="bg-primary/10 rounded-md p-3">
                      <p className="text-sm text-primary font-medium">
                        Successfully imported: {rateImportResult.created} new, {rateImportResult.updated} updated
                      </p>
                    </div>
                  )}
                  {rateImportResult.errors.length > 0 && (
                    <div className="bg-destructive/10 rounded-md p-3 space-y-1">
                      <p className="text-sm text-destructive font-medium flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {rateImportResult.errors.length} errors
                      </p>
                      <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                        {rateImportResult.errors.map((err, i) => (
                          <p key={i} className="text-destructive/80">
                            Row {err.row}: {err.name} - {err.error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-muted/30 rounded-md p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>CSV Format:</strong> The file should have headers like "name", "rate from UVF", "rate from GFL", "rate from PORT_Castries". 
                  Hotel names must match exactly with existing hotels in the system. Existing rates will be overwritten.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsRateImportDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  data-testid="button-rate-import-submit"
                  onClick={handleRateImport}
                  disabled={!rateCsvContent || bulkImportRatesMutation.isPending}
                >
                  {bulkImportRatesMutation.isPending ? "Importing..." : "Import Rates"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
