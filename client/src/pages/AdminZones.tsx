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
import { MapPin, DollarSign, ArrowRight, Check } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Zone, ZoneRoute } from "@shared/schema";

export default function AdminZones() {
  const { toast } = useToast();
  const [selectedOriginZone, setSelectedOriginZone] = useState<string>("");
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<{ originId: string; destinationId: string; originName: string; destinationName: string } | null>(null);
  const [routePrice, setRoutePrice] = useState("");

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

  const filteredZones = zones || [];
  const selectedOrigin = zones?.find((z) => z.id === selectedOriginZone);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Zones</h1>
          <p className="text-muted-foreground mt-1">
            Manage St. Lucia service zones and set zone-to-zone pricing
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              St. Lucia Zones
            </CardTitle>
            <CardDescription>
              {zones?.length || 0} zones configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            {zonesLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading zones...</div>
            ) : !zones || zones.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No zones configured. Contact support to seed zones.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {zones.map((zone) => (
                  <Badge
                    key={zone.id}
                    variant={zone.isActive ? "default" : "secondary"}
                    className="text-sm"
                    data-testid={`badge-zone-${zone.id}`}
                  >
                    {zone.name}
                  </Badge>
                ))}
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
    </AdminLayout>
  );
}
