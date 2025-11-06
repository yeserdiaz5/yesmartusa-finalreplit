import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@assets/generated_images/Abstract_data_visualization_hero_489090e8.png";

export function HeroSection() {
  const scrollToCompare = () => {
    const element = document.getElementById("pricing");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight" data-testid="text-hero-headline">
              Compare Services,{" "}
              <span className="text-primary">Make Smart Choices</span>
            </h1>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground" data-testid="text-hero-description">
              Cut through the noise and find the perfect plan for your needs.
              Compare pricing, features, and benefits side-by-side with our
              intuitive comparison tools.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Button
                size="lg"
                onClick={scrollToCompare}
                data-testid="button-cta-hero"
                className="group backdrop-blur-md bg-primary/90 hover:bg-primary/100"
              >
                Start Comparing
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  const element = document.getElementById("subscribe");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                data-testid="button-subscribe-hero"
                className="backdrop-blur-md bg-background/80"
              >
                Get Updates
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={heroImage.src || heroImage}
                alt="Data visualization and comparison charts"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
