import { Calendar, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import heroImage from "@assets/generated_images/Airport_professional_greeting_scene_d42210f5.png";

export default function HeroSection() {
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [accommodation, setAccommodation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState("1");

  const handleBooking = () => {
    console.log("Booking submitted:", {
      pickupLocation,
      dropoffLocation,
      accommodation,
      date,
      time,
      partySize,
    });
  };

  return (
    <div className="relative min-h-[600px] lg:min-h-[700px] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.3)), url(${heroImage})`,
        }}
      />
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-white">
            <div className="mb-6">
              <h1 className="text-3xl lg:text-5xl font-heading font-semibold mb-4 leading-tight">
                Logo
              </h1>
            </div>
          </div>

          <div className="w-full max-w-md lg:max-w-lg mx-auto lg:mx-0 lg:ml-auto">
            <div className="bg-white rounded-lg p-6 lg:p-8" style={{ boxShadow: "var(--shadow-xl)" }}>
              <div className="mb-6">
                <h2 className="text-2xl lg:text-3xl font-heading font-semibold text-foreground mb-2">
                  Seamless Airport Transfer. Book Your Ride In Under 60 Seconds.
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose your pickup location, drop off location and the ride that fits your needs and budget in just three steps.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="pickup" className="text-sm font-medium mb-1.5 block">
                    Pickup Location
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="pickup"
                      data-testid="input-pickup-location"
                      placeholder="Select Location"
                      className="pl-10 h-12"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="dropoff" className="text-sm font-medium mb-1.5 block">
                    Drop-off Location
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dropoff"
                      data-testid="input-dropoff-location"
                      placeholder="Select Accommodation"
                      className="pl-10 h-12"
                      value={dropoffLocation}
                      onChange={(e) => setDropoffLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="accommodation" className="text-sm font-medium mb-1.5 block">
                    Drop-off Location Street (Optional)
                  </Label>
                  <Select value={accommodation} onValueChange={setAccommodation}>
                    <SelectTrigger
                      id="accommodation"
                      data-testid="select-accommodation"
                      className="h-12"
                    >
                      <SelectValue placeholder="Select Accommodation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="residence">Private Residence</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date" className="text-sm font-medium mb-1.5 block">
                      Date & Time
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="date"
                        data-testid="input-date"
                        type="date"
                        className="pl-10 h-12"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="time" className="text-sm font-medium mb-1.5 block">
                      Party Size
                    </Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="time"
                        data-testid="input-party-size"
                        type="number"
                        min="1"
                        max="8"
                        className="pl-10 h-12"
                        value={partySize}
                        onChange={(e) => setPartySize(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  www.yourdomain.com
                </div>

                <Button
                  data-testid="button-next"
                  className="w-full h-12 text-base font-semibold"
                  onClick={handleBooking}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
