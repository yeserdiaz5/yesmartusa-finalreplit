import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import type { Service } from "@shared/schema";

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Card
      className="relative flex flex-col h-full hover-elevate transition-all"
      data-testid={`card-service-${service.id}`}
    >
      {service.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground" data-testid="badge-popular">
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="space-y-4 pb-6">
        <div>
          <h3 className="text-xl md:text-2xl font-semibold" data-testid={`text-service-name-${service.id}`}>
            {service.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            {service.description}
          </p>
        </div>

        <div className="pt-4">
          <div className="flex items-baseline gap-2">
            <span
              className="text-4xl md:text-5xl font-bold font-mono"
              data-testid={`text-price-${service.id}`}
            >
              ${service.price}
            </span>
            <span className="text-sm text-muted-foreground">
              /{service.billingCycle}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {service.features.map((feature, index) => (
          <div
            key={index}
            className="flex items-start gap-3"
            data-testid={`feature-${service.id}-${index}`}
          >
            {feature.included ? (
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            ) : (
              <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`text-sm md:text-base ${
                  feature.included
                    ? "text-foreground"
                    : "text-muted-foreground line-through"
                }`}
              >
                {feature.name}
              </p>
              {feature.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {feature.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>

      <CardFooter className="pt-6">
        <Button
          className="w-full"
          variant={service.popular ? "default" : "outline"}
          size="lg"
          data-testid={`button-select-${service.id}`}
        >
          Choose Plan
        </Button>
      </CardFooter>
    </Card>
  );
}
