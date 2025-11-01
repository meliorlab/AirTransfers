import { Calendar, MapPin, Users, Plane, Check } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import heroImage from "@assets/generated_images/Airport_professional_greeting_scene_d42210f5.png";

export default function HeroSection() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1 fields
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [accommodation, setAccommodation] = useState("");
  const [date, setDate] = useState("");
  const [partySize, setPartySize] = useState("1");
  
  // Step 2 fields
  const [flightNumber, setFlightNumber] = useState("");
  const [vehicleClass, setVehicleClass] = useState("");
  
  // Step 3 fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const handleNext = () => {
    // Validate required fields for each step
    if (currentStep === 1) {
      if (!pickupLocation || !dropoffLocation || !date || !partySize) {
        toast({
          title: "Required fields missing",
          description: "Please fill in all required fields before proceeding.",
          variant: "destructive",
        });
        return;
      }
    } else if (currentStep === 2) {
      if (!flightNumber || !vehicleClass) {
        toast({
          title: "Required fields missing",
          description: "Please fill in all required fields before proceeding.",
          variant: "destructive",
        });
        return;
      }
    } else if (currentStep === 3) {
      if (!fullName || !email || !contactNumber) {
        toast({
          title: "Required fields missing",
          description: "Please fill in all required fields before proceeding.",
          variant: "destructive",
        });
        return;
      }
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      console.log(`Moving to step ${currentStep + 1}`);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      console.log(`Moving back to step ${currentStep - 1}`);
    }
  };

  const handleCheckout = () => {
    console.log("Proceeding to checkout with data:", {
      pickupLocation,
      dropoffLocation,
      accommodation,
      date,
      partySize,
      flightNumber,
      vehicleClass,
      fullName,
      email,
      contactNumber,
    });
  };

  const getVehicleClassName = () => {
    switch (vehicleClass) {
      case "standard":
        return "Standard 1-3 Pax";
      case "luxury":
        return "Luxury 1-4 Pax";
      case "minivan":
        return "Minivan 4+ Pax";
      default:
        return vehicleClass;
    }
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
              {/* Progress indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`flex-1 h-1 ${
                        step <= currentStep ? "bg-primary" : "bg-muted"
                      } ${step !== 1 ? "ml-1" : ""}`}
                    />
                  ))}
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  Step {currentStep} of 4
                </div>
              </div>

              {/* Step 1: Location & Date */}
              {currentStep === 1 && (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-heading font-semibold text-foreground mb-2">
                      Seamless Airport Transfer. Book Your Ride In Under 60 Seconds.
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Choose your pickup location, drop off location and the ride that fits your needs and budget in just four steps.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="pickup" className="text-sm font-medium mb-1.5 block">
                        Pickup Location <span className="text-destructive">*</span>
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
                        Drop-off Location <span className="text-destructive">*</span>
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
                          Date & Time <span className="text-destructive">*</span>
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
                        <Label htmlFor="partySize" className="text-sm font-medium mb-1.5 block">
                          Party Size <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="partySize"
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
                      data-testid="button-next-step1"
                      className="w-full h-12 text-base font-semibold"
                      onClick={handleNext}
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}

              {/* Step 2: Flight & Vehicle */}
              {currentStep === 2 && (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-heading font-semibold text-foreground mb-2">
                      Flight & Vehicle Details
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Please provide your flight details and select your preferred vehicle class.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="flightNumber" className="text-sm font-medium mb-1.5 block">
                        Flight/Ferry Number <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Plane className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="flightNumber"
                          data-testid="input-flight-number"
                          placeholder="e.g. AA1234"
                          className="pl-10 h-12"
                          value={flightNumber}
                          onChange={(e) => setFlightNumber(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="vehicleClass" className="text-sm font-medium mb-1.5 block">
                        Vehicle Class <span className="text-destructive">*</span>
                      </Label>
                      <Select value={vehicleClass} onValueChange={setVehicleClass}>
                        <SelectTrigger
                          id="vehicleClass"
                          data-testid="select-vehicle-class"
                          className="h-12"
                        >
                          <SelectValue placeholder="Select Vehicle Class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard (1-3 Pax)</SelectItem>
                          <SelectItem value="luxury">Luxury (1-4 Pax)</SelectItem>
                          <SelectItem value="minivan">Minivan (4+ Pax)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        data-testid="button-back-step2"
                        variant="outline"
                        className="flex-1 h-12 text-base font-semibold"
                        onClick={handleBack}
                      >
                        Back
                      </Button>
                      <Button
                        data-testid="button-next-step2"
                        className="flex-1 h-12 text-base font-semibold"
                        onClick={handleNext}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* Step 3: Personal Information */}
              {currentStep === 3 && (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-heading font-semibold text-foreground mb-2">
                      Personal Information
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Please provide your contact details for booking confirmation.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName" className="text-sm font-medium mb-1.5 block">
                        Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        data-testid="input-full-name"
                        placeholder="Enter your full name"
                        className="h-12"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-sm font-medium mb-1.5 block">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        data-testid="input-email"
                        type="email"
                        placeholder="your.email@example.com"
                        className="h-12"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="contactNumber" className="text-sm font-medium mb-1.5 block">
                        Contact Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="contactNumber"
                        data-testid="input-contact-number"
                        type="tel"
                        placeholder="+1 (234) 567-8900"
                        className="h-12"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        data-testid="button-back-step3"
                        variant="outline"
                        className="flex-1 h-12 text-base font-semibold"
                        onClick={handleBack}
                      >
                        Back
                      </Button>
                      <Button
                        data-testid="button-next-step3"
                        className="flex-1 h-12 text-base font-semibold"
                        onClick={handleNext}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === 4 && (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-heading font-semibold text-foreground mb-2">
                      Finally, let's confirm your booking
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Here is the price breakdown for this booking
                    </p>
                  </div>

                  <div className="border border-border rounded-md p-6 mb-6">
                    <h3 className="text-center text-lg font-semibold text-foreground mb-2">
                      Booking Fee
                    </h3>
                    <div className="text-center text-5xl font-bold text-primary mb-4">
                      $30
                    </div>
                    <p className="text-center text-sm text-muted-foreground mb-6">
                      Driver Fee - $30 (Paid to driver)
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">
                          Pick up location - <span className="text-muted-foreground">{pickupLocation || "Not set"}</span>
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">
                          Drop off location - <span className="text-muted-foreground">{dropoffLocation || "Not set"}</span>
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">
                          Vehicle class - <span className="text-muted-foreground">{getVehicleClassName() || "Not selected"}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      data-testid="button-back-step4"
                      variant="secondary"
                      className="flex-1 h-12 text-base font-semibold"
                      onClick={handleBack}
                    >
                      Back
                    </Button>
                    <Button
                      data-testid="button-checkout"
                      className="flex-1 h-12 text-base font-semibold"
                      onClick={handleCheckout}
                    >
                      Proceed to checkout
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
