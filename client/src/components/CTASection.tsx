import { Button } from "@/components/ui/button";

export default function CTASection() {
  const handleBookNow = () => {
    console.log("Book Now clicked");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-primary py-16 lg:py-20">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-3xl lg:text-4xl font-heading font-semibold text-primary-foreground mb-4">
          Ready To Book Your Transfer?
        </h2>
        <p className="text-primary-foreground/90 mb-8 text-lg">
          Join hundreds of satisfied customers who trust AirTransfer for their airport transportation needs.
        </p>
        <Button
          data-testid="button-book-now"
          size="lg"
          variant="secondary"
          className="h-12 px-8 text-base font-semibold"
          onClick={handleBookNow}
        >
          Book Now
        </Button>
      </div>
    </div>
  );
}
