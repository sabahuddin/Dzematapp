import { Box, Typography, Button, Card, CardContent, Avatar, Chip, Divider } from '@mui/material';
import { Edit, Person } from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@shared/schema';
import { useState } from 'react';
import UserModal from '@/components/modals/UserModal';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDateForDisplay } from '@/utils/dateUtils';

export default function MyProfilePage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Fetch full user data from API
  const { data: user, isLoading } = useQuery<any>({
    queryKey: ['/api/users', currentUser?.id],
    enabled: !!currentUser?.id,
  });

  // Fetch family relationships
  const { data: familyRelationships = [] } = useQuery<any[]>({
    queryKey: ['/api/family-relationships', currentUser?.id],
    enabled: !!currentUser?.id,
    staleTime: 0,
    gcTime: 0,
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest(`/api/users/${currentUser?.id}`, 'PUT', userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
      toast({ title: 'Uspješno', description: 'Profil je uspješno ažuriran' });
      setModalOpen(false);
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri ažuriranju profila', variant: 'destructive' });
    }
  });

  const handleSave = (userData: any) => {
    updateUserMutation.mutate(userData);
  };

  const getRoleLabel = (role: string) => {
    const roleMap: { [key: string]: string } = {
      admin: 'Admin',
      clanIO: 'Član IO',
      clan: 'Član',
      clanPorodice: 'Član porodice'
    };
    return roleMap[role] || role;
  };

  const getRoleColor = (role: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    const colorMap: { [key: string]: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" } = {
      admin: 'error',
      clanIO: 'primary',
      clan: 'success',
      clanPorodice: 'info'
    };
    return colorMap[role] || 'default';
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Učitavanje...</Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Korisnik nije pronađen</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'hsl(123 46% 34%)' }}>
          Moj Profil
        </Typography>
        <Button
          variant="contained"
          startIcon={<Edit />}
          onClick={() => {
            setEditMode(true);
            setModalOpen(true);
          }}
          data-testid="button-edit-profile"
          sx={{
            bgcolor: 'hsl(123 46% 34%)',
            '&:hover': {
              bgcolor: 'hsl(123 46% 24%)',
            }
          }}
        >
          Uredi profil
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
            <Avatar
              src={user.photo || undefined}
              sx={{ width: 100, height: 100 }}
              data-testid="profile-avatar"
            >
              <Person sx={{ fontSize: 60 }} />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                {user.firstName} {user.lastName}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((role: string, index: number) => (
                    <Chip
                      key={index}
                      label={getRoleLabel(role)}
                      size="small"
                      color={getRoleColor(role)}
                    />
                  ))
                ) : null}
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Korisničko ime
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {user.username || '-'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Email
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {user.email || '-'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Telefon
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {user.phone || '-'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Datum rođenja
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formatDateForDisplay(user.dateOfBirth)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Adresa
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {user.address || '-'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Grad
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {user.city || '-'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Poštanski broj
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {user.postalCode || '-'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Član od
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formatDateForDisplay(user.membershipDate)}
              </Typography>
            </Box>

            {user.skills && user.skills.length > 0 && (
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Vještine
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  {user.skills.map((skill: string, index: number) => (
                    <Chip key={index} label={skill} size="small" />
                  ))}
                </Box>
              </Box>
            )}

            {user.categories && user.categories.length > 0 && (
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Kategorije
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  {user.categories.map((category: string, index: number) => (
                    <Chip key={index} label={category} size="small" color="primary" />
                  ))}
                </Box>
              </Box>
            )}

            {/* Family Members Section */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Članovi porodice
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                {familyRelationships && familyRelationships.length > 0 ? (
                  familyRelationships.map((rel: any) => (
                    <Card key={rel.id} sx={{ mb: 1 }}>
                      <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar src={rel.relatedUser?.photo} sx={{ width: 32, height: 32 }}>
                              <Person sx={{ fontSize: 16 }} />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {rel.relatedUser?.firstName} {rel.relatedUser?.lastName}
                              </Typography>
                              <Chip size="small" label={rel.relationship} variant="outlined" />
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    Nema članova porodice
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <UserModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditMode(false);
        }}
        onSave={handleSave}
        user={user}
        isMemberView={!editMode}
      />
    </Box>
  );
}
