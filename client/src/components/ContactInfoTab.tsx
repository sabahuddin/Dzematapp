import { useQuery } from '@tanstack/react-query';
import { Box, Card, Typography, CircularProgress, Alert } from '@mui/material';
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube, Twitter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { OrganizationSettings } from '@shared/schema';
import { SiFacebook, SiInstagram, SiYoutube, SiX } from 'react-icons/si';

export default function ContactInfoTab() {
  const { t } = useTranslation('settings');
  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['/api/organization-settings']
  }) as { data: OrganizationSettings | undefined; isLoading: boolean; isError: boolean };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !settings) {
    return (
      <Alert severity="error">
        {t('organization.toast.error')}
      </Alert>
    );
  }

  return (
    <Card sx={{ p: 3 }}>
      {/* Basic Contact Info */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#0D1B2A' }}>
          {t('organization.basicInfo')}
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Organization Name */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
              {t('organization.fields.name')}
            </Typography>
            <Typography variant="body1">
              {settings.name}
            </Typography>
          </Box>

          {/* Address */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <MapPin size={20} style={{ color: '#3949AB', marginTop: 2 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                {t('organization.fields.address')}
              </Typography>
              <Typography variant="body1">
                {settings.address}
              </Typography>
            </Box>
          </Box>

          {/* Phone */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Phone size={20} style={{ color: '#3949AB', marginTop: 2 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                {t('organization.fields.phone')}
              </Typography>
              <Typography variant="body1">
                {settings.phone}
              </Typography>
            </Box>
          </Box>

          {/* Email */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Mail size={20} style={{ color: '#3949AB', marginTop: 2 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                {t('organization.fields.email')}
              </Typography>
              <Typography variant="body1">
                {settings.email}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Social Media */}
      {(settings.facebookUrl || settings.instagramUrl || settings.youtubeUrl || settings.twitterUrl) && (
        <Box>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#0D1B2A' }}>
            {t('organization.socialMedia')}
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {settings.facebookUrl && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SiFacebook size={20} style={{ color: '#1877f2' }} />
                <a 
                  href={settings.facebookUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#1877f2', textDecoration: 'none' }}
                >
                  {settings.facebookUrl}
                </a>
              </Box>
            )}
            
            {settings.instagramUrl && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SiInstagram size={20} style={{ color: '#e4405f' }} />
                <a 
                  href={settings.instagramUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#e4405f', textDecoration: 'none' }}
                >
                  {settings.instagramUrl}
                </a>
              </Box>
            )}
            
            {settings.youtubeUrl && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SiYoutube size={20} style={{ color: '#ff0000' }} />
                <a 
                  href={settings.youtubeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#ff0000', textDecoration: 'none' }}
                >
                  {settings.youtubeUrl}
                </a>
              </Box>
            )}
            
            {settings.twitterUrl && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SiX size={20} style={{ color: '#000000' }} />
                <a 
                  href={settings.twitterUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#000000', textDecoration: 'none' }}
                >
                  {settings.twitterUrl}
                </a>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Card>
  );
}
