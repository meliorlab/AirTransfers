import { DollarSign, Shield, Star } from "lucide-react";

const features = [
  {
    icon: DollarSign,
    title: "Clear Pricing",
    description: "Transparent rates with no hidden fees. All prices displayed in USD for your convenience.",
  },
  {
    icon: Shield,
    title: "Guaranteed Transfer",
    description: "Reliable service with on time pick-up and professional drivers you can trust.",
  },
  {
    icon: Star,
    title: "Comfortable Ride",
    description: "Select from our fleet of well-maintained vehicles to match your needs and budget.",
  },
];

export default function FeaturesSection() {
  return (
    <div className="bg-background py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
