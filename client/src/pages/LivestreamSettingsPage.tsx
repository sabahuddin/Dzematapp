import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  AlertTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from "@mui/material";
import { Radio, CheckCircle, Info, ExpandMore, Tv } from "@mui/icons-material";
import { insertOrganizationSettingsSchema } from "@shared/schema";
import type { OrganizationSettings, InsertOrganizationSettings } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function LivestreamSettingsPage() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<OrganizationSettings>({
    queryKey: ["/api/organization-settings"]
  });

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
      const response = await fetch("/api/organization-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error("Failed to update settings");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization-settings"] });
      toast({
        title: "Uspješno",
        description: "Livestream podešavanja su sačuvana"
      });
    },
    onError: () => {
      toast({
        title: "Greška",
        description: "Nije moguće sačuvati podešavanja",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: InsertOrganizationSettings) => {
    const sanitizedData = {
      ...data,
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1, display: "flex", alignItems: "center", gap: 2 }}>
          <Tv sx={{ fontSize: 40, color: "#1976d2" }} />
          Livestream Upravljanje
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Omogućite direktan prenos događaja, hutbi i programa uživo
        </Typography>
      </Box>

      {/* Information Card */}
      <Card sx={{ mb: 3, bgcolor: "#e3f2fd", borderLeft: "4px solid #1976d2" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "start", gap: 2 }}>
            <Info sx={{ color: "#1976d2", mt: 0.5 }} />
            <Box>
              <Typography variant="h6" sx={{ mb: 1, color: "#1976d2" }}>
                Šta je Livestream?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Livestream omogućava vašoj zajednici da prati događaje, hutbe i programe u realnom vremenu putem interneta, bez potrebe da fizički prisustvuju.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Korisnici mogu pratiti livestream direktno iz aplikacije, što omogućava pristup osobama koje su odsutne, bolesne ili udaljene.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* How to Use Guide */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircle sx={{ color: "#2e7d32" }} />
            Kako koristiti Livestream
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <Typography sx={{ bgcolor: "#1976d2", color: "white", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                  1
                </Typography>
              </ListItemIcon>
              <ListItemText
                primary="Izaberite platformu za streaming"
                secondary="YouTube Live, Facebook Live, Twitch ili druga platforma"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Typography sx={{ bgcolor: "#1976d2", color: "white", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                  2
                </Typography>
              </ListItemIcon>
              <ListItemText
                primary="Započnite livestream na odabranoj platformi"
                secondary="Kreirajte događaj i dobijete embed kod ili URL"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Typography sx={{ bgcolor: "#1976d2", color: "white", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                  3
                </Typography>
              </ListItemIcon>
              <ListItemText
                primary="Kopirajte embed kod ili URL"
                secondary="Sa platforme kopirajte iframe embed kod ili direktan link do streama"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Typography sx={{ bgcolor: "#1976d2", color: "white", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                  4
                </Typography>
              </ListItemIcon>
              <ListItemText
                primary="Unesite URL/kod u polje ispod"
                secondary="Zalijepite embed kod ili URL u 'Livestream URL ili embed kod' polje"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Typography sx={{ bgcolor: "#1976d2", color: "white", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                  5
                </Typography>
              </ListItemIcon>
              <ListItemText
                primary="Aktivirajte livestream"
                secondary="Uključite prekidač 'Livestream aktivan' i sačuvajte"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Platform Examples */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Primjeri embed kodova
          </Typography>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography sx={{ fontWeight: 600 }}>YouTube Live</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ bgcolor: "#f5f5f5", p: 2, borderRadius: 1, fontFamily: "monospace", fontSize: "0.875rem", overflow: "auto" }}>
                {`<iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>`}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Zamijenite VIDEO_ID sa ID-jem vašeg YouTube Live video zapisa
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography sx={{ fontWeight: 600 }}>Facebook Live</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ bgcolor: "#f5f5f5", p: 2, borderRadius: 1, fontFamily: "monospace", fontSize: "0.875rem", overflow: "auto" }}>
                {`<iframe src="https://www.facebook.com/plugins/video.php?href=VIDEO_URL" width="560" height="315" frameborder="0" allowfullscreen></iframe>`}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Zamijenite VIDEO_URL sa linkom do vašeg Facebook Live događaja
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography sx={{ fontWeight: 600 }}>Direktan URL</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ bgcolor: "#f5f5f5", p: 2, borderRadius: 1, fontFamily: "monospace", fontSize: "0.875rem", overflow: "auto" }}>
                {`https://www.youtube.com/watch?v=VIDEO_ID`}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Možete koristiti i direktan link do video zapisa
              </Typography>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>

      {/* Settings Form */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
            <Radio />
            Livestream Podešavanja
          </Typography>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Kada je aktivno, korisnici će vidjeti livestream na posebnoj stranici
                      </Typography>
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
                          placeholder="Npr. Petak hutba uživo, Edukacioni program, Mevlud" 
                          data-testid="input-livestream-title"
                        />
                      </FormControl>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Ovaj naslov će se prikazati korisnicima iznad livestream-a
                      </Typography>
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
                          rows={6}
                          data-testid="input-livestream-url"
                        />
                      </FormControl>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Možete unijeti YouTube/Facebook embed kod (npr. &lt;iframe src="..."&gt;) ili direktan URL
                      </Typography>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Divider />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={updateMutation.isPending}
                    data-testid="button-save-livestream"
                  >
                    {updateMutation.isPending ? "Čuvanje..." : "Sačuvaj Podešavanja"}
                  </Button>
                </Box>
              </Box>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <AlertTitle>Savjeti za uspješan livestream</AlertTitle>
        <List dense>
          <ListItem sx={{ pl: 0 }}>
            <ListItemText primary="• Testirajte livestream prije događaja kako biste osigurali da sve radi" />
          </ListItem>
          <ListItem sx={{ pl: 0 }}>
            <ListItemText primary="• Osigurajte stabilnu internet vezu za neometani prenos" />
          </ListItem>
          <ListItem sx={{ pl: 0 }}>
            <ListItemText primary="• Obavijestite zajednicu unaprijed o vremenu livestream događaja" />
          </ListItem>
          <ListItem sx={{ pl: 0 }}>
            <ListItemText primary="• Koristite kvalitetan mikrofon i kameru za bolji doživljaj" />
          </ListItem>
        </List>
      </Alert>
    </Container>
  );
}
