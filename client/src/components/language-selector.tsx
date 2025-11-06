import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Globe } from "lucide-react";

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          data-testid="button-language-selector"
          aria-label="Select Language"
        >
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setLanguage("en")}
          className="cursor-pointer"
          data-testid="menu-item-language-en"
        >
          <span className="mr-2 font-semibold">EN</span>
          <span>English</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("es")}
          className="cursor-pointer"
          data-testid="menu-item-language-es"
        >
          <span className="mr-2 font-semibold">ES</span>
          <span>Español</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
