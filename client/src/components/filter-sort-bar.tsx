import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";

interface FilterSortBarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  categories: string[];
}

export function FilterSortBar({
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  categories,
}: FilterSortBarProps) {
  const { t } = useLanguage();
  
  return (
    <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-md border-b py-6">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground mr-2">
              {t("filter.label")}
            </span>
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange("all")}
              data-testid="filter-all"
              className="transition-colors"
            >
              {t("filter.allServices")}
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => onCategoryChange(category)}
                data-testid={`filter-${category.toLowerCase()}`}
                className="transition-colors"
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-medium text-muted-foreground">
              {t("sort.label")}
            </span>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger
                className="w-full sm:w-[200px]"
                data-testid="select-sort"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular" data-testid="sort-popular">
                  {t("sort.popular")}
                </SelectItem>
                <SelectItem value="price-low" data-testid="sort-price-low">
                  {t("sort.priceLow")}
                </SelectItem>
                <SelectItem value="price-high" data-testid="sort-price-high">
                  {t("sort.priceHigh")}
                </SelectItem>
                <SelectItem value="name" data-testid="sort-name">
                  {t("sort.name")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
