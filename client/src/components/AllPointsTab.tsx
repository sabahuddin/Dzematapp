import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  CircularProgress,
  Avatar,
  TextField,
  Button
} from '@mui/material';
import {
  Timeline,
  Download
} from '@mui/icons-material';
import { User } from '@shared/schema';
import { useAuth } from '../hooks/useAuth';
import { exportToExcel } from '../utils/excelExport';

export default function AllPointsTab() {
  const { user: currentUser, isLoading } = useAuth();
  const { t } = useTranslation(['activity', 'common']);
  const [searchTerm, setSearchTerm] = useState('');

  // Check if auth is loading
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Check admin access
  if (!currentUser?.isAdmin) {
    return (
      <Alert severity="error">
        {t('activity:accessDenied', 'Nemate pristup ovoj stranici')}
      </Alert>
    );
  }

  // Fetch users - SCOPED BY TENANT
  const usersQuery = useQuery<User[]>({
    queryKey: ['/api/users', currentUser?.tenantId],
    enabled: !!currentUser?.isAdmin,
  });

  const handleExport = () => {
    if (!usersQuery.data) return;
    
    const exportData = filteredUsers.map((user, index) => [
      (index + 1).toString(),
      `${user.firstName} ${user.lastName}`,
      user.email || '-',
      (user.totalPoints || 0).toString(),
    ]);

    exportToExcel({
      title: 'Svi bodovi',
      filename: 'svi-bodovi',
      sheetName: 'Bodovi',
      headers: ['#', 'Korisnik', 'Email', 'Bodovi'],
      data: exportData,
    });
  };

  if (usersQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (usersQuery.isError) {
    return (
      <Alert severity="error">
        {t('common:common.error')}
      </Alert>
    );
  }

  const users = usersQuery.data || [];
  
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      (user.email && user.email.toLowerCase().includes(searchLower))
    );
  }).sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));

  return (
    <Card>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Timeline color="primary" />
            <Typography variant="h5" component="h2">
              {t('activity:allPoints.title', 'Svi bodovi')}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExport}
            disabled={filteredUsers.length === 0}
          >
            {t('common:common.export', 'Izvezi')}
          </Button>
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder={t('activity:allPoints.search', 'Pretraži korisnike...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
          />
        </Box>

        {filteredUsers.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Timeline sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {searchTerm 
                ? t('activity:allPoints.noResults', 'Nema rezultata pretrage')
                : t('activity:allPoints.noUsers', 'Nema korisnika')}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('activity:allPoints.rank', '#')}</TableCell>
                  <TableCell>{t('activity:allPoints.user', 'Korisnik')}</TableCell>
                  <TableCell>{t('activity:allPoints.email', 'Email')}</TableCell>
                  <TableCell align="right">{t('activity:allPoints.points', 'Bodovi')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user, index) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {index + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                          {user.firstName[0]}{user.lastName[0]}
                        </Avatar>
                        <Typography variant="body2">
                          {user.firstName} {user.lastName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.email || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight="medium" color="primary">
                        {user.totalPoints || 0}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Card>
  );
}
