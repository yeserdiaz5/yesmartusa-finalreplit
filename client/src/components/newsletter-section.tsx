import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { insertSubscriberSchema, type InsertSubscriber } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function NewsletterSection() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSubscribed, setIsSubscribed] = useState(false);

  const form = useForm<InsertSubscriber>({
    resolver: zodResolver(insertSubscriberSchema),
    defaultValues: {
      email: "",
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (data: InsertSubscriber) => {
      return await apiRequest("POST", "/api/subscribe", data);
    },
    onSuccess: () => {
      setIsSubscribed(true);
      form.reset();
      toast({
        title: t("newsletter.toastSuccessTitle"),
        description: t("newsletter.toastSuccessDescription"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("newsletter.toastErrorTitle"),
        description: error.message || t("newsletter.toastErrorDescription"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertSubscriber) => {
    subscribeMutation.mutate(data);
  };

  return (
    <section id="subscribe" className="py-16 md:py-24 bg-muted/30 scroll-mt-16">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-newsletter-heading">
            {t("newsletter.heading")}
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed" data-testid="text-newsletter-description">
            {t("newsletter.description")}
          </p>
        </div>

        {isSubscribed ? (
          <div className="bg-card rounded-lg border p-8 text-center" data-testid="success-message">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2" data-testid="text-success-heading">
              {t("newsletter.successHeading")}
            </h3>
            <p className="text-muted-foreground" data-testid="text-success-description">
              {t("newsletter.successDescription")}
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-lg border p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("newsletter.emailLabel")}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t("newsletter.emailPlaceholder")}
                          data-testid="input-email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={subscribeMutation.isPending}
                  data-testid="button-subscribe"
                >
                  {subscribeMutation.isPending ? t("newsletter.ctaSubscribing") : t("newsletter.ctaSubscribe")}
                </Button>

                <p className="text-xs text-center text-muted-foreground" data-testid="text-privacy-notice">
                  {t("newsletter.privacy")}
                </p>
              </form>
            </Form>
          </div>
        )}
      </div>
    </section>
  );
}
