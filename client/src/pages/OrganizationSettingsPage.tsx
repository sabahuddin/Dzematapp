import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Container, Typography, Paper, Alert } from "@mui/material";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { OrganizationSettings, InsertOrganizationSettings } from "@shared/schema";
import { insertOrganizationSettingsSchema } from "@shared/schema";
import { Settings, Building, Phone, Mail, Facebook, Instagram, Youtube, Twitter, Radio } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function OrganizationSettingsPage() {
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
      return await apiRequest("/api/organization-settings", {
        method: "PUT",
        body: JSON.stringify(data)
      }) as OrganizationSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization-settings"] });
      toast({
        title: "Uspješno sačuvano",
        description: "Organizacioni podaci su uspješno ažurirani."
      });
    },
    onError: () => {
      toast({
        title: "Greška",
        description: "Nije moguće sačuvati organizacione podatke.",
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
        <Typography>Učitavanje...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 2 }}>
        <Settings size={32} />
        <Typography variant="h4" component="h1">
          Organizacioni podaci
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Ovi podaci će biti prikazani u podnožju aplikacije i dostupni svim korisnicima.
      </Alert>

      <Paper sx={{ p: 3 }}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <Building size={20} />
                Osnovni podaci
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Naziv organizacije</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Islamska Zajednica" 
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
                      <FormLabel>Adresa</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ulica Džemata 123" 
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
                Kontakt podaci
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="+387 33 123 456" 
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email"
                            placeholder="info@dzemat.ba" 
                            data-testid="input-org-email"
                          />
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
                Društvene mreže
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

            {/* Livestream Settings */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <Radio size={20} />
                Livestream podešavanja
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormField
                  control={form.control}
                  name="livestreamEnabled"
                  render={({ field }) => (
                    <FormItem>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-livestream-enabled"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0 cursor-pointer" onClick={() => field.onChange(!field.value)}>
                          Livestream aktivan
                        </FormLabel>
                      </Box>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="livestreamTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Naslov livestream-a (opciono)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ""}
                          placeholder="Npr. Petak hutba uživo" 
                          data-testid="input-livestream-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="livestreamUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Livestream URL ili embed kod</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          value={field.value || ""}
                          placeholder="Unesite YouTube/Facebook/Twitch embed kod ili URL"
                          rows={4}
                          data-testid="input-livestream-url"
                        />
                      </FormControl>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Možete unijeti YouTube embed kod (npr. &lt;iframe src="..."&gt;) ili direktan URL
                      </Typography>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Box>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
                data-testid="button-save-settings"
              >
                {updateMutation.isPending ? "Čuvanje..." : "Sačuvaj promjene"}
              </Button>
            </Box>
          </form>
        </Form>
      </Paper>
    </Container>
  );
}
