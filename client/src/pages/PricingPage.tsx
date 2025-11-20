import { Box, Container, Typography, Card, CardContent, Button, Chip } from '@mui/material';
import { Check, Close, Star } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceMonthly: string;
  priceYearly: string;
  currency: string;
  enabledModules: string[];
  readOnlyModules: string[];
  maxUsers: number | null;
  maxStorage: number | null;
  isActive: boolean;
}

const FEATURE_CATEGORIES = {
  basic: {
    title: "Osnovne funkcionalnosti",
    features: [
      { id: "dashboard", name: "Dashboard i statistika" },
      { id: "announcements", name: "Obavještenja" },
      { id: "events", name: "Događaji i kalendar" },
      { id: "users", name: "Upravljanje korisnicima" },
      { id: "vaktija", name: "Vaktija (klanjanja)" },
      { id: "vodic", name: "Vodič za vjeru" },
    ]
  },
  standard: {
    title: "Dodatne funkcionalnosti",
    features: [
      { id: "tasks", name: "Sekcije i zadaci" },
      { id: "messages", name: "Interni chat sistem" },
      { id: "documents", name: "Dokumenti i dijeljenje" },
      { id: "finances", name: "Finansijsko upravljanje" },
      { id: "projects", name: "Projekti džemata" },
      { id: "feed", name: "Activity Feed" },
    ]
  },
  premium: {
    title: "Premium funkcionalnosti",
    features: [
      { id: "shop", name: "DžematShop" },
      { id: "marketplace", name: "Marketplace za članove" },
      { id: "ask-imam", name: "Pitaj imama" },
      { id: "certificates", name: "Zahvalnice i certifikati" },
      { id: "badges", name: "Značke i priznanja" },
      { id: "livestream", name: "Live prijenos" },
      { id: "applications", name: "Pristupnice (Akika, Nikah)" },
    ]
  }
};

export default function PricingPage() {
  const { data: plans, isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription/plans'],
  });

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography>Učitavanje paketa...</Typography>
      </Container>
    );
  }

  const sortedPlans = plans?.sort((a, b) => {
    const order = { basic: 1, standard: 2, full: 3 };
    return order[a.slug as keyof typeof order] - order[b.slug as keyof typeof order];
  }) || [];

  const isFeatureEnabled = (plan: SubscriptionPlan, featureId: string) => {
    return plan.enabledModules.includes(featureId);
  };

  const isFeatureReadOnly = (plan: SubscriptionPlan, featureId: string) => {
    return plan.readOnlyModules?.includes(featureId) || false;
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
            Odaberite pravi paket za vaš džemat
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Transparentne cijene, bez skrivenih troškova. Promijenite paket u bilo kojem trenutku.
          </Typography>
        </Box>

        {/* Pricing Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4, mb: 8 }}>
          {sortedPlans.map((plan, index) => {
            const isPopular = plan.slug === 'standard';
            
            return (
              <Box key={plan.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    border: isPopular ? '2px solid' : '1px solid',
                    borderColor: isPopular ? 'primary.main' : 'divider',
                    transform: isPopular ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: isPopular ? 'scale(1.07)' : 'scale(1.02)',
                      boxShadow: 6
                    }
                  }}
                  data-testid={`card-pricing-${plan.slug}`}
                >
                  {isPopular && (
                    <Chip
                      icon={<Star />}
                      label="Najpopularnije"
                      color="primary"
                      sx={{
                        position: 'absolute',
                        top: -12,
                        right: 20,
                        fontWeight: 600
                      }}
                    />
                  )}
                  
                  <CardContent sx={{ flexGrow: 1, p: 4 }}>
                    {/* Plan Name */}
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      {plan.name}
                    </Typography>
                    
                    {/* Description */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 48 }}>
                      {plan.description}
                    </Typography>
                    
                    {/* Price */}
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h3" sx={{ fontWeight: 700 }}>
                        €{plan.priceMonthly}
                        <Typography component="span" variant="body1" color="text.secondary">
                          /mjesec
                        </Typography>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ili €{plan.priceYearly}/godišnje
                      </Typography>
                    </Box>
                    
                    {/* Limits */}
                    <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Max korisnika:</strong> {plan.maxUsers || 'Neograničeno'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Storage:</strong> {plan.maxStorage ? `${plan.maxStorage} MB` : 'Neograničeno'}
                      </Typography>
                    </Box>
                    
                    {/* CTA Button */}
                    <Button
                      variant={isPopular ? "contained" : "outlined"}
                      size="large"
                      fullWidth
                      sx={{
                        mb: 3,
                        py: 1.5,
                        fontWeight: 600,
                        fontSize: '1rem'
                      }}
                      data-testid={`button-select-${plan.slug}`}
                    >
                      Odaberi {plan.name}
                    </Button>
                    
                    {/* Trial Notice */}
                    {plan.slug === 'full' && (
                      <Chip
                        label="7 dana besplatno testiranje"
                        color="success"
                        size="small"
                        sx={{ mb: 2, width: '100%' }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>

        {/* Feature Comparison */}
        <Box sx={{ mt: 8 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, textAlign: 'center' }}>
            Detaljno poređenje funkcionalnosti
          </Typography>
          
          {Object.entries(FEATURE_CATEGORIES).map(([categoryKey, category]) => (
            <Box key={categoryKey} sx={{ mb: 6 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                {category.title}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {category.features.map((feature) => (
                  <Card variant="outlined" key={feature.id}>
                    <CardContent sx={{ py: 2 }}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr 1fr' }, alignItems: 'center', gap: 2 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {feature.name}
                        </Typography>
                        
                        {sortedPlans.map((plan) => {
                          const enabled = isFeatureEnabled(plan, feature.id);
                          const readOnly = isFeatureReadOnly(plan, feature.id);
                          
                          return (
                            <Box key={plan.id} sx={{ textAlign: 'center' }}>
                              {enabled ? (
                                <Check color="success" />
                              ) : readOnly ? (
                                <Typography variant="caption" color="text.secondary">
                                  Preview
                                </Typography>
                              ) : (
                                <Close color="disabled" />
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          ))}
        </Box>

        {/* FAQ or Contact */}
        <Box sx={{ mt: 8, textAlign: 'center', p: 4, bgcolor: 'primary.main', color: 'white', borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Imate pitanja?
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Kontaktirajte nas za besplatnu demonstraciju ili pomoć pri odabiru pravog paketa.
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)'
              }
            }}
            data-testid="button-contact-sales"
          >
            Kontaktirajte nas
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
