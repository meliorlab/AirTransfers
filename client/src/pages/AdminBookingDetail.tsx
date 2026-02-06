import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, Mail, Phone, Calendar, MapPin, Plane, Car, Users, DollarSign } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Booking, Driver } from "@shared/schema";
import { useState } from "react";

interface LargePartySurcharge {
  amount: string;
  minPartySize: string;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  paid_fee: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  driver_assigned: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  canceled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusLabels: Record<string, string> = {
  new: "New",
  paid_fee: "Paid Fee",
  driver_assigned: "Driver Assigned",
  completed: "Completed",
  canceled: "Canceled",
};

export default function AdminBookingDetail() {
  const [, params] = useRoute("/admin/bookings/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pricingBookingFee, setPricingBookingFee] = useState("");
  const [pricingDriverFee, setPricingDriverFee] = useState("");

  const { data: booking, isLoading } = useQuery<Booking>({
    queryKey: [`/api/admin/bookings/${params?.id}`],
    enabled: !!params?.id,
  });

  const { data: drivers } = useQuery<Driver[]>({
    queryKey: ["/api/admin/drivers"],
  });

  const { data: surchargeSettings } = useQuery<LargePartySurcharge>({
    queryKey: ["/api/settings/large-party-surcharge"],
  });

  const assignDriverMutation = useMutation({
    mutationFn: async (driverId: string) => {
      return await apiRequest("POST", `/api/admin/bookings/${params?.id}/assign-driver`, { driverId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/bookings/${params?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({
        title: "Driver assigned",
        description: "Driver has been successfully assigned and notified via email",
      });
      setIsDialogOpen(false);
      setSelectedDriverId("");
    },
    onError: () => {
      toast({
        title: "Assignment failed",
        description: "Failed to assign driver",
        variant: "destructive",
      });
    },
  });

  const setPricingMutation = useMutation({
    mutationFn: async (data: { bookingFee: string; driverFee: string }) => {
      return await apiRequest("PATCH", `/api/admin/bookings/${params?.id}/pricing`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/bookings/${params?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({
        title: "Pricing set",
        description: "Booking pricing has been saved and the customer will be notified.",
      });
      setPricingBookingFee("");
      setPricingDriverFee("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to set pricing",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return await apiRequest("PATCH", `/api/admin/bookings/${params?.id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/bookings/${params?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({
        title: "Status updated",
        description: "Booking status has been updated",
      });
    },
  });

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const assignedDriver = drivers?.find((d) => d.id === booking?.driverId);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      </AdminLayout>
    );
  }

  if (!booking) {
    return (
      <AdminLayout>
        <div className="text-center py-8 text-muted-foreground">Booking not found</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            data-testid="button-back"
            onClick={() => setLocation("/admin/bookings")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold">Booking Details</h1>
            <p className="text-muted-foreground mt-1">
              Reference: {booking.referenceNumber}
            </p>
          </div>
          <div className="ml-auto">
            <Badge variant="outline" className={statusColors[booking.status]}>
              {statusLabels[booking.status]}
            </Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{booking.customerName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{booking.customerEmail}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{booking.customerPhone}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trip Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{formatDate(booking.pickupDate)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Plane className="w-4 h-4 text-muted-foreground" />
                <span>Flight {booking.flightNumber}</span>
              </div>
              <div className="flex items-center gap-3">
                <Car className="w-4 h-4 text-muted-foreground" />
                <span className="capitalize">{booking.vehicleClass} - {booking.partySize} passenger{booking.partySize > 1 ? 's' : ''}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Route</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <div className="font-medium">Pickup</div>
                  <div className="text-sm text-muted-foreground">{booking.pickupLocation}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <div className="font-medium">Drop-off</div>
                  <div className="text-sm text-muted-foreground">{booking.dropoffLocation}</div>
                  {booking.accommodation && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {booking.accommodation}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(() => {
                const minPartySize = surchargeSettings ? parseInt(surchargeSettings.minPartySize) : 4;
                const surchargeAmount = surchargeSettings ? parseFloat(surchargeSettings.amount) : 20;
                const hasSurcharge = booking.partySize >= minPartySize;
                const totalAmount = booking.totalAmount ? parseFloat(booking.totalAmount) : 0;
                const calculatedBaseRate = hasSurcharge ? totalAmount - surchargeAmount : totalAmount;
                
                return (
                  <>
                    {booking.pricingSet ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base Transfer Rate</span>
                          <span className="font-medium">${calculatedBaseRate.toFixed(2)}</span>
                        </div>
                        {hasSurcharge && (
                          <div className="flex justify-between text-amber-600 dark:text-amber-400">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              Large Party Surcharge ({booking.partySize}+ travelers)
                            </span>
                            <span className="font-medium">+${surchargeAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t">
                          <span className="font-semibold">Total Amount</span>
                          <span className="font-semibold">${booking.totalAmount || "0.00"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Balance Due to Driver</span>
                          <span className="font-medium text-primary">${booking.balanceDueToDriver || "0.00"}</span>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Set the pricing for this destination booking. The customer will be notified once saved.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="pricing-booking-fee">Booking Fee ($)</Label>
                            <Input
                              id="pricing-booking-fee"
                              data-testid="input-pricing-booking-fee"
                              type="number"
                              step="0.01"
                              min="0"
                              value={pricingBookingFee}
                              onChange={(e) => setPricingBookingFee(e.target.value)}
                              placeholder="30.00"
                            />
                          </div>
                          <div>
                            <Label htmlFor="pricing-driver-fee">Driver Fee ($)</Label>
                            <Input
                              id="pricing-driver-fee"
                              data-testid="input-pricing-driver-fee"
                              type="number"
                              step="0.01"
                              min="0"
                              value={pricingDriverFee}
                              onChange={(e) => setPricingDriverFee(e.target.value)}
                              placeholder="50.00"
                            />
                          </div>
                        </div>
                        {pricingBookingFee && pricingDriverFee && (
                          <div className="flex justify-between pt-2 border-t text-sm">
                            <span className="text-muted-foreground">Estimated Total (before tax)</span>
                            <span className="font-medium">
                              ${(parseFloat(pricingBookingFee || "0") + parseFloat(pricingDriverFee || "0")).toFixed(2)}
                            </span>
                          </div>
                        )}
                        <Button
                          onClick={() => setPricingMutation.mutate({
                            bookingFee: pricingBookingFee,
                            driverFee: pricingDriverFee,
                          })}
                          disabled={setPricingMutation.isPending || !pricingBookingFee || !pricingDriverFee}
                          data-testid="button-set-pricing"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          {setPricingMutation.isPending ? "Saving..." : "Set Pricing"}
                        </Button>
                      </div>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Driver Assignment</CardTitle>
            <CardDescription>
              {assignedDriver
                ? "Driver has been assigned to this booking"
                : "No driver assigned yet"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignedDriver && (
              <div className="p-4 border rounded-md">
                <div className="flex items-center gap-4">
                  {assignedDriver.driverPhotoUrl && (
                    <img
                      src={assignedDriver.driverPhotoUrl}
                      alt={assignedDriver.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <div className="font-semibold text-lg">{assignedDriver.name}</div>
                    <div className="text-sm text-muted-foreground">{assignedDriver.email}</div>
                    <div className="text-sm text-muted-foreground">{assignedDriver.phone}</div>
                    {assignedDriver.vehicleDetails && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {assignedDriver.vehicleDetails}
                      </div>
                    )}
                  </div>
                </div>
                {booking.assignedAt && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    Assigned on {formatDate(booking.assignedAt)}
                  </div>
                )}
              </div>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-assign-driver" variant={assignedDriver ? "outline" : "default"}>
                  {assignedDriver ? "Change Driver" : "Assign Driver"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{assignedDriver ? "Change Driver" : "Assign Driver"}</DialogTitle>
                  <DialogDescription>
                    {assignedDriver 
                      ? "Select a new driver for this booking. The new driver will receive an email notification."
                      : "Select a driver for this booking. The driver will receive an email notification."}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Driver</label>
                    <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                      <SelectTrigger data-testid="select-driver">
                        <SelectValue placeholder="Choose a driver" />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers?.filter(d => d.isActive && d.id !== assignedDriver?.id).map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.name} - {driver.vehicleDetails || "No vehicle info"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    data-testid="button-confirm-assign"
                    onClick={() => selectedDriverId && assignDriverMutation.mutate(selectedDriverId)}
                    disabled={!selectedDriverId || assignDriverMutation.isPending}
                  >
                    {assignDriverMutation.isPending ? "Assigning..." : "Confirm Assignment"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Change Status</label>
              <Select
                value={booking.status}
                onValueChange={(value) => updateStatusMutation.mutate(value)}
                disabled={updateStatusMutation.isPending}
              >
                <SelectTrigger data-testid="select-status" className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="paid_fee">Paid Fee</SelectItem>
                  <SelectItem value="driver_assigned">Driver Assigned</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
