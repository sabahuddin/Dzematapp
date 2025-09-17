import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  GroupAdd,
  ManageAccounts,
  MoreVert,
  People,
  Check,
  Close
} from '@mui/icons-material';
import { WorkGroup, AccessRequest, Task, WorkGroupMember, User } from '@shared/schema';
import WorkGroupModal from '../components/modals/WorkGroupModal';
import MemberManagementDialog from '../components/MemberManagementDialog';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { apiRequest } from '../lib/queryClient';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`task-tabpanel-${index}`}
      aria-labelledby={`task-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface WorkGroupCardProps {
  workGroup: WorkGroup;
  onManageMembers: (workGroup: WorkGroup) => void;
  onManageTasks: (workGroup: WorkGroup) => void;
}

function WorkGroupCard({ workGroup, onManageMembers, onManageTasks }: WorkGroupCardProps) {
  // Hook to get member count for this work group  
  const memberCountQuery = useQuery({
    queryKey: ['/api/work-groups', workGroup.id, 'members'],
    select: (data: Array<WorkGroupMember & { user: User }>) => data?.length || 0,
    retry: 1,
  });

  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <Card 
        sx={{ 
          height: '100%',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
          }
        }}
      >
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
            {workGroup.name}
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ mb: 2, flex: 1 }}
          >
            {workGroup.description}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <People sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {memberCountQuery.isLoading ? (
                <CircularProgress size={12} sx={{ mr: 0.5 }} />
              ) : (
                `${memberCountQuery.data || 0} članova`
              )}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<ManageAccounts />}
              onClick={() => onManageMembers(workGroup)}
              data-testid={`button-manage-members-${workGroup.id}`}
            >
              Upravljaj Članovima
            </Button>
            <Button
              variant="outlined"
              onClick={() => onManageTasks(workGroup)}
              data-testid={`button-manage-tasks-${workGroup.id}`}
            >
              Upravljaj Zadacima
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
}

export default function TaskManagerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [tabValue, setTabValue] = useState(0);
  const [workGroupModalOpen, setWorkGroupModalOpen] = useState(false);
  const [memberManagementDialogOpen, setMemberManagementDialogOpen] = useState(false);
  const [selectedWorkGroup, setSelectedWorkGroup] = useState<WorkGroup | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuRequest, setMenuRequest] = useState<AccessRequest | null>(null);

  // Fetch work groups
  const workGroupsQuery = useQuery<WorkGroup[]>({
    queryKey: ['/api/work-groups'],
    retry: 1,
  });

  // Fetch access requests
  const accessRequestsQuery = useQuery<AccessRequest[]>({
    queryKey: ['/api/access-requests'],
    retry: 1,
  });

  // Fetch users for access request names
  const usersQuery = useQuery<User[]>({
    queryKey: ['/api/users'],
    retry: 1,
  });

  // Create work group mutation
  const createWorkGroupMutation = useMutation({
    mutationFn: async (workGroupData: any) => {
      const response = await apiRequest('POST', '/api/work-groups', workGroupData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-groups'] });
      toast({ title: 'Uspjeh', description: 'Radna grupa je uspješno kreirana' });
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri kreiranju radne grupe', variant: 'destructive' });
    }
  });

  // Update access request mutation
  const updateAccessRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PUT', `/api/access-requests/${id}`, { status });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/access-requests'] });
      const action = variables.status === 'approved' ? 'odobren' : 'odbačen';
      toast({ title: 'Uspjeh', description: `Zahtjev je ${action}` });
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri ažuriranju zahtjeva', variant: 'destructive' });
    }
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateWorkGroup = () => {
    setSelectedWorkGroup(null);
    setWorkGroupModalOpen(true);
  };

  const handleSaveWorkGroup = (workGroupData: any) => {
    createWorkGroupMutation.mutate(workGroupData);
  };

  const handleManageMembers = (workGroup: WorkGroup) => {
    setSelectedWorkGroup(workGroup);
    setMemberManagementDialogOpen(true);
  };

  const handleManageGroupTasks = (workGroup: WorkGroup) => {
    // In a real app, this would navigate to a task management page for the specific group
    toast({ 
      title: 'Info', 
      description: `Upravljanje zadacima za grupu: ${workGroup.name}`,
      variant: 'default'
    });
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, request: AccessRequest) => {
    setMenuAnchor(event.currentTarget);
    setMenuRequest(request);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuRequest(null);
  };

  const handleApproveRequest = () => {
    if (menuRequest) {
      updateAccessRequestMutation.mutate({ id: menuRequest.id, status: 'approved' });
    }
    handleMenuClose();
  };

  const handleRejectRequest = () => {
    if (menuRequest) {
      updateAccessRequestMutation.mutate({ id: menuRequest.id, status: 'rejected' });
    }
    handleMenuClose();
  };


  // Get user name from users data
  const getUserName = (userId: string) => {
    const user = usersQuery.data?.find((u: any) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Nepoznat korisnik';
  };

  if (workGroupsQuery.isLoading || accessRequestsQuery.isLoading || usersQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (workGroupsQuery.error || accessRequestsQuery.error || usersQuery.error) {
    return (
      <Alert severity="error">
        Greška pri učitavanju podataka. Molimo pokušajte ponovo.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Task Manager
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="task manager tabs">
          <Tab label="Radne Grupe" data-testid="tab-work-groups" />
          <Tab label="Zahtjevi za Pristup" data-testid="tab-access-requests" />
        </Tabs>
      </Box>

      {/* Work Groups Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<GroupAdd />}
            onClick={handleCreateWorkGroup}
            data-testid="button-create-work-group"
          >
            Kreiraj Novu Grupu
          </Button>
        </Box>

        <Grid container spacing={3}>
          {workGroupsQuery.data?.map((workGroup: WorkGroup) => (
            <WorkGroupCard 
              key={workGroup.id}
              workGroup={workGroup}
              onManageMembers={handleManageMembers}
              onManageTasks={handleManageGroupTasks}
            />
          ))}
          
          {(!workGroupsQuery.data || workGroupsQuery.data.length === 0) && (
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Typography color="text.secondary">
                    Nema radnih grupa
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Access Requests Tab */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Ime Korisnika</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Naziv Grupe</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Datum Zahtjeva</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Akcije</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accessRequestsQuery.data?.map((request: AccessRequest) => {
                  const workGroup = workGroupsQuery.data?.find((wg: WorkGroup) => wg.id === request.workGroupId);
                  return (
                    <TableRow key={request.id}>
                      <TableCell>{getUserName(request.userId)}</TableCell>
                      <TableCell>{workGroup?.name || 'Nepoznata grupa'}</TableCell>
                      <TableCell>
                        {request.requestDate ? new Date(request.requestDate).toLocaleDateString('hr-HR') : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            request.status === 'pending' ? 'Na čekanju' :
                            request.status === 'approved' ? 'Odobren' : 'Odbačen'
                          }
                          color={
                            request.status === 'pending' ? 'warning' :
                            request.status === 'approved' ? 'success' : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {request.status === 'pending' && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<Check />}
                              onClick={handleApproveRequest}
                              data-testid={`button-approve-${request.id}`}
                            >
                              Odobri
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Close />}
                              onClick={handleRejectRequest}
                              data-testid={`button-reject-${request.id}`}
                            >
                              Odbij
                            </Button>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!accessRequestsQuery.data || accessRequestsQuery.data.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">
                        Nema zahtjeva za pristup
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </TabPanel>

      {/* Work Group Modal */}
      <WorkGroupModal
        open={workGroupModalOpen}
        onClose={() => setWorkGroupModalOpen(false)}
        onSave={handleSaveWorkGroup}
        workGroup={selectedWorkGroup}
      />
      
      {/* Member Management Dialog */}
      {selectedWorkGroup && (
        <MemberManagementDialog
          open={memberManagementDialogOpen}
          onClose={() => setMemberManagementDialogOpen(false)}
          workGroup={selectedWorkGroup}
        />
      )}
    </Box>
  );
}
