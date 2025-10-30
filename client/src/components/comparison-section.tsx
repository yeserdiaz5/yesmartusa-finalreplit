import { useState, useMemo } from "react";
import { FilterSortBar } from "@/components/filter-sort-bar";
import { ServiceCard } from "@/components/service-card";
import { ComparisonTable } from "@/components/comparison-table";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Table } from "lucide-react";
import type { Service } from "@shared/schema";

interface ComparisonSectionProps {
  services: Service[];
}

export function ComparisonSection({ services }: ComparisonSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const categories = useMemo(() => {
    const cats = new Set(services.map((s) => s.category));
    return Array.from(cats);
  }, [services]);

  const filteredAndSortedServices = useMemo(() => {
    let filtered = services;

    if (selectedCategory !== "all") {
      filtered = services.filter((s) => s.category === selectedCategory);
    }

    const sorted = [...filtered];
    switch (sortBy) {
      case "price-low":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "popular":
        sorted.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
        break;
    }

    return sorted;
  }, [services, selectedCategory, sortBy]);

  return (
    <section id="pricing" className="scroll-mt-16">
      <FilterSortBar
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
        categories={categories}
      />

      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-section-heading">
              Compare Plans & Pricing
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl" data-testid="text-section-description">
              Find the perfect plan for your needs. All plans include our core
              features with varying levels of access and support.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-muted rounded-md p-1 w-full md:w-auto">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              data-testid="button-view-grid"
              className="gap-2 flex-1 md:flex-initial"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Cards</span>
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              data-testid="button-view-table"
              className="gap-2 flex-1 md:flex-initial"
            >
              <Table className="h-4 w-4" />
              <span className="hidden sm:inline">Table</span>
            </Button>
          </div>
        </div>

        {filteredAndSortedServices.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground" data-testid="text-no-services">
              No services found for this category.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAndSortedServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <ComparisonTable services={filteredAndSortedServices} />
        )}
      </div>
    </section>
  );
}
