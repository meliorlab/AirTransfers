import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import standardVehicle from "@assets/generated_images/Standard_luxury_sedan_vehicle_ff80a51d.png";
import luxuryVehicle from "@assets/generated_images/Premium_luxury_sedan_vehicle_c5b34ad0.png";
import minivanVehicle from "@assets/generated_images/Luxury_minivan_passenger_vehicle_ec956515.png";

const vehicles = [
  {
    id: "standard",
    name: "Standard 1-3 Pax",
    image: standardVehicle,
    description: "Comfortable sedan perfect for solo travellers and small groups with moderate luggage.",
    capacity: "1-3 passengers",
  },
  {
    id: "luxury",
    name: "Luxury 1-4 Pax",
    image: luxuryVehicle,
    description: "Premium SUV offering extra space and comfort for a more luxurious travel experience.",
    capacity: "1-4 passengers",
  },
  {
    id: "minivan",
    name: "Minivan 4+ Pax",
    image: minivanVehicle,
    description: "Spacious minivan ideal for larger groups and families with extensive luggage needs.",
    capacity: "4-8 passengers",
  },
];

export default function VehicleFleetSection() {
  return (
    <div className="bg-background py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-heading font-semibold text-foreground mb-4">
            Our Vehicle Fleet
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect vehicle for your journey. All our vehicles are regularly maintained and driven by professional chauffeurs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden hover-elevate" data-testid={`card-vehicle-${vehicle.id}`}>
              <CardHeader className="p-0">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CardTitle className="text-xl font-heading font-semibold mb-2">
                  {vehicle.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground mb-4">
                  {vehicle.description}
                </p>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <span className="font-medium">{vehicle.capacity}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
