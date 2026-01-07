import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
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
import { Search, Eye, DollarSign, Send, Link as LinkIcon, Building2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Booking } from "@shared/schema";

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

export default function AdminBookings() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  const [bookingFee, setBookingFee] = useState("");
  const [driverFee, setDriverFee] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [balanceDueToDriver, setBalanceDueToDriver] = useState("");

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings", { status: statusFilter, search: searchQuery }],
  });

  const pricingMutation = useMutation({
    mutationFn: async (data: { id: string; bookingFee: string; driverFee: string; totalAmount: string; balanceDueToDriver: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/bookings/${data.id}/pricing`, {
        bookingFee: data.bookingFee,
        driverFee: data.driverFee,
        totalAmount: data.totalAmount,
        balanceDueToDriver: data.balanceDueToDriver,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Pricing updated", description: "The booking pricing has been saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      setPricingDialogOpen(false);
      setSelectedBooking(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update pricing.", variant: "destructive" });
    },
  });

  const sendPaymentLinkMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiRequest("POST", `/api/admin/bookings/${bookingId}/send-payment-link`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Payment link sent", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send payment link.", variant: "destructive" });
    },
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openPricingDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setBookingFee(booking.bookingFee || "");
    setDriverFee(booking.driverFee || "");
    setTotalAmount(booking.totalAmount || "");
    setBalanceDueToDriver(booking.balanceDueToDriver || "");
    setPricingDialogOpen(true);
  };

  const handlePricingSubmit = () => {
    if (!selectedBooking) return;
    pricingMutation.mutate({
      id: selectedBooking.id,
      bookingFee,
      driverFee,
      totalAmount,
      balanceDueToDriver,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Bookings</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all airport transfer bookings
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Search and filter bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    data-testid="input-search"
                    placeholder="Reference number, name, email, flight..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="paid_fee">Paid Fee</SelectItem>
                    <SelectItem value="driver_assigned">Driver Assigned</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Bookings</CardTitle>
            <CardDescription>
              {bookings?.length || 0} booking{bookings?.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : !bookings || bookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No bookings found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Pickup Date</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pricing</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id} data-testid={`row-booking-${booking.id}`}>
                        <TableCell className="font-mono text-sm">
                          {booking.referenceNumber}
                        </TableCell>
                        <TableCell>
                          {booking.bookingType === "destination" ? (
                            <Badge variant="outline" className="gap-1">
                              <LinkIcon className="w-3 h-3" />
                              Link
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <Building2 className="w-3 h-3" />
                              Hotel
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{booking.customerName}</div>
                          <div className="text-xs text-muted-foreground">
                            {booking.customerEmail}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(booking.pickupDate as unknown as string)}</TableCell>
                        <TableCell>
                          <div className="text-sm max-w-[200px] truncate">
                            {booking.bookingType === "destination" && booking.destinationLink ? (
                              <a 
                                href={booking.destinationLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                View Link
                              </a>
                            ) : (
                              booking.dropoffLocation
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusColors[booking.status]}
                          >
                            {statusLabels[booking.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {booking.pricingSet ? (
                            <div className="text-sm">
                              <span className="font-medium">${booking.totalAmount}</span>
                              {booking.paymentLinkSent && (
                                <Badge variant="secondary" className="ml-2 text-xs">Sent</Badge>
                              )}
                            </div>
                          ) : (
                            <Badge variant="destructive" className="text-xs">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {booking.bookingType === "destination" && !booking.pricingSet && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openPricingDialog(booking)}
                                data-testid={`button-set-pricing-${booking.id}`}
                              >
                                <DollarSign className="w-4 h-4 mr-1" />
                                Set Price
                              </Button>
                            )}
                            {booking.bookingType === "destination" && booking.pricingSet && !booking.paymentLinkSent && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => sendPaymentLinkMutation.mutate(booking.id)}
                                disabled={sendPaymentLinkMutation.isPending}
                                data-testid={`button-send-payment-${booking.id}`}
                              >
                                <Send className="w-4 h-4 mr-1" />
                                Send Link
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-view-${booking.id}`}
                              asChild
                            >
                              <Link href={`/admin/bookings/${booking.id}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Link>
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
      </div>

      <Dialog open={pricingDialogOpen} onOpenChange={setPricingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Booking Pricing</DialogTitle>
            <DialogDescription>
              Enter the pricing for this destination booking. The customer will receive a payment link via email.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-md p-3 text-sm">
                <p><strong>Customer:</strong> {selectedBooking.customerName}</p>
                <p><strong>Email:</strong> {selectedBooking.customerEmail}</p>
                <p><strong>Destination:</strong> {selectedBooking.destinationLink && (
                  <a href={selectedBooking.destinationLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    View Link
                  </a>
                )}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bookingFee">Booking Fee ($)</Label>
                  <Input
                    id="bookingFee"
                    data-testid="input-booking-fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={bookingFee}
                    onChange={(e) => setBookingFee(e.target.value)}
                    placeholder="30.00"
                  />
                </div>
                <div>
                  <Label htmlFor="driverFee">Driver Fee ($)</Label>
                  <Input
                    id="driverFee"
                    data-testid="input-driver-fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={driverFee}
                    onChange={(e) => setDriverFee(e.target.value)}
                    placeholder="30.00"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalAmount">Total Amount ($)</Label>
                  <Input
                    id="totalAmount"
                    data-testid="input-total-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="60.00"
                  />
                </div>
                <div>
                  <Label htmlFor="balanceDueToDriver">Balance to Driver ($)</Label>
                  <Input
                    id="balanceDueToDriver"
                    data-testid="input-balance-driver"
                    type="number"
                    step="0.01"
                    min="0"
                    value={balanceDueToDriver}
                    onChange={(e) => setBalanceDueToDriver(e.target.value)}
                    placeholder="30.00"
                  />
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPricingDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handlePricingSubmit}
              disabled={pricingMutation.isPending || bookingFee === "" || driverFee === "" || totalAmount === "" || balanceDueToDriver === ""}
              data-testid="button-save-pricing"
            >
              {pricingMutation.isPending ? "Saving..." : "Save Pricing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
