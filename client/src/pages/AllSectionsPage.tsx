import { Box, Typography, Card, CardContent, Button, Chip } from "@mui/material";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useMarkAsViewed } from "@/hooks/useMarkAsViewed";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WorkGroup, WorkGroupMember, AccessRequest } from "@shared/schema";

export default function AllSectionsPage() {
  const { t } = useTranslation(['tasks', 'common']);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  useMarkAsViewed('tasks');

  const { data: workGroups, isLoading } = useQuery<(WorkGroup & { members: WorkGroupMember[] })[]>({
    queryKey: ['/api/work-groups'],
  });

  const { data: accessRequests } = useQuery<AccessRequest[]>({
    queryKey: user?.isAdmin ? ['/api/access-requests'] : ['/api/access-requests/my'],
    enabled: !!user,
  });

  const requestAccessMutation = useMutation({
    mutationFn: async (workGroupId: string) => {
      return await apiRequest('/api/access-requests', 'POST', {
        userId: user?.id,
        workGroupId
      });
    },
    onSuccess: () => {
      toast({
        title: t('common:common.success'),
        description: t('accessRequest.success'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/access-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/access-requests/my'] });
    },
    onError: () => {
      toast({
        title: t('common:common.error'),
        description: t('accessRequest.error'),
        variant: "destructive",
      });
    },
  });

  const getUserMembership = (workGroupId: string) => {
    const workGroup = workGroups?.find(wg => wg.id === workGroupId);
    return workGroup?.members?.find(m => m.userId === user?.id);
  };

  const getPendingRequest = (workGroupId: string) => {
    if (!user || !accessRequests) return null;
    return accessRequests.find(
      req => req.workGroupId === workGroupId && req.userId === user.id && req.status === 'pending'
    );
  };

  const handleRequestAccess = (workGroupId: string) => {
    requestAccessMutation.mutate(workGroupId);
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>{t('common:common.loading')}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        {t('title')}
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {workGroups?.map((workGroup) => {
          const membership = getUserMembership(workGroup.id);
          const isMember = !!membership;

          return (
            <Card 
              key={workGroup.id} 
              data-testid={`card-section-${workGroup.id}`}
              sx={{
                backgroundColor: '#ffffff',
                border: '1px solid #c5cae9',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(57, 73, 171, 0.08)',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(57, 73, 171, 0.12)',
                  borderColor: '#3949AB'
                }
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {workGroup.name}
                </Typography>
                
                {workGroup.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
                    {workGroup.description}
                  </Typography>
                )}

                {isMember ? (
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => setLocation(`/tasks?workGroupId=${workGroup.id}`)}
                    data-testid={`button-view-tasks-${workGroup.id}`}
                  >
                    {t('viewTasks')}
                  </Button>
                ) : (
                  <>
                    {getPendingRequest(workGroup.id) ? (
                      <Chip 
                        label={t('accessRequest.pending')} 
                        color="warning" 
                        size="small"
                        data-testid={`chip-pending-${workGroup.id}`}
                      />
                    ) : (
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleRequestAccess(workGroup.id)}
                        disabled={requestAccessMutation.isPending}
                        data-testid={`button-request-access-${workGroup.id}`}
                      >
                        {t('accessRequest.request')}
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {(!workGroups || workGroups.length === 0) && (
        <Typography variant="body1" color="text.secondary">
          {t('noSections')}
        </Typography>
      )}
    </Box>
  );
}
