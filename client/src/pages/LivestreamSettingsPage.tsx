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
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("settings");
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
        title: t("livestreamSettings.toast.success"),
        description: t("livestreamSettings.toast.successDescription")
      });
    },
    onError: () => {
      toast({
        title: t("livestreamSettings.toast.error"),
        description: t("livestreamSettings.toast.errorDescription"),
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
        <Typography>{t("livestreamSettings.loading")}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1, display: "flex", alignItems: "center", gap: 2 }}>
          <Tv sx={{ fontSize: 40, color: 'hsl(207 88% 55%)' }} />
          {t("livestreamSettings.title")}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t("livestreamSettings.subtitle")}
        </Typography>
      </Box>

      {/* Information Card */}
      <Card sx={{ mb: 3, bgcolor: 'hsl(207 90% 95%)', borderLeft: '4px solid hsl(207 88% 55%)' }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "start", gap: 2 }}>
            <Info sx={{ color: 'hsl(207 88% 55%)', mt: 0.5 }} />
            <Box>
              <Typography variant="h6" sx={{ mb: 1, color: 'hsl(207 88% 55%)' }}>
                {t("livestreamSettings.whatIsLivestream.title")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t("livestreamSettings.whatIsLivestream.description1")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("livestreamSettings.whatIsLivestream.description2")}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* How to Use Guide */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircle sx={{ color: 'hsl(122 60% 29%)' }} />
            {t("livestreamSettings.howToUse.title")}
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <Typography sx={{ bgcolor: 'hsl(207 88% 55%)', color: "white", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                  1
                </Typography>
              </ListItemIcon>
              <ListItemText
                primary={t("livestreamSettings.howToUse.step1.title")}
                secondary={t("livestreamSettings.howToUse.step1.description")}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Typography sx={{ bgcolor: 'hsl(207 88% 55%)', color: "white", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                  2
                </Typography>
              </ListItemIcon>
              <ListItemText
                primary={t("livestreamSettings.howToUse.step2.title")}
                secondary={t("livestreamSettings.howToUse.step2.description")}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Typography sx={{ bgcolor: 'hsl(207 88% 55%)', color: "white", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                  3
                </Typography>
              </ListItemIcon>
              <ListItemText
                primary={t("livestreamSettings.howToUse.step3.title")}
                secondary={t("livestreamSettings.howToUse.step3.description")}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Typography sx={{ bgcolor: 'hsl(207 88% 55%)', color: "white", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                  4
                </Typography>
              </ListItemIcon>
              <ListItemText
                primary={t("livestreamSettings.howToUse.step4.title")}
                secondary={t("livestreamSettings.howToUse.step4.description")}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Typography sx={{ bgcolor: 'hsl(207 88% 55%)', color: "white", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                  5
                </Typography>
              </ListItemIcon>
              <ListItemText
                primary={t("livestreamSettings.howToUse.step5.title")}
                secondary={t("livestreamSettings.howToUse.step5.description")}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Platform Examples */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t("livestreamSettings.examples.title")}
          </Typography>
          
          <Accordion TransitionProps={{ unmountOnExit: false, timeout: 0 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography sx={{ fontWeight: 600 }}>{t("livestreamSettings.examples.youtubeAccordion")}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ bgcolor: 'hsl(0 0% 96%)', p: 2, borderRadius: 1, fontFamily: "monospace", fontSize: "0.875rem", overflow: "auto" }}>
                {`<iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>`}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                {t("livestreamSettings.examples.youtubeDescription")}
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion TransitionProps={{ unmountOnExit: false, timeout: 0 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography sx={{ fontWeight: 600 }}>{t("livestreamSettings.examples.facebookAccordion")}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ bgcolor: 'hsl(0 0% 96%)', p: 2, borderRadius: 1, fontFamily: "monospace", fontSize: "0.875rem", overflow: "auto" }}>
                {`<iframe src="https://www.facebook.com/plugins/video.php?href=VIDEO_URL" width="560" height="315" frameborder="0" allowfullscreen></iframe>`}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                {t("livestreamSettings.examples.facebookDescription")}
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion TransitionProps={{ unmountOnExit: false, timeout: 0 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography sx={{ fontWeight: 600 }}>{t("livestreamSettings.examples.directAccordion")}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ bgcolor: 'hsl(0 0% 96%)', p: 2, borderRadius: 1, fontFamily: "monospace", fontSize: "0.875rem", overflow: "auto" }}>
                {`https://www.youtube.com/watch?v=VIDEO_ID`}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                {t("livestreamSettings.examples.directDescription")}
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
            {t("livestreamSettings.title")}
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
                          {t("livestreamSettings.fields.livestreamEnabled")}
                        </FormLabel>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {t("livestreamSettings.fields.livestreamEnabledHelper")}
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
                      <FormLabel>{t("livestreamSettings.fields.livestreamTitle")}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ""}
                          placeholder={t("organization.fields.livestreamTitlePlaceholder")} 
                          data-testid="input-livestream-title"
                        />
                      </FormControl>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {t("livestreamSettings.fields.livestreamTitleHelper")}
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
                      <FormLabel>{t("livestreamSettings.fields.livestreamUrl")}</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          value={field.value || ""}
                          placeholder={t("organization.fields.livestreamUrlPlaceholder")}
                          rows={6}
                          data-testid="input-livestream-url"
                        />
                      </FormControl>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {t("livestreamSettings.fields.livestreamUrlHelper")}
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
                    {t("livestreamSettings.save")}
                  </Button>
                </Box>
              </Box>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <AlertTitle>{t("livestreamSettings.tips.title")}</AlertTitle>
        <List dense>
          <ListItem sx={{ pl: 0 }}>
            <ListItemText primary={t("livestreamSettings.tips.tip1")} />
          </ListItem>
          <ListItem sx={{ pl: 0 }}>
            <ListItemText primary={t("livestreamSettings.tips.tip2")} />
          </ListItem>
          <ListItem sx={{ pl: 0 }}>
            <ListItemText primary={t("livestreamSettings.tips.tip3")} />
          </ListItem>
          <ListItem sx={{ pl: 0 }}>
            <ListItemText primary={t("livestreamSettings.tips.tip4")} />
          </ListItem>
        </List>
      </Alert>
    </Container>
  );
}
