import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { DzematLogo } from '@/components/DzematLogo';

export default function LoginPage() {
  const { t, i18n } = useTranslation(['login', 'common']);
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLanguageChange = (event: React.MouseEvent<HTMLElement>, newLanguage: string | null) => {
    if (newLanguage) {
      i18n.changeLanguage(newLanguage);
      localStorage.setItem('language', newLanguage);
    }
  };

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(formData.username, formData.password);
      if (success) {
        setLocation('/dashboard');
      } else {
        setError(t('common:messages.error'));
      }
    } catch (err) {
      setError(t('common:messages.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = () => {
    setLocation('/guest');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--semantic-info-gradient-start) 0%, var(--semantic-info-gradient-end) 100%)',
        p: 2
      }}
    >
      <Container maxWidth="xs">
        <Card 
          sx={{ 
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            p: 2
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Language Selector */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <ToggleButtonGroup
                value={i18n.language}
                exclusive
                onChange={handleLanguageChange}
                size="small"
                sx={{ boxShadow: 1 }}
                data-testid="language-selector"
              >
                <ToggleButton value="bs" data-testid="language-bs">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span style={{ fontSize: '18px' }}>🇧🇦</span>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>BS</Typography>
                  </Box>
                </ToggleButton>
                <ToggleButton value="sq" data-testid="language-sq">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span style={{ fontSize: '18px' }}>🇦🇱</span>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>SQ</Typography>
                  </Box>
                </ToggleButton>
                <ToggleButton value="de" data-testid="language-de">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span style={{ fontSize: '18px' }}>🇩🇪</span>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>DE</Typography>
                  </Box>
                </ToggleButton>
                <ToggleButton value="en" data-testid="language-en">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span style={{ fontSize: '18px' }}>🇺🇸</span>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>EN</Typography>
                  </Box>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 1 }}>
                <DzematLogo size={60} />
                <Typography variant="h3" sx={{ fontWeight: 600, color: 'hsl(207 88% 55%)', fontFamily: 'Aladin, cursive' }}>
                  {t('login:title')}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {t('login:subtitle')}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label={t('login:username')}
                  type="text"
                  value={formData.username}
                  onChange={handleChange('username')}
                  placeholder="admin"
                  data-testid="input-username"
                />

                <TextField
                  fullWidth
                  variant="outlined"
                  label={t('login:password')}
                  type="password"
                  value={formData.password}
                  onChange={handleChange('password')}
                  placeholder="••••••••"
                  required
                  data-testid="input-password"
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{ py: 1.5, fontSize: '1rem' }}
                  data-testid="button-login"
                >
                  {loading ? t('login:loggingIn') : t('login:loginButton')}
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  onClick={handleGuestAccess}
                  sx={{ py: 1.5, fontSize: '1rem' }}
                  data-testid="button-guest"
                >
                  {t('login:guestButton')}
                </Button>
              </Box>
            </form>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                {t('login:demoCredentials')}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {t('login:username')}: admin | {t('login:password')}: admin123
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {t('login:username')}: ali.alic | {t('login:password')}: password123
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
