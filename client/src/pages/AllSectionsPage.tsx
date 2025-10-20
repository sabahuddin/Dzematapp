import { Box, Typography, Card, CardContent, Button, Chip } from "@mui/material";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useMarkAsViewed } from "@/hooks/useMarkAsViewed";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WorkGroup, WorkGroupMember, AccessRequest } from "@shared/schema";

export default function AllSectionsPage() {
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
      return await apiRequest('POST', '/api/access-requests', {
        userId: user?.id,
        workGroupId
      });
    },
    onSuccess: () => {
      toast({
        title: "Uspjeh",
        description: "Zahtjev za pristup je poslan",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/access-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/access-requests/my'] });
    },
    onError: () => {
      toast({
        title: "Greška",
        description: "Nije moguće poslati zahtjev",
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
        <Typography>Učitavanje...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Sekcije
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {workGroups?.map((workGroup) => {
          const membership = getUserMembership(workGroup.id);
          const isMember = !!membership;

          return (
            <Card key={workGroup.id} data-testid={`card-section-${workGroup.id}`}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {workGroup.name}
                </Typography>
                
                {workGroup.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
                    Pogledaj zadatke
                  </Button>
                ) : (
                  <>
                    {getPendingRequest(workGroup.id) ? (
                      <Chip 
                        label="Zahtjev na čekanju" 
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
                        Zatraži pristup
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
          Nema dostupnih sekcija
        </Typography>
      )}
    </Box>
  );
}
