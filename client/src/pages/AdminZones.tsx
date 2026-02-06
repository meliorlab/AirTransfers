import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MapPin, DollarSign, ArrowRight, Check, Plus, Pencil, Trash2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Zone, ZoneRoute } from "@shared/schema";

export default function AdminZones() {
  const { toast } = useToast();
  const [selectedOriginZone, setSelectedOriginZone] = useState<string>("");
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<{ originId: string; destinationId: string; originName: string; destinationName: string } | null>(null);
  const [routePrice, setRoutePrice] = useState("");

  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [zoneName, setZoneName] = useState("");
  const [zoneDescription, setZoneDescription] = useState("");
  const [zoneIsActive, setZoneIsActive] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingZone, setDeletingZone] = useState<Zone | null>(null);

  const { data: zones, isLoading: zonesLoading } = useQuery<Zone[]>({
    queryKey: ["/api/admin/zones"],
  });

  const { data: zoneRoutes, isLoading: routesLoading } = useQuery<ZoneRoute[]>({
    queryKey: ["/api/admin/zone-routes"],
  });

  const routeMutation = useMutation({
    mutationFn: async (data: { originZoneId: string; destinationZoneId: string; price: string }) => {
      const response = await apiRequest("POST", "/api/admin/zone-routes", {
        originZoneId: data.originZoneId,
        destinationZoneId: data.destinationZoneId,
        price: data.price,
        isActive: true,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Price saved", description: "Zone route pricing has been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/zone-routes"] });
      setPricingDialogOpen(false);
      setEditingRoute(null);
      setRoutePrice("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save route pricing.", variant: "destructive" });
    },
  });

  const createZoneMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; isActive: boolean }) => {
      const response = await apiRequest("POST", "/api/admin/zones", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Zone created", description: "The new zone has been added." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/zones"] });
      closeZoneDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create zone. It may already exist.", variant: "destructive" });
    },
  });

  const updateZoneMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; description?: string; isActive: boolean } }) => {
      const response = await apiRequest("PATCH", `/api/admin/zones/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Zone updated", description: "The zone has been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/zones"] });
      closeZoneDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update zone.", variant: "destructive" });
    },
  });

  const deleteZoneMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/zones/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Zone deleted", description: "The zone has been removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/zones"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/zone-routes"] });
      setDeleteDialogOpen(false);
      setDeletingZone(null);
      if (deletingZone && selectedOriginZone === deletingZone.id) {
        setSelectedOriginZone("");
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete zone. It may be in use.", variant: "destructive" });
    },
  });

  const getRoutePrice = (originId: string, destinationId: string): string | null => {
    if (!zoneRoutes) return null;
    const route = zoneRoutes.find(
      (r) => r.originZoneId === originId && r.destinationZoneId === destinationId
    );
    return route ? route.price : null;
  };

  const openPricingDialog = (originId: string, destinationId: string) => {
    const originZone = zones?.find((z) => z.id === originId);
    const destinationZone = zones?.find((z) => z.id === destinationId);
    if (!originZone || !destinationZone) return;

    const existingPrice = getRoutePrice(originId, destinationId);
    setEditingRoute({
      originId,
      destinationId,
      originName: originZone.name,
      destinationName: destinationZone.name,
    });
    setRoutePrice(existingPrice || "");
    setPricingDialogOpen(true);
  };

  const handlePriceSave = () => {
    if (!editingRoute || routePrice === "") return;
    routeMutation.mutate({
      originZoneId: editingRoute.originId,
      destinationZoneId: editingRoute.destinationId,
      price: routePrice,
    });
  };

  const openCreateZoneDialog = () => {
    setEditingZone(null);
    setZoneName("");
    setZoneDescription("");
    setZoneIsActive(true);
    setZoneDialogOpen(true);
  };

  const openEditZoneDialog = (zone: Zone) => {
    setEditingZone(zone);
    setZoneName(zone.name);
    setZoneDescription(zone.description || "");
    setZoneIsActive(zone.isActive);
    setZoneDialogOpen(true);
  };

  const closeZoneDialog = () => {
    setZoneDialogOpen(false);
    setEditingZone(null);
    setZoneName("");
    setZoneDescription("");
    setZoneIsActive(true);
  };

  const handleZoneSave = () => {
    if (!zoneName.trim()) return;
    const data = {
      name: zoneName.trim(),
      description: zoneDescription.trim() || undefined,
      isActive: zoneIsActive,
    };
    if (editingZone) {
      updateZoneMutation.mutate({ id: editingZone.id, data });
    } else {
      createZoneMutation.mutate(data);
    }
  };

  const openDeleteDialog = (zone: Zone) => {
    setDeletingZone(zone);
    setDeleteDialogOpen(true);
  };

  const filteredZones = zones || [];
  const selectedOrigin = zones?.find((z) => z.id === selectedOriginZone);
  const isSavingZone = createZoneMutation.isPending || updateZoneMutation.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-3xl font-heading font-bold">Zones</h1>
            <p className="text-muted-foreground mt-1">
              Manage St. Lucia service zones and set zone-to-zone pricing
            </p>
          </div>
          <Button onClick={openCreateZoneDialog} data-testid="button-add-zone">
            <Plus className="w-4 h-4 mr-2" />
            Add Zone
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                St. Lucia Zones
              </CardTitle>
              <CardDescription>
                {zones?.length || 0} zones configured
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {zonesLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading zones...</div>
            ) : !zones || zones.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No zones configured. Click "Add Zone" to create one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zone Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zones.map((zone) => (
                      <TableRow key={zone.id} data-testid={`row-zone-${zone.id}`}>
                        <TableCell className="font-medium">{zone.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {zone.description || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={zone.isActive ? "default" : "secondary"}
                            data-testid={`badge-zone-status-${zone.id}`}
                          >
                            {zone.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditZoneDialog(zone)}
                              data-testid={`button-edit-zone-${zone.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(zone)}
                              data-testid={`button-delete-zone-${zone.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Zone-to-Zone Pricing
            </CardTitle>
            <CardDescription>
              Set prices for trips between zones. Select an origin zone to see destinations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-sm">
              <Label htmlFor="origin-zone">Select Origin Zone</Label>
              <Select
                value={selectedOriginZone}
                onValueChange={setSelectedOriginZone}
              >
                <SelectTrigger id="origin-zone" data-testid="select-origin-zone">
                  <SelectValue placeholder="Choose a zone..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredZones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedOriginZone && selectedOrigin && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-3">
                  Prices from <span className="text-primary">{selectedOrigin.name}</span>
                </h3>
                {routesLoading ? (
                  <div className="text-center py-4 text-muted-foreground">Loading prices...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Destination Zone</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredZones.map((destZone) => {
                          const price = getRoutePrice(selectedOriginZone, destZone.id);
                          const isSameZone = destZone.id === selectedOriginZone;
                          return (
                            <TableRow key={destZone.id} data-testid={`row-route-${destZone.id}`}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {isSameZone && (
                                    <Badge variant="outline" className="text-xs">Same Zone</Badge>
                                  )}
                                  <span>{destZone.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {price !== null ? (
                                  <span className="font-medium text-green-600 dark:text-green-400">
                                    ${parseFloat(price).toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">Not set</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openPricingDialog(selectedOriginZone, destZone.id)}
                                  data-testid={`button-set-price-${destZone.id}`}
                                >
                                  {price !== null ? (
                                    <>
                                      <Check className="w-4 h-4 mr-1" />
                                      Edit
                                    </>
                                  ) : (
                                    <>
                                      <DollarSign className="w-4 h-4 mr-1" />
                                      Set Price
                                    </>
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {!selectedOriginZone && zones && zones.length > 0 && (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                Select an origin zone above to set pricing to all destinations
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={pricingDialogOpen} onOpenChange={setPricingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Route Price</DialogTitle>
            <DialogDescription>
              Enter the price for this route. This is the base fare for a trip between these zones.
            </DialogDescription>
          </DialogHeader>

          {editingRoute && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-md p-4">
                <div className="flex items-center justify-center gap-3 text-lg">
                  <span className="font-medium">{editingRoute.originName}</span>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{editingRoute.destinationName}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="route-price">Price ($)</Label>
                <Input
                  id="route-price"
                  data-testid="input-route-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={routePrice}
                  onChange={(e) => setRoutePrice(e.target.value)}
                  placeholder="0.00"
                  className="text-lg"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPricingDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePriceSave}
              disabled={routeMutation.isPending || routePrice === ""}
              data-testid="button-save-route-price"
            >
              {routeMutation.isPending ? "Saving..." : "Save Price"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={zoneDialogOpen} onOpenChange={setZoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingZone ? "Edit Zone" : "Add New Zone"}</DialogTitle>
            <DialogDescription>
              {editingZone
                ? "Update the details for this zone."
                : "Create a new service zone for St. Lucia."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="zone-name">Zone Name</Label>
              <Input
                id="zone-name"
                data-testid="input-zone-name"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="e.g. Castries North"
              />
            </div>

            <div>
              <Label htmlFor="zone-description">Description (optional)</Label>
              <Textarea
                id="zone-description"
                data-testid="input-zone-description"
                value={zoneDescription}
                onChange={(e) => setZoneDescription(e.target.value)}
                placeholder="Brief description of this zone area..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="zone-active">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Inactive zones won't appear in the booking form
                </p>
              </div>
              <Switch
                id="zone-active"
                data-testid="switch-zone-active"
                checked={zoneIsActive}
                onCheckedChange={setZoneIsActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeZoneDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleZoneSave}
              disabled={isSavingZone || !zoneName.trim()}
              data-testid="button-save-zone"
            >
              {isSavingZone ? "Saving..." : editingZone ? "Update Zone" : "Create Zone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Zone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingZone?.name}"? This will also remove all
              pricing routes associated with this zone. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingZone && deleteZoneMutation.mutate(deletingZone.id)}
              data-testid="button-confirm-delete-zone"
            >
              {deleteZoneMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
