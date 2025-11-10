import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Container, Typography, Paper, Alert } from "@mui/material";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { OrganizationSettings, InsertOrganizationSettings } from "@shared/schema";
import { insertOrganizationSettingsSchema } from "@shared/schema";
import { Settings, Building, Phone, Mail, Facebook, Instagram, Youtube, Twitter, Radio, Coins } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function OrganizationSettingsPage() {
  const { t } = useTranslation("settings");
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/organization-settings"]
  }) as { data: OrganizationSettings | undefined; isLoading: boolean };

  const form = useForm<InsertOrganizationSettings>({
    resolver: zodResolver(insertOrganizationSettingsSchema),
    values: settings ? {
      name: settings.name,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      currency: settings.currency || "CHF",
      facebookUrl: settings.facebookUrl || "",
      instagramUrl: settings.instagramUrl || "",
      youtubeUrl: settings.youtubeUrl || "",
      twitterUrl: settings.twitterUrl || "",
      livestreamUrl: settings.livestreamUrl || "",
      livestreamEnabled: settings.livestreamEnabled || false,
      livestreamTitle: settings.livestreamTitle || ""
    } : undefined
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertOrganizationSettings) => {
      const response = await fetch("/api/organization-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to update settings");
      return await response.json() as OrganizationSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization-settings"] });
      toast({
        title: t("organization.toast.success"),
        description: t("organization.toast.successDescription")
      });
    },
    onError: () => {
      toast({
        title: t("organization.toast.error"),
        description: t("organization.toast.errorDescription"),
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: InsertOrganizationSettings) => {
    // Convert empty strings to null for URLs
    const sanitizedData = {
      ...data,
      facebookUrl: data.facebookUrl?.trim() || null,
      instagramUrl: data.instagramUrl?.trim() || null,
      youtubeUrl: data.youtubeUrl?.trim() || null,
      twitterUrl: data.twitterUrl?.trim() || null,
      livestreamUrl: data.livestreamUrl?.trim() || null,
      livestreamTitle: data.livestreamTitle?.trim() || null
    };
    updateMutation.mutate(sanitizedData);
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography>{t("organization.loading")}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 2 }}>
        <Settings size={32} />
        <Typography variant="h4" component="h1">
          {t("organization.title")}
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        {t("organization.subtitle")}
      </Alert>

      <Paper sx={{ p: 3 }}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <Building size={20} />
                {t("organization.basicInfo")}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("organization.fields.name")}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder={t("organization.fields.namePlaceholder")} 
                          data-testid="input-org-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("organization.fields.address")}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder={t("organization.fields.addressPlaceholder")} 
                          data-testid="input-org-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Box>
            </Box>

            {/* Contact Information */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <Phone size={20} />
                {t("organization.contactInfo")}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("organization.fields.phone")}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder={t("organization.fields.phonePlaceholder")} 
                            data-testid="input-org-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("organization.fields.email")}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email"
                            placeholder={t("organization.fields.emailPlaceholder")} 
                            data-testid="input-org-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mt: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Coins size={16} />
                          {t("organization.fields.currency")}
                        </FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger data-testid="select-currency">
                              <SelectValue placeholder={t("organization.fields.selectCurrency")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BAM">BAM (Bosanska marka)</SelectItem>
                              <SelectItem value="CHF">CHF (Švicarski franak)</SelectItem>
                              <SelectItem value="EUR">EUR (Euro)</SelectItem>
                              <SelectItem value="USD">USD (Američki dolar)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Box>
              </Box>
            </Box>

            {/* Social Media */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t("organization.socialMedia")}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <FormField
                      control={form.control}
                      name="facebookUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Facebook size={16} />
                            Facebook URL
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || ""}
                              placeholder="https://facebook.com/vasa-stranica" 
                              data-testid="input-org-facebook"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <FormField
                      control={form.control}
                      name="instagramUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Instagram size={16} />
                            Instagram URL
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || ""}
                              placeholder="https://instagram.com/vas-nalog" 
                              data-testid="input-org-instagram"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <FormField
                      control={form.control}
                      name="youtubeUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Youtube size={16} />
                            YouTube URL
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || ""}
                              placeholder="https://youtube.com/@vas-kanal" 
                              data-testid="input-org-youtube"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <FormField
                      control={form.control}
                      name="twitterUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Twitter size={16} />
                            X (Twitter) URL
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || ""}
                              placeholder="https://x.com/vas-nalog" 
                              data-testid="input-org-twitter"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
                data-testid="button-save-settings"
              >
                {t("organization.save")}
              </Button>
            </Box>
          </form>
        </Form>
      </Paper>
    </Container>
  );
}
