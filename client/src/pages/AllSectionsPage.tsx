import { Box, Typography, Card, CardContent, Button } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import type { WorkGroup, WorkGroupMember } from "@shared/schema";

export default function AllSectionsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: workGroups, isLoading } = useQuery<(WorkGroup & { members: WorkGroupMember[] })[]>({
    queryKey: ['/api/work-groups'],
  });

  const getUserMembership = (workGroupId: string) => {
    const workGroup = workGroups?.find(wg => wg.id === workGroupId);
    return workGroup?.members?.find(m => m.userId === user?.id);
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
                  <Typography variant="caption" color="text.secondary">
                    Niste član ove sekcije
                  </Typography>
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
