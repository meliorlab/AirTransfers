import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Home, Mail, Calendar, MapPin, Users, Car, Plane } from "lucide-react";

interface BookingDetails {
  referenceNumber: string;
  customerName: string;
  customerEmail: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  partySize: number;
  vehicleClass: string;
  flightNumber: string | null;
  totalAmount: string;
}

export default function BookingConfirmation() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");

  const { data: booking, isLoading, isError } = useQuery<BookingDetails>({
    queryKey: [`/api/booking-confirmation/${sessionId}`],
    enabled: !!sessionId,
  });

  const getVehicleClassName = (vehicleClass: string) => {
    switch (vehicleClass) {
      case "standard": return "Standard (1-3 Pax)";
      case "luxury": return "Luxury (1-4 Pax)";
      case "minivan": return "Minivan (4+ Pax)";
      default: return vehicleClass;
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 data-testid="text-confirmation-title" className="text-xl font-semibold mb-2">No Booking Session</h2>
            <p data-testid="text-error-message" className="text-muted-foreground mb-6">
              No booking session found. Please check your email for confirmation details.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                data-testid="button-go-home"
                onClick={() => setLocation("/")}
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </Button>
              <Button
                data-testid="button-contact-us"
                variant="outline"
                asChild
              >
                <a href="mailto:info@islandporttransfers.com" data-testid="link-contact-us" className="gap-2">
                  <Mail className="w-4 h-4" />
                  Contact Us
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-8 pb-8 text-center">
            <div data-testid="loading-spinner" className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p data-testid="text-loading" className="text-muted-foreground">Loading your booking details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 data-testid="text-confirmation-title" className="text-xl font-semibold mb-2">Booking Confirmed</h2>
            <p data-testid="text-info-message" className="text-muted-foreground mb-6">
              Your booking has been confirmed. Please check your email for details.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                data-testid="button-go-home"
                onClick={() => setLocation("/")}
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </Button>
              <Button
                data-testid="button-contact-us"
                variant="outline"
                asChild
              >
                <a href="mailto:info@islandporttransfers.com" data-testid="link-contact-us" className="gap-2">
                  <Mail className="w-4 h-4" />
                  Contact Us
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle data-testid="text-confirmation-title" className="text-2xl">Booking Confirmed!</CardTitle>
          <p data-testid="text-thank-you" className="text-muted-foreground mt-2">
            Thank you, {booking.customerName}. Your airport transfer has been booked.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
            <p data-testid="text-reference-label" className="text-sm text-muted-foreground mb-1">Reference Number</p>
            <p data-testid="text-reference-number" className="text-2xl font-bold text-primary">
              {booking.referenceNumber}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p data-testid="text-pickup-label" className="text-sm text-muted-foreground">Pickup</p>
                <p data-testid="text-pickup-location" className="font-medium">{booking.pickupLocation}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p data-testid="text-destination-label" className="text-sm text-muted-foreground">Destination</p>
                <p data-testid="text-destination" className="font-medium">{booking.dropoffLocation}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p data-testid="text-date-label" className="text-sm text-muted-foreground">Date & Time</p>
                <p data-testid="text-date" className="font-medium">
                  {new Date(booking.pickupDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p data-testid="text-passengers-label" className="text-sm text-muted-foreground">Passengers</p>
                <p data-testid="text-passengers" className="font-medium">{booking.partySize}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Car className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p data-testid="text-vehicle-label" className="text-sm text-muted-foreground">Vehicle</p>
                <p data-testid="text-vehicle" className="font-medium">{getVehicleClassName(booking.vehicleClass)}</p>
              </div>
            </div>

            {booking.flightNumber && (
              <div className="flex items-start gap-3">
                <Plane className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p data-testid="text-flight-label" className="text-sm text-muted-foreground">Flight Number</p>
                  <p data-testid="text-flight" className="font-medium">{booking.flightNumber}</p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span data-testid="text-total-label" className="text-muted-foreground">Total Paid</span>
              <span data-testid="text-total-amount" className="text-2xl font-bold text-primary">
                ${parseFloat(booking.totalAmount).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-center text-sm text-muted-foreground">
            A confirmation email has been sent to <strong data-testid="text-customer-email">{booking.customerEmail}</strong>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              data-testid="button-go-home"
              onClick={() => setLocation("/")}
              className="flex-1 gap-2"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
            <Button
              data-testid="button-contact-us"
              variant="outline"
              className="flex-1"
              asChild
            >
              <a href="mailto:info@islandporttransfers.com" data-testid="link-contact-us" className="gap-2">
                <Mail className="w-4 h-4" />
                Contact Us
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
