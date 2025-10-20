import React, { useState } from 'react';
import { useLocation } from 'wouter';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import mosqueLogoPath from '@assets/mosque-logo.png';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

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
        setError('Nevažeće korisničko ime ili šifra');
      }
    } catch (err) {
      setError('Greška pri prijavljivanju');
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
        background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
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
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                <img 
                  src={mosqueLogoPath} 
                  alt="Mosque Logo" 
                  style={{ width: 40, height: 40, objectFit: 'contain' }}
                />
                <Typography variant="h4" sx={{ fontWeight: 600, color: '#1976d2', fontFamily: 'Aladin, cursive' }}>
                  DžematApp
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Admin Dashboard
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
                  label="Korisničko ime"
                  type="text"
                  value={formData.username}
                  onChange={handleChange('username')}
                  placeholder="admin"
                  data-testid="input-username"
                />

                <TextField
                  fullWidth
                  variant="outlined"
                  label="Šifra"
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
                  {loading ? 'Prijavljivanje...' : 'Prijavi se'}
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  onClick={handleGuestAccess}
                  sx={{ py: 1.5, fontSize: '1rem' }}
                  data-testid="button-guest"
                >
                  Gost
                </Button>
              </Box>
            </form>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Demo podaci:
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Korisničko ime: admin | Šifra: admin123
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
