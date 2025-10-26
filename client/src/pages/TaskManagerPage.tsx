import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete
} from '@mui/material';
import {
  GroupAdd,
  ManageAccounts,
  People,
  Check,
  Close,
  ExpandMore,
  Edit
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
  workGroup: WorkGroup & { members?: WorkGroupMember[] };
  onManageMembers: (workGroup: WorkGroup) => void;
  onManageTasks: (workGroup: WorkGroup) => void;
  onJoinRequest: (workGroup: WorkGroup) => void;
  onCreateProposal: (workGroup: WorkGroup) => void;
  onEditWorkGroup: (workGroup: WorkGroup) => void;
  currentUser: any;
}

function WorkGroupCard({ workGroup, onManageMembers, onManageTasks, onJoinRequest, onCreateProposal, onEditWorkGroup, currentUser }: WorkGroupCardProps) {
  const { t } = useTranslation(['tasks', 'common']);
  const { toast } = useToast();
  
  const isMember = workGroup.members?.some((m: WorkGroupMember) => m.userId === currentUser?.id) || false;
  const isAdmin = currentUser?.isAdmin || false;
  const isModerator = workGroup.members?.some((m: WorkGroupMember) => m.userId === currentUser?.id && m.isModerator) || false;
  const isClanIO = currentUser?.roles?.includes('clan_io') || false;
  const canViewTasks = isAdmin || isMember || isClanIO;
  const canEdit = isAdmin || isModerator;

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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {workGroup.name}
            </Typography>
            {canEdit && (
              <IconButton 
                size="small" 
                onClick={() => onEditWorkGroup(workGroup)}
                data-testid={`button-edit-workgroup-${workGroup.id}`}
                sx={{ ml: 1 }}
              >
                <Edit fontSize="small" />
              </IconButton>
            )}
          </Box>
          
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
              {t('members.count_many', { count: workGroup.members?.length || 0 })}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {isAdmin ? (
              <>
                <Button
                  variant="contained"
                  startIcon={<ManageAccounts />}
                  onClick={() => onManageMembers(workGroup)}
                  data-testid={`button-manage-members-${workGroup.id}`}
                >
                  {t('manageMembers')}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => onManageTasks(workGroup)}
                  data-testid={`button-manage-tasks-${workGroup.id}`}
                >
                  {t('manageTasks')}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => onCreateProposal(workGroup)}
                  data-testid={`button-create-proposal-${workGroup.id}`}
                >
                  Kreiraj Prijedlog
                </Button>
              </>
            ) : isModerator ? (
              <>
                <Button
                  variant="contained"
                  onClick={() => onManageTasks(workGroup)}
                  data-testid={`button-view-tasks-${workGroup.id}`}
                >
                  {t('viewTasks')}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => onCreateProposal(workGroup)}
                  data-testid={`button-create-proposal-${workGroup.id}`}
                >
                  Kreiraj Prijedlog
                </Button>
              </>
            ) : isMember ? (
              <Button
                variant="contained"
                onClick={() => onManageTasks(workGroup)}
                data-testid={`button-view-tasks-${workGroup.id}`}
              >
                {t('viewTasks')}
              </Button>
            ) : isClanIO ? (
              <Button
                variant="outlined"
                onClick={() => onManageTasks(workGroup)}
                data-testid={`button-view-tasks-${workGroup.id}`}
              >
                {t('viewTasks')} (Read-only)
              </Button>
            ) : (
              <Button
                variant="outlined"
                onClick={() => onJoinRequest(workGroup)}
                data-testid={`button-join-${workGroup.id}`}
              >
                {t('joinSection')}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
}

