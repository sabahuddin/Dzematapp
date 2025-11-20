import React, { useState, useEffect } from 'react';
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
  ToggleButton,
  Snackbar,
  IconButton,
  Link as MuiLink
} from '@mui/material';
import { Download, Close, Business } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { DzematLogo } from '@/components/DzematLogo';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const TENANT_STORAGE_KEY = 'dzemat_tenant_id';

export default function LoginPage() {
  const { t, i18n } = useTranslation(['login', 'common']);
  const [, setLocation] = useLocation();
  const [showTenantSetup, setShowTenantSetup] = useState(false);
  const [tenantCode, setTenantCode] = useState('');
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyingTenant, setVerifyingTenant] = useState(false);
  const { login } = useAuth();
  const { isInstallable, promptInstall } = usePWAInstall();
  const [showInstallPrompt, setShowInstallPrompt] = useState(true);
  const [storedTenantId, setStoredTenantId] = useState<string | null>(null);
  
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [logoClickTimer, setLogoClickTimer] = useState<NodeJS.Timeout | null>(null);

  // Check if tenant is already set
  useEffect(() => {
    const savedTenantId = localStorage.getItem(TENANT_STORAGE_KEY);
    if (savedTenantId) {
      setStoredTenantId(savedTenantId);
      setShowTenantSetup(false);
    } else {
      setShowTenantSetup(true);
    }
  }, []);

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

  const handleVerifyTenant = async () => {
    if (!tenantCode.trim()) {
      setError('Molimo unesite kod organizacije');
      return;
    }

    setVerifyingTenant(true);
    setError('');

    try {
      const response = await fetch('/api/tenants/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantCode: tenantCode.trim().toUpperCase() })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem(TENANT_STORAGE_KEY, data.tenantId);
        setStoredTenantId(data.tenantId);
        setShowTenantSetup(false);
        setTenantCode('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Neispravan kod organizacije');
      }
    } catch (err) {
      setError('Greška pri provjeri koda');
    } finally {
      setVerifyingTenant(false);
    }
  };

  const handleChangeTenant = () => {
    localStorage.removeItem(TENANT_STORAGE_KEY);
    setStoredTenantId(null);
    setShowTenantSetup(true);
    setFormData({ username: '', password: '' });
  };

  const handleLogoClick = () => {
    if (logoClickTimer) {
      clearTimeout(logoClickTimer);
    }

    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);

    if (newCount >= 5) {
      setLogoClickCount(0);
      setLocation('/superadmin/login');
      return;
    }

    const timer = setTimeout(() => {
      setLogoClickCount(0);
    }, 2000);
    setLogoClickTimer(timer);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (!storedTenantId) {
      setError('Morate prvo postaviti organizaciju');
      setLoading(false);
      return;
    }

    try {
      const success = await login(formData.username, formData.password, storedTenantId);
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

  const handleInstallClick = async () => {
    const installed = await promptInstall();
    if (installed) {
      setShowInstallPrompt(false);
    }
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
              <Box 
                onClick={handleLogoClick}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 1,
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                data-testid="logo-container"
              >
                <DzematLogo size={72} />
                <Typography variant="h3" sx={{ fontWeight: 600, color: 'hsl(207 88% 55%)', fontFamily: 'Aladin, cursive' }}>
                  {t('login:title')}
                </Typography>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {showTenantSetup ? (
              /* Tenant Code Setup */
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Alert severity="info" sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                    Prva prijava
                  </Typography>
                  <Typography variant="caption">
                    Unesite kod vaše organizacije koji ste dobili od administratora.
                  </Typography>
                </Alert>

                <TextField
                  fullWidth
                  variant="outlined"
                  label="Kod organizacije"
                  value={tenantCode}
                  onChange={(e) => setTenantCode(e.target.value.toUpperCase())}
                  placeholder="DEMO2024"
                  InputProps={{
                    startAdornment: <Business sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  data-testid="input-tenant-code"
                />

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={verifyingTenant || !tenantCode.trim()}
                  onClick={handleVerifyTenant}
                  sx={{ py: 1.5, fontSize: '1rem' }}
                  data-testid="button-verify-tenant"
                >
                  {verifyingTenant ? 'Provjeravam...' : 'Potvrdi'}
                </Button>

                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Za demo pristup koristite:
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                    Kod: DEMO2024
                  </Typography>
                </Box>
              </Box>
            ) : (
              /* Normal Login Form */
              <>
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

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <MuiLink
                    component="button"
                    type="button"
                    variant="caption"
                    onClick={handleChangeTenant}
                    sx={{ cursor: 'pointer' }}
                    data-testid="link-change-tenant"
                  >
                    Promijenite organizaciju
                  </MuiLink>
                </Box>

                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
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
              </>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* PWA Install Prompt */}
      <Snackbar
        open={isInstallable && showInstallPrompt}
        onClose={() => setShowInstallPrompt(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 90, sm: 24 } }}
      >
        <Box
          sx={{
            bgcolor: '#1976d2',
            color: 'white',
            px: 3,
            py: 2,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          <Download />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Instalirajte DžematApp
            </Typography>
            <Typography variant="caption">
              Koristite kao pravu aplikaciju
            </Typography>
          </Box>
          <Button
            size="small"
            variant="contained"
            onClick={handleInstallClick}
            sx={{
              bgcolor: 'white',
              color: '#1976d2',
              '&:hover': { bgcolor: 'grey.100' }
            }}
          >
            Instaliraj
          </Button>
          <IconButton
            size="small"
            onClick={() => setShowInstallPrompt(false)}
            sx={{ color: 'white', ml: -1 }}
          >
            <Close />
          </IconButton>
        </Box>
      </Snackbar>
    </Box>
  );
}
