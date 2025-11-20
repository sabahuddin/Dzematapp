import { Card, CardContent, Typography, Button, Box, Chip, CircularProgress } from '@mui/material';
import { LockOpen, Upgrade, CheckCircle } from '@mui/icons-material';
import { getModuleDisplayName } from '@/hooks/useFeatureAccess';
import { useQuery } from '@tanstack/react-query';

interface UpgradeCTAProps {
  moduleId: string;
  requiredPlan: string;
  currentPlan: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceMonthly: string;
  priceYearly: string;
  currency: string;
  enabledModules: string[];
  maxUsers: number | null;
  maxStorage: number | null;
}

export function UpgradeCTA({ moduleId, requiredPlan, currentPlan }: UpgradeCTAProps) {
  const featureName = getModuleDisplayName(moduleId);
  
  // Fetch pricing plans dynamically
  const { data: plans, isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription/plans'],
    staleTime: 300000, // Cache for 5 minutes
  });
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  const plan = plans?.find(p => p.slug === requiredPlan);
  const currentPlanData = plans?.find(p => p.slug === currentPlan);
  
  if (!plan) {
    return null;
  }
  
  const requiredPlanName = plan.name;
  const requiredPrice = `€${plan.priceMonthly}`;
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        p: 3
      }}
    >
      <Card
        sx={{
          maxWidth: 600,
          width: '100%',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.37)'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Lock Icon */}
          <Box sx={{ mb: 2 }}>
            <LockOpen sx={{ fontSize: 64, opacity: 0.9 }} />
          </Box>
          
          {/* Title */}
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Otključaj {featureName}
          </Typography>
          
          {/* Description */}
          <Typography variant="body1" sx={{ mb: 3, opacity: 0.9, fontSize: '1.1rem' }}>
            Ova funkcionalnost je dostupna u <strong>{requiredPlanName}</strong> paketu.
          </Typography>
          
          {/* Current Plan Badge */}
          <Box sx={{ mb: 3 }}>
            <Chip 
              label={`Trenutni paket: ${currentPlanData?.name || currentPlan}`}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            />
          </Box>
          
          {/* Features List */}
          <Box sx={{ mb: 4, textAlign: 'left', maxWidth: 400, mx: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
              {requiredPlanName} Paket Uključuje:
            </Typography>
            {getFeaturesList(plan).map((feature, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <CheckCircle sx={{ mr: 1.5, fontSize: 20 }} />
                <Typography variant="body2">{feature}</Typography>
              </Box>
            ))}
          </Box>
          
          {/* Price */}
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            {requiredPrice}
            <Typography component="span" variant="body1" sx={{ ml: 1 }}>
              / mjesečno
            </Typography>
          </Typography>
          
          {/* CTA Button */}
          <Button
            variant="contained"
            size="large"
            startIcon={<Upgrade />}
            onClick={() => {
              // TODO: Redirect to pricing/upgrade page or contact admin
              alert(`Za nadogradnju na ${requiredPlanName} paket, kontaktirajte vašeg administratora ili Super Admina.`);
            }}
            sx={{
              mt: 3,
              bgcolor: 'white',
              color: '#667eea',
              fontWeight: 700,
              fontSize: '1.1rem',
              px: 4,
              py: 1.5,
              borderRadius: 2,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s'
            }}
            data-testid="button-upgrade"
          >
            Nadogradi na {requiredPlanName}
          </Button>
          
          {/* Footer Note */}
          <Typography variant="caption" sx={{ mt: 3, display: 'block', opacity: 0.8 }}>
            Paket možete promijeniti u bilo kojem trenutku
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

function getFeaturesList(plan: SubscriptionPlan): string[] {
  const features: string[] = [];
  
  // User limits
  if (plan.maxUsers) {
    features.push(`Do ${plan.maxUsers} korisnika`);
  } else {
    features.push('Neograničen broj korisnika');
  }
  
  // Storage limits
  if (plan.maxStorage) {
    features.push(`${plan.maxStorage} MB storage-a`);
  } else {
    features.push('Neograničen storage');
  }
  
  // Key modules based on plan
  if (plan.slug === 'basic') {
    features.push('Dashboard i statistika', 'Obavještenja i događaji', 'Vaktija i vodič');
  } else if (plan.slug === 'standard') {
    features.push('Sve iz Basic paketa', 'Sekcije i zadaci', 'Poruke i dokumenti', 'Finansije i projekti');
  } else if (plan.slug === 'full') {
    features.push('Sve iz Standard paketa', 'DžematShop i Marketplace', 'Pitaj imama', 'Live prijenos', 'Zahvalnice i značke');
  }
  
  return features;
}