export default function TaskManagerPage() {
  const { t } = useTranslation(['tasks', 'common']);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [tabValue, setTabValue] = useState(0);
  const [workGroupModalOpen, setWorkGroupModalOpen] = useState(false);
  const [editWorkGroupModalOpen, setEditWorkGroupModalOpen] = useState(false);
  const [memberManagementDialogOpen, setMemberManagementDialogOpen] = useState(false);
  const [taskManagementDialogOpen, setTaskManagementDialogOpen] = useState(false);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [selectedWorkGroup, setSelectedWorkGroup] = useState<WorkGroup | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '' });

  const workGroupsQuery = useQuery<WorkGroup[]>({
    queryKey: ['/api/work-groups'],
    retry: 1,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  const accessRequestsQuery = useQuery<AccessRequest[]>({
    queryKey: ['/api/access-requests'],
    retry: 1,
    enabled: !!user?.isAdmin,
  });

  const usersQuery = useQuery<User[]>({
    queryKey: ['/api/users'],
    retry: 1,
    enabled: !!user?.isAdmin,
  });

  const isIOOrAdminCheck = user?.isAdmin || user?.roles?.includes('clan_io');
  
  const proposalsQuery = useQuery<any[]>({
    queryKey: ['/api/proposals'],
    retry: 1,
    enabled: isIOOrAdminCheck,
  });

  const { memberWorkGroups, otherWorkGroups } = React.useMemo(() => {
    if (!workGroupsQuery.data || !user) return { memberWorkGroups: [], otherWorkGroups: [] };
    
    const member: (WorkGroup & { members?: WorkGroupMember[] })[] = [];
    const other: (WorkGroup & { members?: WorkGroupMember[] })[] = [];
    
    workGroupsQuery.data.forEach((workGroup: WorkGroup & { members?: WorkGroupMember[] }) => {
      const isMember = workGroup.members?.some((m: WorkGroupMember) => 
        m.userId === user.id
      ) || false;
      
      // Svi korisnici: sekcije gdje su član idu u memberWorkGroups, ostale u otherWorkGroups
      if (isMember) {
        member.push(workGroup);
      } else {
        other.push(workGroup);
      }
    });
    
    return { memberWorkGroups: member, otherWorkGroups: other };
  }, [workGroupsQuery.data, user]);

  const createWorkGroupMutation = useMutation({
    mutationFn: async (workGroupData: any) => {
      const response = await apiRequest('/api/work-groups', 'POST', workGroupData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-groups'] });
      toast({ title: t('common:success'), description: t('toasts.sectionCreated') });
    },
    onError: () => {
      toast({ title: t('common:error'), description: t('toasts.sectionCreateError'), variant: 'destructive' });
    }
  });

  const updateWorkGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: { name: string, description: string } }) => {
      const response = await apiRequest(`/api/work-groups/${id}`, 'PUT', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-groups'] });
      setEditWorkGroupModalOpen(false);
      toast({ title: t('common:success'), description: t('toasts.sectionUpdated') });
    },
    onError: () => {
      toast({ title: t('common:error'), description: t('toasts.sectionUpdateError'), variant: 'destructive' });
    }
  });

  const createAccessRequestMutation = useMutation({
    mutationFn: async (requestData: any) => {
      const response = await apiRequest('/api/access-requests', 'POST', requestData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/access-requests'] });
      toast({ title: t('common:success'), description: t('toasts.accessRequestSent') });
    },
    onError: () => {
      toast({ title: t('common:error'), description: t('toasts.accessRequestError'), variant: 'destructive' });
    }
  });

  const updateAccessRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest(`/api/access-requests/${id}`, 'PUT', { status });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/access-requests'] });
      const action = variables.status === 'approved' ? t('toasts.requestApproved') : t('toasts.requestRejected');
      toast({ title: t('common:success'), description: action });
    },
    onError: () => {
      toast({ title: t('common:error'), description: t('toasts.requestUpdateError'), variant: 'destructive' });
    }
  });

  const approveProposalMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      return await apiRequest(`/api/proposals/${id}/approve`, 'POST', { comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
      toast({ 
        title: 'Uspjeh', 
        description: 'Prijedlog je uspješno odobren.' 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Greška', 
        description: error.message || 'Došlo je do greške prilikom odobravanja prijedloga.', 
        variant: 'destructive' 
      });
    }
  });

  const rejectProposalMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment: string }) => {
      return await apiRequest(`/api/proposals/${id}/reject`, 'POST', { comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
      toast({ 
        title: 'Uspjeh', 
        description: 'Prijedlog je odbijen.' 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Greška', 
        description: error.message || 'Došlo je do greške prilikom odbijanja prijedloga.', 
        variant: 'destructive' 
      });
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
    setSelectedWorkGroup(workGroup);
    setTaskManagementDialogOpen(true);
  };

  const handleEditWorkGroup = (workGroup: WorkGroup) => {
    setSelectedWorkGroup(workGroup);
    setEditFormData({ name: workGroup.name, description: workGroup.description || '' });
    setEditWorkGroupModalOpen(true);
  };

  const handleUpdateWorkGroup = () => {
    if (!selectedWorkGroup) return;
    updateWorkGroupMutation.mutate({
      id: selectedWorkGroup.id,
      data: editFormData
    });
  };

  const handleCreateProposal = (workGroup: WorkGroup) => {
    setSelectedWorkGroup(workGroup);
    setProposalModalOpen(true);
  };

  const handleJoinRequest = (workGroup: WorkGroup) => {
    if (!user?.id) return;
    
    createAccessRequestMutation.mutate({
      userId: user.id,
      workGroupId: workGroup.id,
      status: 'pending'
    });
  };

  const handleApproveRequest = (requestId: string) => {
    updateAccessRequestMutation.mutate({ id: requestId, status: 'approved' });
  };

  const handleRejectRequest = (requestId: string) => {
    updateAccessRequestMutation.mutate({ id: requestId, status: 'rejected' });
  };

  const getUserName = (userId: string) => {
    const user = usersQuery.data?.find((u: any) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : t('unknownUser');
  };

  const isLoading = user?.isAdmin 
    ? (workGroupsQuery.isLoading || accessRequestsQuery.isLoading || usersQuery.isLoading)
    : workGroupsQuery.isLoading;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  const hasError = user?.isAdmin
    ? (workGroupsQuery.error || accessRequestsQuery.error || usersQuery.error)
    : workGroupsQuery.error;

  if (hasError) {
    return (
      <Alert severity="error">
        {t('loadingError')}
      </Alert>
    );
  }

  const isIOOrAdmin = user?.isAdmin || user?.roles?.includes('clan_io');

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        {t('title')}
      </Typography>

      {isIOOrAdmin && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="task manager tabs">
            <Tab label={t('tabs.sections')} data-testid="tab-work-groups" />
            {user?.isAdmin && <Tab label={t('tabs.accessRequests')} data-testid="tab-access-requests" />}
            <Tab label="Prijedlozi" data-testid="tab-proposals" />
          </Tabs>
        </Box>
      )}

      <TabPanel value={tabValue} index={0}>
        {user?.isAdmin && (
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<GroupAdd />}
              onClick={handleCreateWorkGroup}
              data-testid="button-create-work-group"
            >
              {t('createSection')}
            </Button>
          </Box>
        )}

        {memberWorkGroups.length > 0 ? (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              {t('mySections')}
            </Typography>
            <Grid container spacing={3}>
              {memberWorkGroups.map((workGroup: WorkGroup) => (
                <WorkGroupCard 
                  key={workGroup.id}
                  workGroup={workGroup}
                  onManageMembers={handleManageMembers}
                  onManageTasks={handleManageGroupTasks}
                  onJoinRequest={handleJoinRequest}
                  onCreateProposal={handleCreateProposal}
                  onEditWorkGroup={handleEditWorkGroup}
                  currentUser={user}
                />
              ))}
            </Grid>
          </Box>
        ) : (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {t('notMemberOfAnySection')}
            </Typography>
          </Box>
        )}

        {otherWorkGroups.length > 0 && (
          <Accordion defaultExpanded={false}>
            <AccordionSummary 
              expandIcon={<ExpandMore />}
              sx={{ 
                bgcolor: '#f8f9fa',
                '&:hover': { bgcolor: '#e9ecef' }
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {t('otherSections')} ({otherWorkGroups.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 3 }}>
              <Grid container spacing={3}>
                {otherWorkGroups.map((workGroup: WorkGroup) => (
                  <WorkGroupCard 
                    key={workGroup.id}
                    workGroup={workGroup}
                    onManageMembers={handleManageMembers}
                    onManageTasks={handleManageGroupTasks}
                    onJoinRequest={handleJoinRequest}
                    onCreateProposal={handleCreateProposal}
                    onEditWorkGroup={handleEditWorkGroup}
                    currentUser={user}
                  />
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}
        
        {memberWorkGroups.length === 0 && otherWorkGroups.length === 0 && (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">
                {t('noSectionsAvailable')}
              </Typography>
            </CardContent>
          </Card>
        )}
      </TabPanel>

      {user?.isAdmin && (
        <TabPanel value={tabValue} index={1}>
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 600 }}>{t('accessRequests.userName')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('accessRequests.sectionName')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('accessRequests.requestDate')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('accessRequests.status')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('accessRequests.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accessRequestsQuery.data?.map((request: AccessRequest) => {
                    const workGroup = workGroupsQuery.data?.find((wg: WorkGroup) => wg.id === request.workGroupId);
                    return (
                      <TableRow key={request.id}>
                        <TableCell>{getUserName(request.userId)}</TableCell>
                        <TableCell>{workGroup?.name || t('unknownGroup')}</TableCell>
                        <TableCell>
                          {request.requestDate ? new Date(request.requestDate).toLocaleDateString('hr-HR') : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              request.status === 'pending' ? t('accessRequests.pending') :
                              request.status === 'approved' ? t('accessRequests.approved') : t('accessRequests.rejected')
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
                                onClick={() => handleApproveRequest(request.id)}
                                data-testid={`button-approve-${request.id}`}
                              >
                                {t('accessRequests.approve')}
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Close />}
                                onClick={() => handleRejectRequest(request.id)}
                                data-testid={`button-reject-${request.id}`}
                              >
                                {t('accessRequests.reject')}
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
                          {t('accessRequests.noRequests')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </TabPanel>
      )}

      <TabPanel value={tabValue} index={user?.isAdmin ? 2 : 1}>
        <ProposalsReviewContent 
          proposals={proposalsQuery.data || []}
          workGroups={workGroupsQuery.data || []}
          users={usersQuery.data || []}
          onApprove={approveProposalMutation.mutate}
          onReject={rejectProposalMutation.mutate}
          isLoading={proposalsQuery.isLoading}
        />
      </TabPanel>

      <WorkGroupModal
        open={workGroupModalOpen}
        onClose={() => setWorkGroupModalOpen(false)}
        onSave={handleSaveWorkGroup}
        workGroup={selectedWorkGroup}
      />
      
      <MemberManagementDialog
        open={memberManagementDialogOpen && selectedWorkGroup !== null}
        onClose={() => setMemberManagementDialogOpen(false)}
        workGroup={selectedWorkGroup || { id: '', name: '', description: '', createdAt: new Date(), visibility: 'public' }}
      />

      <Dialog 
        open={editWorkGroupModalOpen} 
        onClose={() => setEditWorkGroupModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('editSection')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label={t('sectionName')}
              fullWidth
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              data-testid="input-edit-section-name"
            />
            <TextField
              label={t('sectionDescription')}
              fullWidth
              multiline
              rows={4}
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              data-testid="input-edit-section-description"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditWorkGroupModalOpen(false)} data-testid="button-cancel-edit">
            {t('common:cancel')}
          </Button>
          <Button 
            onClick={handleUpdateWorkGroup} 
            variant="contained"
            disabled={!editFormData.name || updateWorkGroupMutation.isPending}
            data-testid="button-save-edit"
          >
            {updateWorkGroupMutation.isPending ? t('common:saving') : t('common:save')}
          </Button>
        </DialogActions>
      </Dialog>
      
      <ProposalModal
        open={proposalModalOpen && selectedWorkGroup !== null}
        onClose={() => setProposalModalOpen(false)}
        workGroup={selectedWorkGroup}
        currentUserId={user?.id || ''}
      />
      
      <Dialog
        open={taskManagementDialogOpen && selectedWorkGroup !== null}
        onClose={() => setTaskManagementDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            height: '80vh',
            maxHeight: '800px'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            {t('taskDialog.title', { name: selectedWorkGroup?.name })}
          </Typography>
          <IconButton
            onClick={() => setTaskManagementDialogOpen(false)}
            data-testid="button-close-task-management"
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ padding: 0 }}>
          <TaskManagementContent
            workGroup={selectedWorkGroup}
            currentUser={user}
            onClose={() => setTaskManagementDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}

interface ProposalsReviewContentProps {
  proposals: any[];
  workGroups: any[];
  users: any[];
  onApprove: (data: { id: string; comment?: string }) => void;
  onReject: (data: { id: string; comment: string }) => void;
  isLoading: boolean;
}

function ProposalsReviewContent({ proposals, workGroups, users, onApprove, onReject, isLoading }: ProposalsReviewContentProps) {
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewComment, setReviewComment] = useState('');

  const handleOpenReview = (proposal: any, action: 'approve' | 'reject') => {
    setSelectedProposal(proposal);
    setReviewAction(action);
    setReviewComment('');
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = () => {
    if (!selectedProposal) return;
    
    if (reviewAction === 'approve') {
      onApprove({ id: selectedProposal.id, comment: reviewComment || undefined });
    } else {
      if (!reviewComment.trim()) {
        return; // Reject zahtijeva komentar
      }
      onReject({ id: selectedProposal.id, comment: reviewComment });
    }
    
    setReviewDialogOpen(false);
    setSelectedProposal(null);
    setReviewComment('');
  };

  const getWorkGroupName = (workGroupId: string) => {
    return workGroups.find((wg: any) => wg.id === workGroupId)?.name || 'Nepoznata sekcija';
  };

  const getUserName = (userId: string) => {
    const user = users.find((u: any) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Nepoznato';
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const pendingProposals = proposals.filter((p: any) => p.status === 'pending');

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Prijedlozi za Odobrenje
          </Typography>
          
          {pendingProposals.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Nema prijedloga za odobrenje
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {pendingProposals.map((proposal: any) => (
                <Card key={proposal.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {getWorkGroupName(proposal.workGroupId)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Kreirao: {getUserName(proposal.createdBy)} • {new Date(proposal.createdAt).toLocaleDateString('hr-HR')}
                        </Typography>
                      </Box>
                      <Chip label={proposal.status === 'pending' ? 'Na čekanju' : proposal.status} color="warning" size="small" />
                    </Box>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" color="text.secondary">Ko izvodi:</Typography>
                        <Typography variant="body1">{proposal.who}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" color="text.secondary">Gdje:</Typography>
                        <Typography variant="body1">{proposal.where}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" color="text.secondary">Kada:</Typography>
                        <Typography variant="body1">{proposal.when}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" color="text.secondary">Budžet:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{proposal.budget} CHF</Typography>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="body2" color="text.secondary">Šta:</Typography>
                        <Typography variant="body1">{proposal.what}</Typography>
                      </Grid>
                      {proposal.how && (
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="body2" color="text.secondary">Kako:</Typography>
                          <Typography variant="body1">{proposal.how}</Typography>
                        </Grid>
                      )}
                      {proposal.why && (
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="body2" color="text.secondary">Zašto:</Typography>
                          <Typography variant="body1">{proposal.why}</Typography>
                        </Grid>
                      )}
                    </Grid>

                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<Check />}
                        onClick={() => handleOpenReview(proposal, 'approve')}
                        data-testid={`button-approve-proposal-${proposal.id}`}
                      >
                        Odobri
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Close />}
                        onClick={() => handleOpenReview(proposal, 'reject')}
                        data-testid={`button-reject-proposal-${proposal.id}`}
                      >
                        Odbij
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {reviewAction === 'approve' ? 'Odobri Prijedlog' : 'Odbij Prijedlog'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label={reviewAction === 'approve' ? 'Komentar (Opciono)' : 'Razlog odbijanja (Obavezno)'}
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            fullWidth
            multiline
            rows={4}
            required={reviewAction === 'reject'}
            sx={{ mt: 1 }}
            data-testid="input-review-comment"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)} data-testid="button-cancel-review">
            Odustani
          </Button>
          <Button 
            onClick={handleSubmitReview}
            variant="contained"
            color={reviewAction === 'approve' ? 'success' : 'error'}
            disabled={reviewAction === 'reject' && !reviewComment.trim()}
            data-testid="button-submit-review"
          >
            {reviewAction === 'approve' ? 'Odobri' : 'Odbij'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

interface ProposalModalProps {
  open: boolean;
  onClose: () => void;
  workGroup: WorkGroup | null;
  currentUserId: string;
}

function ProposalModal({ open, onClose, workGroup, currentUserId }: ProposalModalProps) {
  const { t } = useTranslation(['tasks', 'common']);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [who, setWho] = useState('');
  const [what, setWhat] = useState('');
  const [where, setWhere] = useState('');
  const [when, setWhen] = useState('');
  const [how, setHow] = useState('');
  const [why, setWhy] = useState('');
  const [budget, setBudget] = useState('');

  const createProposalMutation = useMutation({
    mutationFn: async (proposalData: any) => {
      return await apiRequest('/api/proposals', 'POST', proposalData);
    },
    onSuccess: () => {
      toast({
        title: 'Uspjeh',
        description: 'Prijedlog je uspješno kreiran i poslan na odobrenje.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Greška',
        description: error.message || 'Došlo je do greške prilikom kreiranja prijedloga.',
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    setWho('');
    setWhat('');
    setWhere('');
    setWhen('');
    setHow('');
    setWhy('');
    setBudget('');
    onClose();
  };

  const handleSubmit = () => {
    if (!who || !what || !where || !when || !budget || !workGroup) {
      toast({
        title: 'Greška',
        description: 'Molimo popunite sva obavezna polja.',
        variant: 'destructive',
      });
      return;
    }

    const proposalData = {
      workGroupId: workGroup.id,
      who,
      what,
      where,
      when,
      how: how || null,
      why: why || null,
      budget,
      status: 'pending',
      createdBy: currentUserId,
    };

    createProposalMutation.mutate(proposalData);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Kreiraj Prijedlog za {workGroup?.name}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Ko izvodi (Who)"
            value={who}
            onChange={(e) => setWho(e.target.value)}
            fullWidth
            required
            placeholder="Ko će izvršiti ovaj zadatak?"
            data-testid="input-proposal-who"
          />
          <TextField
            label="Šta je to (What)"
            value={what}
            onChange={(e) => setWhat(e.target.value)}
            fullWidth
            required
            multiline
            rows={3}
            placeholder="Šta treba uraditi?"
            data-testid="input-proposal-what"
          />
          <TextField
            label="Gdje (Where)"
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            fullWidth
            required
            placeholder="Gdje će se izvršiti?"
            data-testid="input-proposal-where"
          />
          <TextField
            label="Kada (When)"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            fullWidth
            required
            placeholder="Kada će se izvršiti?"
            data-testid="input-proposal-when"
          />
          <TextField
            label="Kako (How - Opciono)"
            value={how}
            onChange={(e) => setHow(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="Kako će se izvršiti? (Opciono)"
            data-testid="input-proposal-how"
          />
          <TextField
            label="Zašto (Why - Opciono)"
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="Zašto je ovo potrebno? (Opciono)"
            data-testid="input-proposal-why"
          />
          <TextField
            label="Budžet (CHF)"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            fullWidth
            required
            type="number"
            placeholder="Procijenjeni budžet u CHF"
            data-testid="input-proposal-budget"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} data-testid="button-cancel-proposal">
          Odustani
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={createProposalMutation.isPending}
          data-testid="button-submit-proposal"
        >
          {createProposalMutation.isPending ? 'Kreiranje...' : 'Pošalji Prijedlog'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface TaskCreateDialogProps {
  open: boolean;
  onClose: () => void;
  workGroup: WorkGroup | null;
  members: any[];
  onSave: (taskData: any) => void;
}

function TaskCreateDialog({ open, onClose, workGroup, members, onSave }: TaskCreateDialogProps) {
  const { t } = useTranslation(['tasks', 'common']);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionImage, setDescriptionImage] = useState<string | null>(null);
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  const [status, setStatus] = useState('u_toku');
  const [dueDate, setDueDate] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [pointsValue, setPointsValue] = useState('50');

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setDescriptionImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!title || !workGroup) return;
    
    const taskData: any = {
      title,
      description,
      descriptionImage: descriptionImage || null,
      workGroupId: workGroup.id,
      assignedUserIds: assignedUserIds.length > 0 ? assignedUserIds : null,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
      pointsValue: parseInt(pointsValue) || 50
    };
    
    // Only include estimatedCost if it has a value
    if (estimatedCost && estimatedCost.trim()) {
      taskData.estimatedCost = estimatedCost;
    }
    
    onSave(taskData);
    setTitle('');
    setDescription('');
    setDescriptionImage(null);
    setAssignedUserIds([]);
    setStatus('u_toku');
    setDueDate('');
    setEstimatedCost('');
    setPointsValue('50');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('taskDialog.createNew')}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            id="task-title"
            variant="outlined"
            label={t('taskDialog.taskTitle')}
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            fullWidth
            required
            data-testid="input-task-title"
          />
          <TextField
            id="task-description"
            variant="outlined"
            label={t('taskDialog.taskDescription')}
            value={description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            data-testid="input-task-description"
          />
          
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              {t('taskDialog.image')}
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
              data-testid="button-upload-task-image"
            >
              {descriptionImage ? t('taskDialog.changeImage') : t('taskDialog.addImage')}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageUpload}
              />
            </Button>
            {descriptionImage && (
              <Box sx={{ mt: 2, position: 'relative' }}>
                <Box
                  component="img"
                  src={descriptionImage}
                  alt="Task preview"
                  sx={{
                    width: '100%',
                    aspectRatio: '4/3',
                    objectFit: 'cover',
                    borderRadius: 1,
                    border: '2px solid #1976d2'
                  }}
                />
                <IconButton
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'error.light', color: 'white' }
                  }}
                  onClick={() => setDescriptionImage(null)}
                  data-testid="button-remove-task-image"
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
          
          <TextField
            id="task-status"
            variant="outlined"
            select
            label={t('taskDialog.status')}
            value={status}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStatus(e.target.value)}
            fullWidth
            data-testid="select-task-status"
          >
            <MenuItem value="u_toku">{t('task.status.u_toku')}</MenuItem>
            <MenuItem value="na_cekanju">{t('task.status.na_cekanju')}</MenuItem>
            <MenuItem value="završeno">{t('task.status.zavrseno')}</MenuItem>
            <MenuItem value="otkazano">{t('task.status.otkazano')}</MenuItem>
            <MenuItem value="arhiva">{t('task.status.arhiva')}</MenuItem>
          </TextField>
          <Autocomplete
            multiple
            options={members || []}
            getOptionLabel={(option: any) => option.user ? `${option.user.firstName} ${option.user.lastName}` : t('unknownUser')}
            value={members?.filter((member: any) => assignedUserIds.includes(member.userId)) || []}
            onChange={(_, newValue) => {
              setAssignedUserIds(newValue.map((member: any) => member.userId));
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                id="task-assignees"
                variant="outlined"
                label={t('taskDialog.assignToMembers')}
                placeholder={t('taskDialog.selectMembers')}
                data-testid="select-task-assignees"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option: any, index: number) => (
                <Chip
                  label={option.user ? `${option.user.firstName} ${option.user.lastName}` : t('unknownUser')}
                  {...getTagProps({ index })}
                  key={option.userId}
                />
              ))
            }
            fullWidth
          />
          <TextField
            id="task-due-date"
            variant="outlined"
            label={t('taskDialog.dueDate')}
            type="date"
            value={dueDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDueDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            data-testid="input-task-due-date"
          />
          <TextField
            id="task-estimated-cost"
            variant="outlined"
            label="Procijenjena cijena (CHF)"
            type="number"
            value={estimatedCost}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEstimatedCost(e.target.value)}
            fullWidth
            placeholder="Opciono"
            data-testid="input-task-estimated-cost"
          />
          <TextField
            id="task-points-value"
            variant="outlined"
            select
            label="Bodovna vrijednost"
            value={pointsValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPointsValue(e.target.value)}
            fullWidth
            data-testid="select-task-points-value"
          >
            <MenuItem value="10">10 bodova (Laki zadatak)</MenuItem>
            <MenuItem value="20">20 bodova (Srednji zadatak)</MenuItem>
            <MenuItem value="30">30 bodova (Težak zadatak)</MenuItem>
            <MenuItem value="50">50 bodova (Default)</MenuItem>
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} data-testid="button-cancel-create-task">
          {t('taskDialog.cancel')}
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={!title.trim()}
          data-testid="button-submit-create-task"
        >
          {t('common:buttons.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface TaskDetailDialogProps {
  open: boolean;
  onClose: () => void;
  task: any;
  workGroup: WorkGroup | null;
  currentUser: any;
  isModeratorOrAdmin: boolean;
  members: any[];
  onTaskUpdated: () => void;
}

function TaskDetailDialog({ 
  open, 
  onClose, 
  task, 
  workGroup, 
  currentUser, 
  isModeratorOrAdmin,
  members,
  onTaskUpdated 
}: TaskDetailDialogProps) {
  const { t } = useTranslation(['tasks', 'common']);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const [fullscreenImageOpen, setFullscreenImageOpen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState('');
  const [receiptUploadDialogOpen, setReceiptUploadDialogOpen] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptAmount, setReceiptAmount] = useState('');

  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedDescriptionImage, setEditedDescriptionImage] = useState<string | null>(null);
  const [editedStatus, setEditedStatus] = useState('');
  const [editedAssignedUserIds, setEditedAssignedUserIds] = useState<string[]>([]);
  const [editedDueDate, setEditedDueDate] = useState('');
  const [editedEstimatedCost, setEditedEstimatedCost] = useState('');
  const [editedPointsValue, setEditedPointsValue] = useState('50');

  React.useEffect(() => {
    if (task) {
      setEditedTitle(task.title || '');
      setEditedDescription(task.description || '');
      setEditedDescriptionImage(task.descriptionImage || null);
      setEditedStatus(task.status || 'u_toku');
      setEditedAssignedUserIds(task.assignedUserIds || []);
      setEditedDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setEditedEstimatedCost(task.estimatedCost || '');
      setEditedPointsValue(task.pointsValue?.toString() || '50');
    }
  }, [task]);

  const commentsQuery = useQuery({
    queryKey: ['/api/tasks', task?.id, 'comments'],
    enabled: open && !!task?.id,
    retry: 1,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (commentData: any) => {
      const response = await apiRequest('/api/task-comments', 'POST', commentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', task?.id, 'comments'] });
      toast({ title: t('common:success'), description: t('toasts.commentAdded') });
      setNewComment('');
      setCommentImage(null);
    },
    onError: () => {
      toast({ title: t('common:error'), description: t('toasts.commentAddError'), variant: 'destructive' });
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await apiRequest(`/api/tasks/${task.id}`, 'PUT', taskData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-groups', workGroup?.id, 'tasks'] });
      toast({ title: t('common:success'), description: t('toasts.taskStatusUpdated') });
      onTaskUpdated();
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: t('common:error'), description: t('toasts.taskUpdateError'), variant: 'destructive' });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/tasks/${task.id}`, 'DELETE');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-groups', workGroup?.id, 'tasks'] });
      toast({ title: t('common:success'), description: t('toasts.taskDeleted') });
      onClose();
      onTaskUpdated();
    },
    onError: () => {
      toast({ title: t('common:error'), description: t('toasts.taskDeleteError'), variant: 'destructive' });
    }
  });

  const uploadReceiptMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/receipts/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/receipts'] });
      toast({ 
        title: 'Uspjeh', 
        description: 'Račun je uspješno poslat.' 
      });
      setReceiptUploadDialogOpen(false);
      setReceiptFile(null);
      setReceiptAmount('');
    },
    onError: (error: any) => {
      toast({ 
        title: 'Greška', 
        description: error.message || 'Došlo je do greške prilikom slanja računa.', 
        variant: 'destructive' 
      });
    }
  });

  const handleUploadReceipt = () => {
    if (!receiptFile || !receiptAmount) {
      toast({
        title: 'Greška',
        description: 'Molimo odaberite fajl i unesite iznos.',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', receiptFile);
    formData.append('taskId', task.id);
    formData.append('amount', receiptAmount);

    uploadReceiptMutation.mutate(formData);
  };

  const handleAddComment = () => {
    if (!newComment.trim() && !commentImage) return;
    
    addCommentMutation.mutate({
      taskId: task.id,
      userId: currentUser?.id,
      content: newComment,
      commentImage: commentImage
    });
  };

  const handleCommentImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCommentImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setEditedDescriptionImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMarkPending = () => {
    updateTaskMutation.mutate({ status: 'na_cekanju' });
  };

  const handleApproveTask = () => {
    updateTaskMutation.mutate({ status: 'završeno' });
  };

  const handleSaveEdit = () => {
    if (!editedTitle.trim()) return;
    
    const updates: any = {
      title: editedTitle,
      description: editedDescription,
      descriptionImage: editedDescriptionImage,
      status: editedStatus,
      assignedUserIds: editedAssignedUserIds.length > 0 ? editedAssignedUserIds : null,
      dueDate: editedDueDate ? new Date(editedDueDate) : null,
      pointsValue: parseInt(editedPointsValue) || 50
    };
    
    // Only include estimatedCost if it has a value
    if (editedEstimatedCost && editedEstimatedCost.trim()) {
      updates.estimatedCost = editedEstimatedCost;
    }
    
    updateTaskMutation.mutate(updates);
  };

  const handleDeleteTask = () => {
    if (window.confirm(t('common:messages.confirmDelete'))) {
      deleteTaskMutation.mutate();
    }
  };

  const openFullscreenImage = (imageUrl: string | null) => {
    if (imageUrl) {
      setFullscreenImage(imageUrl);
      setFullscreenImageOpen(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'u_toku': return 'primary';
      case 'na_cekanju': return 'warning';
      case 'završeno': return 'success';
      case 'otkazano': return 'error';
      case 'arhiva': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    return t(`task.status.${status}`) || status;
  };

  const getAssignedUserName = (userId: string) => {
    const member = members.find((m: any) => m.userId === userId);
    return member?.user ? `${member.user.firstName} ${member.user.lastName}` : t('unknownUser');
  };

  const isAssignedUser = task?.assignedUserIds?.includes(currentUser?.id);
  const isMemberOfWorkGroup = members.some((m: any) => m.userId === currentUser?.id);
  const canComment = isMemberOfWorkGroup || currentUser?.isAdmin;

  if (!task) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          {task.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {isModeratorOrAdmin && !isEditing && (
            <>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setIsEditing(true)}
                data-testid="button-edit-task"
              >
                {t('taskDialog.edit')}
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setMoveModalOpen(true)}
                data-testid="button-move-task"
              >
                {t('taskDialog.move')}
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="error"
                onClick={handleDeleteTask}
                data-testid="button-delete-task"
              >
                {t('taskDialog.delete')}
              </Button>
            </>
          )}
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {isEditing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                variant="outlined"
                label={t('taskDialog.taskTitle')}
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                fullWidth
                required
                data-testid="input-edit-task-title"
              />
              <TextField
                variant="outlined"
                label={t('taskDialog.taskDescription')}
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                fullWidth
                multiline
                rows={3}
                data-testid="input-edit-task-description"
              />
              
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  {t('taskDialog.image')}
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                  data-testid="button-upload-edit-task-image"
                >
                  {editedDescriptionImage ? t('taskDialog.changeImage') : t('taskDialog.addImage')}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleEditImageUpload}
                  />
                </Button>
                {editedDescriptionImage && (
                  <Box sx={{ mt: 2, position: 'relative' }}>
                    <Box
                      component="img"
                      src={editedDescriptionImage}
                      alt="Task preview"
                      sx={{
                        width: '100%',
                        aspectRatio: '4/3',
                        objectFit: 'cover',
                        borderRadius: 1,
                        border: '2px solid #1976d2'
                      }}
                    />
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'error.light', color: 'white' }
                      }}
                      onClick={() => setEditedDescriptionImage(null)}
                      data-testid="button-remove-edit-task-image"
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
              
              <TextField
                variant="outlined"
                select
                label={t('taskDialog.status')}
                value={editedStatus}
                onChange={(e) => setEditedStatus(e.target.value)}
                fullWidth
                data-testid="select-edit-task-status"
              >
                <MenuItem value="u_toku">{t('task.status.u_toku')}</MenuItem>
                <MenuItem value="na_cekanju">{t('task.status.na_cekanju')}</MenuItem>
                <MenuItem value="završeno">{t('task.status.zavrseno')}</MenuItem>
                <MenuItem value="otkazano">{t('task.status.otkazano')}</MenuItem>
                <MenuItem value="arhiva">{t('task.status.arhiva')}</MenuItem>
              </TextField>
              <Autocomplete
                multiple
                options={members || []}
                getOptionLabel={(option: any) => option.user ? `${option.user.firstName} ${option.user.lastName}` : t('unknownUser')}
                value={members?.filter((member: any) => editedAssignedUserIds.includes(member.userId)) || []}
                onChange={(_, newValue) => {
                  setEditedAssignedUserIds(newValue.map((member: any) => member.userId));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label={t('taskDialog.assignToMembers')}
                    placeholder={t('taskDialog.selectMembers')}
                    data-testid="select-edit-task-assignees"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option: any, index: number) => (
                    <Chip
                      label={option.user ? `${option.user.firstName} ${option.user.lastName}` : t('unknownUser')}
                      {...getTagProps({ index })}
                      key={option.userId}
                    />
                  ))
                }
                fullWidth
              />
              <TextField
                variant="outlined"
                label={t('taskDialog.dueDate')}
                type="date"
                value={editedDueDate}
                onChange={(e) => setEditedDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                data-testid="input-edit-task-due-date"
              />
              <TextField
                variant="outlined"
                label="Procijenjena cijena (CHF)"
                type="number"
                value={editedEstimatedCost}
                onChange={(e) => setEditedEstimatedCost(e.target.value)}
                fullWidth
                placeholder="Opciono"
                data-testid="input-edit-task-estimated-cost"
              />
              <TextField
                variant="outlined"
                select
                label="Bodovna vrijednost"
                value={editedPointsValue}
                onChange={(e) => setEditedPointsValue(e.target.value)}
                fullWidth
                data-testid="select-edit-task-points-value"
              >
                <MenuItem value="10">10 bodova (Laki zadatak)</MenuItem>
                <MenuItem value="20">20 bodova (Srednji zadatak)</MenuItem>
                <MenuItem value="30">30 bodova (Težak zadatak)</MenuItem>
                <MenuItem value="50">50 bodova (Default)</MenuItem>
              </TextField>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button onClick={() => setIsEditing(false)} data-testid="button-cancel-edit">
                  {t('taskDialog.cancel')}
                </Button>
                <Button 
                  onClick={handleSaveEdit} 
                  variant="contained"
                  disabled={!editedTitle.trim()}
                  data-testid="button-save-edit"
                >
                  {t('taskDialog.save')}
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>{task.description}</Typography>
              
              {task.descriptionImage && (
                <Box sx={{ mb: 2 }}>
                  <Box
                    component="img"
                    src={task.descriptionImage}
                    alt="Task image"
                    sx={{
                      width: '100%',
                      maxHeight: 300,
                      objectFit: 'cover',
                      borderRadius: 1,
                      border: '2px solid #1976d2',
                      cursor: 'pointer'
                    }}
                    onClick={() => openFullscreenImage(task.descriptionImage)}
                  />
                </Box>
              )}
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <Chip 
                  label={getStatusLabel(task.status)} 
                  color={getStatusColor(task.status) as any}
                  data-testid="chip-task-status"
                />
                {task.assignedUserIds && task.assignedUserIds.length > 0 && (
                  <>
                    {task.assignedUserIds.map((userId: string, index: number) => (
                      <Chip 
                        key={userId}
                        label={`${t('taskDialog.assigned')}: ${getAssignedUserName(userId)}`} 
                        variant="outlined"
                        data-testid={`chip-task-assigned-${index}`}
                      />
                    ))}
                  </>
                )}
                {task.dueDate && (
                  <Chip 
                    label={`${t('taskDialog.deadline')}: ${new Date(task.dueDate).toLocaleDateString('hr-HR')}`} 
                    variant="outlined"
                    data-testid="chip-task-due-date"
                  />
                )}
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {isAssignedUser && task.status !== 'na_cekanju' && task.status !== 'završeno' && (
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={handleMarkPending}
                    data-testid="button-mark-pending"
                  >
                    {t('taskDetail.markPending')}
                  </Button>
                )}
                {isModeratorOrAdmin && task.status === 'na_cekanju' && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleApproveTask}
                    data-testid="button-approve-task"
                  >
                    {t('taskDetail.approveComplete')}
                  </Button>
                )}
                {isAssignedUser && task.status === 'završeno' && task.estimatedCost && (
                  <Button
                    variant="contained"
                    color="info"
                    onClick={() => setReceiptUploadDialogOpen(true)}
                    data-testid="button-upload-receipt"
                  >
                    Pošalji Račun
                  </Button>
                )}
              </Box>
            </Box>
          )}

          {!isEditing && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('taskDetail.comments')}</Typography>
              
              {canComment && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      variant="outlined"
                      placeholder={t('taskDetail.addComment')}
                      value={newComment}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewComment(e.target.value)}
                      fullWidth
                      size="small"
                      data-testid="input-new-comment"
                    />
                    <Button 
                      onClick={handleAddComment} 
                      variant="contained" 
                      disabled={!newComment.trim() && !commentImage}
                      data-testid="button-add-comment"
                    >
                      {t('taskDetail.add')}
                    </Button>
                  </Box>
                
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    component="label"
                    size="small"
                    sx={{ textTransform: 'none' }}
                    data-testid="button-upload-comment-image"
                  >
                    {commentImage ? t('taskDialog.changeImage') : t('taskDialog.addImage')}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleCommentImageUpload}
                    />
                  </Button>
                  {commentImage && (
                    <IconButton
                      size="small"
                      onClick={() => setCommentImage(null)}
                      data-testid="button-remove-comment-image"
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                
                {commentImage && (
                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                    <Box
                      component="img"
                      src={commentImage}
                      alt="Comment preview"
                      sx={{
                        maxWidth: 200,
                        maxHeight: 150,
                        objectFit: 'contain',
                        borderRadius: 1,
                        border: '2px solid #1976d2'
                      }}
                    />
                  </Box>
                )}
              </Box>
              )}
              
              {!canComment && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                  Postanite član sekcije da biste mogli komentirati.
                </Typography>
              )}

              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 2, 
                maxHeight: 400, 
                overflowY: 'auto',
                overflowX: 'hidden',
                pr: 1,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#888',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#555',
                },
              }}>
                {commentsQuery.data && Array.isArray(commentsQuery.data) && commentsQuery.data.length > 0 ? (
                  commentsQuery.data.map((comment: any) => (
                    <Card key={comment.id} variant="outlined" sx={{ flexShrink: 0 }}>
                      <CardContent sx={{ 
                        py: 2,
                        px: 2,
                        '&:last-child': { pb: 2 }
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <Typography variant="caption" color="text.secondary">
                            {comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : t('unknownUser')} • {new Date(comment.createdAt).toLocaleDateString('hr-HR')}
                          </Typography>
                          {comment.content && (
                            <div style={{ 
                              fontSize: '0.875rem',
                              lineHeight: '1.5',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              color: '#333'
                            }}>
                              {comment.content}
                            </div>
                          )}
                          {comment.commentImage && (
                            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-start' }}>
                              <Box
                                component="img"
                                src={comment.commentImage}
                                alt="Comment image"
                                sx={{
                                  maxWidth: 200,
                                  maxHeight: 200,
                                  objectFit: 'contain',
                                  borderRadius: 1,
                                  border: '2px solid #1976d2',
                                  cursor: 'pointer'
                                }}
                                onClick={() => openFullscreenImage(comment.commentImage)}
                              />
                            </Box>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    {t('taskDetail.noComments')}
                  </Typography>
                )}
              </Box>
            </Box>
          )}

        </Box>
      </DialogContent>
      <MoveTaskModal
        open={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        task={task}
        currentWorkGroup={workGroup}
        onMoveSuccess={onTaskUpdated}
      />
      
      <Dialog 
        open={fullscreenImageOpen} 
        onClose={() => setFullscreenImageOpen(false)} 
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0,0,0,0.9)',
            boxShadow: 'none'
          }
        }}
      >
        <IconButton
          onClick={() => setFullscreenImageOpen(false)}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.5)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
          }}
          data-testid="button-close-fullscreen-image"
        >
          <Close />
        </IconButton>
        <img 
          src={fullscreenImage} 
          alt="Fullscreen" 
          style={{ 
            width: '100%', 
            height: 'auto', 
            maxHeight: '90vh', 
            objectFit: 'contain' 
          }} 
        />
      </Dialog>

      <Dialog 
        open={receiptUploadDialogOpen} 
        onClose={() => setReceiptUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Pošalji Račun</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Uploadujte račun za ovaj zadatak. Potrebno je priložiti fajl i unijeti iznos.
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              data-testid="button-select-receipt-file"
            >
              {receiptFile ? receiptFile.name : 'Odaberi Fajl'}
              <input
                type="file"
                hidden
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setReceiptFile(file);
                }}
              />
            </Button>
            <TextField
              label="Iznos (CHF)"
              value={receiptAmount}
              onChange={(e) => setReceiptAmount(e.target.value)}
              fullWidth
              required
              type="number"
              placeholder="Unesite iznos"
              data-testid="input-receipt-amount"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiptUploadDialogOpen(false)} data-testid="button-cancel-receipt">
            Odustani
          </Button>
          <Button 
            onClick={handleUploadReceipt}
            variant="contained"
            disabled={uploadReceiptMutation.isPending || !receiptFile || !receiptAmount}
            data-testid="button-submit-receipt"
          >
            {uploadReceiptMutation.isPending ? 'Uploadovanje...' : 'Pošalji'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}

interface MoveTaskModalProps {
  open: boolean;
  onClose: () => void;
  task: any;
  currentWorkGroup: WorkGroup | null;
  onMoveSuccess: () => void;
}

function MoveTaskModal({ open, onClose, task, currentWorkGroup, onMoveSuccess }: MoveTaskModalProps) {
  const { t } = useTranslation(['tasks', 'common']);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedWorkGroupId, setSelectedWorkGroupId] = useState('');

  const workGroupsQuery = useQuery<WorkGroup[]>({
    queryKey: ['/api/work-groups'],
    enabled: open,
    retry: 1,
  });

  const moveTaskMutation = useMutation({
    mutationFn: async (newWorkGroupId: string) => {
      const response = await apiRequest(`/api/tasks/${task.id}/move`, 'PATCH', { newWorkGroupId });
      return response.json();
    },
    onSuccess: (data) => {
      const newWorkGroup = workGroupsQuery.data?.find(wg => wg.id === selectedWorkGroupId);
      queryClient.invalidateQueries({ queryKey: ['/api/work-groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ 
        title: t('common:success'), 
        description: newWorkGroup ? t('toasts.taskMoved', { name: newWorkGroup.name }) : t('toasts.taskMovedGeneric')
      });
      onMoveSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: t('common:error'), 
        description: error.message || t('toasts.taskMoveError'), 
        variant: 'destructive' 
      });
    }
  });

  const handleMove = () => {
    if (!selectedWorkGroupId) {
      toast({ 
        title: t('common:error'), 
        description: t('toasts.selectSection'), 
        variant: 'destructive' 
      });
      return;
    }
    moveTaskMutation.mutate(selectedWorkGroupId);
  };

  const availableWorkGroups = workGroupsQuery.data?.filter(
    wg => wg.id !== currentWorkGroup?.id
  ) || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{t('moveTask.title')}</Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {t('moveTask.description', { title: task?.title })}
          </Typography>
          <TextField
            variant="outlined"
            select
            label={t('moveTask.selectSection')}
            value={selectedWorkGroupId}
            onChange={(e) => setSelectedWorkGroupId(e.target.value)}
            fullWidth
            disabled={moveTaskMutation.isPending || workGroupsQuery.isLoading}
            data-testid="select-move-work-group"
          >
            {workGroupsQuery.isLoading ? (
              <MenuItem value="" disabled>{t('moveTask.loading')}</MenuItem>
            ) : availableWorkGroups.length === 0 ? (
              <MenuItem value="" disabled>{t('moveTask.noSectionsAvailable')}</MenuItem>
            ) : (
              availableWorkGroups.map((workGroup) => (
                <MenuItem key={workGroup.id} value={workGroup.id}>
                  {workGroup.name}
                </MenuItem>
              ))
            )}
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          disabled={moveTaskMutation.isPending}
          data-testid="button-cancel-move"
        >
          {t('moveTask.cancel')}
        </Button>
        <Button 
          onClick={handleMove} 
          variant="contained"
          disabled={moveTaskMutation.isPending || !selectedWorkGroupId}
          data-testid="button-confirm-move"
        >
          {moveTaskMutation.isPending ? t('moveTask.moving') : t('moveTask.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface TaskManagementContentProps {
  workGroup: WorkGroup | null;
  currentUser: any;
  onClose: () => void;
}

function TaskManagementContent({ workGroup, currentUser, onClose }: TaskManagementContentProps) {
  const { t } = useTranslation(['tasks', 'common']);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);

  const tasksQuery = useQuery({
    queryKey: ['/api/work-groups', workGroup?.id, 'tasks'],
    enabled: !!workGroup?.id,
    retry: 1,
  });

  const membersQuery = useQuery({
    queryKey: ['/api/work-groups', workGroup?.id, 'members'],
    enabled: !!workGroup?.id,
    retry: 1,
  });

  const isModeratorOrAdmin = () => {
    if (!currentUser || !membersQuery.data) return false;
    if (currentUser.isAdmin) return true;
    
    const userMembership = Array.isArray(membersQuery.data) ? membersQuery.data.find((member: any) => member.userId === currentUser.id) : null;
    return userMembership?.isModerator || false;
  };

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await apiRequest('/api/tasks', 'POST', taskData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-groups', workGroup?.id, 'tasks'] });
      toast({ title: t('common:success'), description: t('toasts.taskCreated') });
      setCreateTaskOpen(false);
    },
    onError: () => {
      toast({ title: t('common:error'), description: t('toasts.taskCreateError'), variant: 'destructive' });
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await apiRequest(`/api/tasks/${taskId}`, 'PUT', { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-groups', workGroup?.id, 'tasks'] });
      toast({ title: t('common:success'), description: t('toasts.taskStatusUpdated') });
    },
    onError: () => {
      toast({ title: t('common:error'), description: t('toasts.taskUpdateError'), variant: 'destructive' });
    }
  });

  const handleCreateTask = () => {
    setCreateTaskOpen(true);
  };

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  };

  const handleMarkCompleted = (taskId: string) => {
    updateTaskMutation.mutate({ taskId, status: 'na_cekanju' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'u_toku': return 'primary';
      case 'na_cekanju': return 'warning';
      case 'završeno': return 'success';
      case 'otkazano': return 'error';
      case 'arhiva': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    return t(`task.status.${status}`) || status;
  };

  const getAssignedUserNames = (userIds: string[]) => {
    if (!userIds || userIds.length === 0) return '';
    const members = Array.isArray(membersQuery.data) ? membersQuery.data : [];
    const names = userIds.map(userId => {
      const member = members.find((m: any) => m.userId === userId);
      return member?.user ? `${member.user.firstName} ${member.user.lastName}` : t('unknownUser');
    });
    return names.join(', ');
  };

  if (tasksQuery.isLoading || membersQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t('taskDialog.taskCount', { count: Array.isArray(tasksQuery.data) ? tasksQuery.data.length : 0 })}
        </Typography>
        {isModeratorOrAdmin() && (
          <Button
            variant="contained"
            onClick={handleCreateTask}
            data-testid="button-create-task"
          >
            {t('taskDialog.createNew')}
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {Array.isArray(tasksQuery.data) && tasksQuery.data.length > 0 ? (
          tasksQuery.data.map((task: any) => (
            <Card 
              key={task.id}
              sx={{ 
                cursor: 'pointer',
                '&:hover': { backgroundColor: 'action.hover' }
              }}
              onClick={() => handleTaskClick(task)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {task.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {task.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip
                        label={getStatusLabel(task.status)}
                        color={getStatusColor(task.status) as any}
                        size="small"
                      />
                      {task.assignedUserIds && task.assignedUserIds.length > 0 && (
                        <Typography variant="caption" color="text.secondary" data-testid={`task-assignees-${task.id}`}>
                          {t('taskDialog.assigned')}: {getAssignedUserNames(task.assignedUserIds)}
                        </Typography>
                      )}
                      {task.dueDate && (
                        <Typography variant="caption" color="text.secondary">
                          {t('taskDialog.deadline')}: {new Date(task.dueDate).toLocaleDateString('hr-HR')}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {task.status !== 'završeno' && task.status !== 'na_cekanju' && task.assignedUserIds?.includes(currentUser?.id) && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkCompleted(task.id);
                        }}
                        data-testid={`button-complete-task-${task.id}`}
                      >
                        {t('taskDialog.markAsComplete')}
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">
                {t('taskDialog.noTasksForSection')}
              </Typography>
              {isModeratorOrAdmin() && (
                <Button
                  variant="contained"
                  onClick={handleCreateTask}
                  sx={{ mt: 2 }}
                  data-testid="button-create-first-task"
                >
                  {t('taskDialog.createFirstTask')}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </Box>

      <TaskCreateDialog
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        workGroup={workGroup}
        members={Array.isArray(membersQuery.data) ? membersQuery.data : []}
        onSave={createTaskMutation.mutate}
      />

      <TaskDetailDialog
        open={taskDetailOpen}
        onClose={() => {
          setTaskDetailOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        workGroup={workGroup}
        currentUser={currentUser}
        isModeratorOrAdmin={isModeratorOrAdmin()}
        members={Array.isArray(membersQuery.data) ? membersQuery.data : []}
        onTaskUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/work-groups', workGroup?.id, 'tasks'] });
        }}
      />
    </Box>
  );
}
