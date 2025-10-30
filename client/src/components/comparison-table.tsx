import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import type { Service } from "@shared/schema";

interface ComparisonTableProps {
  services: Service[];
}

export function ComparisonTable({ services }: ComparisonTableProps) {
  const allFeatureNames = Array.from(
    new Set(services.flatMap((s) => s.features.map((f) => f.name)))
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" data-testid="table-comparison">
        <thead className="sticky top-32 bg-card z-30">
          <tr className="border-b-2">
            <th className="text-left p-6 font-semibold min-w-[200px]">
              Features
            </th>
            {services.map((service) => (
              <th
                key={service.id}
                className="text-center p-6 min-w-[200px]"
                data-testid={`th-service-${service.id}`}
              >
                <div className="space-y-2">
                  {service.popular && (
                    <Badge className="bg-primary text-primary-foreground mb-2">
                      Most Popular
                    </Badge>
                  )}
                  <div className="font-bold text-lg" data-testid={`text-table-service-name-${service.id}`}>
                    {service.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {service.description}
                  </div>
                  <div className="pt-2">
                    <div className="text-3xl font-bold font-mono" data-testid={`text-table-price-${service.id}`}>
                      ${service.price}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      /{service.billingCycle}
                    </div>
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allFeatureNames.map((featureName, index) => (
            <tr
              key={featureName}
              className={`border-b transition-colors hover-elevate ${
                index % 2 === 0 ? "bg-muted/20" : ""
              }`}
              data-testid={`row-feature-${index}`}
            >
              <td className="p-6 font-medium" data-testid={`text-feature-name-${index}`}>
                {featureName}
              </td>
              {services.map((service) => {
                const feature = service.features.find(
                  (f) => f.name === featureName
                );
                return (
                  <td
                    key={service.id}
                    className="text-center p-6"
                    data-testid={`cell-${service.id}-${index}`}
                  >
                    {feature ? (
                      feature.included ? (
                        <Check className="h-6 w-6 text-primary mx-auto" />
                      ) : (
                        <X className="h-6 w-6 text-muted-foreground mx-auto" />
                      )
                    ) : (
                      <X className="h-6 w-6 text-muted-foreground mx-auto" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr>
            <td className="p-6"></td>
            {services.map((service) => (
              <td key={service.id} className="text-center p-6">
                <Button
                  className="w-full"
                  variant={service.popular ? "default" : "outline"}
                  data-testid={`button-table-select-${service.id}`}
                >
                  Choose Plan
                </Button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
