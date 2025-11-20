import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Box, 
  Container, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Typography, 
  Alert,
  Link as MuiLink
} from '@mui/material';
import { Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SuperAdminLoginPage() {
  const [, setLocation] = useLocation();
  const { loginAsSuperAdmin } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: 'username' | 'password') => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await loginAsSuperAdmin(formData.username, formData.password);
      if (success) {
        setLocation('/super-admin/panel');
      } else {
        setError('Invalid Super Admin credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                <Shield size={48} color="#9c27b0" />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a237e', mb: 1 }}>
                Super Admin
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Multi-Tenant Management Portal
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
                  label="Username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange('username')}
                  placeholder="superadmin"
                  required
                  data-testid="input-superadmin-username"
                />

                <TextField
                  fullWidth
                  variant="outlined"
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange('password')}
                  placeholder="••••••••"
                  required
                  data-testid="input-superadmin-password"
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{ 
                    py: 1.5, 
                    fontSize: '1rem',
                    bgcolor: '#1a237e',
                    '&:hover': {
                      bgcolor: '#0d1642'
                    }
                  }}
                  data-testid="button-superadmin-login"
                >
                  {loading ? 'Logging in...' : 'Login as Super Admin'}
                </Button>
              </Box>
            </form>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <MuiLink
                component="button"
                type="button"
                variant="caption"
                onClick={() => setLocation('/')}
                sx={{ cursor: 'pointer' }}
                data-testid="link-regular-login"
              >
                Back to Regular Login
              </MuiLink>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
