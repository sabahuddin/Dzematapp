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
  MenuItem
} from '@mui/material';
import {
  GroupAdd,
  ManageAccounts,
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
  workGroup: WorkGroup & { members?: WorkGroupMember[] };
  onManageMembers: (workGroup: WorkGroup) => void;
  onManageTasks: (workGroup: WorkGroup) => void;
  onJoinRequest: (workGroup: WorkGroup) => void;
  currentUser: any;
}

function WorkGroupCard({ workGroup, onManageMembers, onManageTasks, onJoinRequest, currentUser }: WorkGroupCardProps) {
  const { toast } = useToast();
  
  // Check if current user is a member of this work group
  const isMember = workGroup.members?.some((m: WorkGroupMember) => m.userId === currentUser?.id) || false;
  const isAdmin = currentUser?.isAdmin || false;

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
              {`${workGroup.members?.length || 0} članova`}
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
                  Upravljaj Članovima
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => onManageTasks(workGroup)}
                  data-testid={`button-manage-tasks-${workGroup.id}`}
                >
                  Upravljaj Zadacima
                </Button>
              </>
            ) : isMember ? (
              <Button
                variant="contained"
                onClick={() => onManageTasks(workGroup)}
                data-testid={`button-view-tasks-${workGroup.id}`}
              >
                Pogledaj Zadatke
              </Button>
            ) : (
              <Button
                variant="outlined"
                onClick={() => onJoinRequest(workGroup)}
                data-testid={`button-join-${workGroup.id}`}
              >
                Pridruži se
              </Button>
            )}
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
  const [taskManagementDialogOpen, setTaskManagementDialogOpen] = useState(false);
  const [selectedWorkGroup, setSelectedWorkGroup] = useState<WorkGroup | null>(null);

  // Fetch work groups
  const workGroupsQuery = useQuery<WorkGroup[]>({
    queryKey: ['/api/work-groups'],
    retry: 1,
  });

  // Fetch access requests (only for admins)
  const accessRequestsQuery = useQuery<AccessRequest[]>({
    queryKey: ['/api/access-requests'],
    retry: 1,
    enabled: !!user?.isAdmin,
  });

  // Fetch users for access request names (only for admins)
  const usersQuery = useQuery<User[]>({
    queryKey: ['/api/users'],
    retry: 1,
    enabled: !!user?.isAdmin,
  });

  // All work groups are shown to all users
  const userWorkGroups = React.useMemo(() => {
    if (!workGroupsQuery.data) return [];
    return workGroupsQuery.data;
  }, [workGroupsQuery.data]);

  // Create work group mutation
  const createWorkGroupMutation = useMutation({
    mutationFn: async (workGroupData: any) => {
      const response = await apiRequest('POST', '/api/work-groups', workGroupData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-groups'] });
      toast({ title: 'Uspjeh', description: 'Sekcija je uspješno kreirana' });
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri kreiranju sekcije', variant: 'destructive' });
    }
  });

  // Create access request mutation
  const createAccessRequestMutation = useMutation({
    mutationFn: async (requestData: any) => {
      const response = await apiRequest('POST', '/api/access-requests', requestData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/access-requests'] });
      toast({ title: 'Uspjeh', description: 'Zahtjev za pristup je poslat' });
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri slanju zahtjeva', variant: 'destructive' });
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
    setSelectedWorkGroup(workGroup);
    setTaskManagementDialogOpen(true);
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


  // Get user name from users data
  const getUserName = (userId: string) => {
    const user = usersQuery.data?.find((u: any) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Nepoznat korisnik';
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
        Greška pri učitavanju podataka. Molimo pokušajte ponovo.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Sekcije
      </Typography>

      {user?.isAdmin && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="task manager tabs">
            <Tab label="Sekcije" data-testid="tab-work-groups" />
            <Tab label="Zahtjevi za Pristup" data-testid="tab-access-requests" />
          </Tabs>
        </Box>
      )}

      {/* Work Groups Tab */}
      <TabPanel value={tabValue} index={0}>
        {user?.isAdmin && (
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<GroupAdd />}
              onClick={handleCreateWorkGroup}
              data-testid="button-create-work-group"
            >
              Kreiraj sekciju
            </Button>
          </Box>
        )}

        <Grid container spacing={3}>
          {userWorkGroups.map((workGroup: WorkGroup) => (
            <WorkGroupCard 
              key={workGroup.id}
              workGroup={workGroup}
              onManageMembers={handleManageMembers}
              onManageTasks={handleManageGroupTasks}
              onJoinRequest={handleJoinRequest}
              currentUser={user}
            />
          ))}
          
          {(!userWorkGroups || userWorkGroups.length === 0) && (
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Typography color="text.secondary">
                    Nema dostupnih sekcija
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
                  <TableCell sx={{ fontWeight: 600 }}>Naziv Sekcije</TableCell>
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
                              onClick={() => handleApproveRequest(request.id)}
                              data-testid={`button-approve-${request.id}`}
                            >
                              Odobri
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Close />}
                              onClick={() => handleRejectRequest(request.id)}
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
      <MemberManagementDialog
        open={memberManagementDialogOpen && selectedWorkGroup !== null}
        onClose={() => setMemberManagementDialogOpen(false)}
        workGroup={selectedWorkGroup || { id: '', name: '', description: '', createdAt: new Date(), visibility: 'public' }}
      />
      
      {/* Task Management Dialog */}
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
            Upravljanje Zadacima - {selectedWorkGroup?.name}
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

interface TaskCreateDialogProps {
  open: boolean;
  onClose: () => void;
  workGroup: WorkGroup | null;
  members: any[];
  onSave: (taskData: any) => void;
}

function TaskCreateDialog({ open, onClose, workGroup, members, onSave }: TaskCreateDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionImage, setDescriptionImage] = useState<string | null>(null);
  const [assignedToId, setAssignedToId] = useState('');
  const [status, setStatus] = useState('u_toku');
  const [dueDate, setDueDate] = useState('');

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
    
    const taskData = {
      title,
      description,
      descriptionImage: descriptionImage || null,
      workGroupId: workGroup.id,
      assignedToId: assignedToId || null,
      status,
      dueDate: dueDate ? new Date(dueDate) : null
    };
    
    onSave(taskData);
    setTitle('');
    setDescription('');
    setDescriptionImage(null);
    setAssignedToId('');
    setStatus('u_toku');
    setDueDate('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Kreiraj Novi Zadatak</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            variant="outlined"
            label="Naziv zadatka"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            fullWidth
            required
            data-testid="input-task-title"
          />
          <TextField
            variant="outlined"
            label="Opis zadatka"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            data-testid="input-task-description"
          />
          
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              Slika (opciono)
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
              data-testid="button-upload-task-image"
            >
              {descriptionImage ? 'Promijeni sliku' : 'Dodaj sliku'}
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
                    maxHeight: 200,
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
            variant="outlined"
            select
            label="Status"
            value={status}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStatus(e.target.value)}
            fullWidth
            data-testid="select-task-status"
          >
            <MenuItem value="u_toku">U toku</MenuItem>
            <MenuItem value="na_cekanju">Na čekanju</MenuItem>
            <MenuItem value="završeno">Završeno</MenuItem>
            <MenuItem value="otkazano">Otkazano</MenuItem>
            <MenuItem value="arhiva">Arhiva</MenuItem>
          </TextField>
          <TextField
            variant="outlined"
            select
            label="Dodijeli članu"
            value={assignedToId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssignedToId(e.target.value)}
            fullWidth
            data-testid="select-task-assignee"
          >
            <MenuItem value="">Bez dodijeljenja</MenuItem>
            {members?.map((member: any) => (
              <MenuItem key={member.userId} value={member.userId}>
                {member.user ? `${member.user.firstName} ${member.user.lastName}` : 'Nepoznat korisnik'}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            variant="outlined"
            label="Rok izvršavanja"
            type="date"
            value={dueDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDueDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            data-testid="input-task-due-date"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} data-testid="button-cancel-task">Otkaži</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!title}
          data-testid="button-save-task"
        >
          Sačuvaj
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

function TaskDetailDialog({ open, onClose, task, workGroup, currentUser, isModeratorOrAdmin, members, onTaskUpdated }: TaskDetailDialogProps) {
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedDescriptionImage, setEditedDescriptionImage] = useState<string | null>(null);
  const [editedStatus, setEditedStatus] = useState('');
  const [editedAssignedToId, setEditedAssignedToId] = useState('');
  const [editedDueDate, setEditedDueDate] = useState('');
  const queryClient = useQueryClient();

  // Initialize edit form when task changes
  React.useEffect(() => {
    if (task) {
      setEditedTitle(task.title || '');
      setEditedDescription(task.description || '');
      setEditedDescriptionImage(task.descriptionImage || null);
      setEditedStatus(task.status || 'u_toku');
      setEditedAssignedToId(task.assignedToId || '');
      setEditedDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    }
  }, [task]);

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

  // Fetch task comments
  const commentsQuery = useQuery({
    queryKey: ['/api/tasks', task?.id, 'comments'],
    enabled: !!task?.id && open,
    retry: 1,
  });


  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (commentData: { content: string; commentImage?: string | null }) => {
      const response = await apiRequest('POST', `/api/tasks/${task.id}/comments`, commentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', task.id, 'comments'] });
      setNewComment('');
      setCommentImage(null);
      toast({ title: 'Uspjeh', description: 'Komentar je dodan' });
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri dodavanju komentara', variant: 'destructive' });
    }
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await apiRequest('PUT', `/api/tasks/${task.id}`, taskData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-groups', workGroup?.id, 'tasks'] });
      toast({ title: 'Uspjeh', description: 'Zadatak je ažuriran' });
      setIsEditing(false);
      onTaskUpdated();
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri ažuriranju zadatka', variant: 'destructive' });
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/tasks/${task.id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-groups', workGroup?.id, 'tasks'] });
      toast({ title: 'Uspjeh', description: 'Zadatak je obrisan' });
      onClose();
      onTaskUpdated();
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri brisanju zadatka', variant: 'destructive' });
    }
  });

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate({ 
      content: newComment.trim(),
      commentImage: commentImage || null
    });
  };

  const handleSaveEdit = () => {
    if (!editedTitle.trim()) return;
    
    const taskData = {
      title: editedTitle,
      description: editedDescription,
      descriptionImage: editedDescriptionImage || null,
      status: editedStatus,
      assignedToId: editedAssignedToId || null,
      dueDate: editedDueDate ? new Date(editedDueDate) : null,
    };
    
    updateTaskMutation.mutate(taskData);
  };

  const handleMarkPending = () => {
    updateTaskMutation.mutate({ status: 'na_cekanju' });
  };

  const handleApproveTask = () => {
    updateTaskMutation.mutate({ status: 'završeno' });
  };

  const handleDeleteTask = () => {
    if (window.confirm('Da li ste sigurni da želite obrisati ovaj zadatak?')) {
      deleteTaskMutation.mutate();
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
    switch (status) {
      case 'u_toku': return 'U toku';
      case 'na_cekanju': return 'Na čekanju';
      case 'završeno': return 'Završeno';
      case 'otkazano': return 'Otkazano';
      case 'arhiva': return 'Arhiva';
      default: return status;
    }
  };

  const getAssignedUserName = (userId: string) => {
    const member = members?.find((m: any) => m.userId === userId);
    return member?.user ? `${member.user.firstName} ${member.user.lastName}` : 'Nepoznat korisnik';
  };

  if (!task) return null;

  const isAssignedUser = currentUser?.id === task.assignedToId;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{isEditing ? 'Uredi Zadatak' : task.title}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isEditing && isModeratorOrAdmin && (
            <>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setIsEditing(true)}
                data-testid="button-edit-task"
              >
                Uredi
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setMoveModalOpen(true)}
                data-testid="button-move-task"
              >
                Premjesti
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="error"
                onClick={handleDeleteTask}
                data-testid="button-delete-task"
              >
                Obriši
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
          {/* Task Details / Edit Form */}
          {isEditing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                variant="outlined"
                label="Naziv zadatka"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                fullWidth
                required
                data-testid="input-edit-task-title"
              />
              <TextField
                variant="outlined"
                label="Opis zadatka"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                fullWidth
                multiline
                rows={3}
                data-testid="input-edit-task-description"
              />
              
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Slika (opciono)
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                  data-testid="button-upload-edit-task-image"
                >
                  {editedDescriptionImage ? 'Promijeni sliku' : 'Dodaj sliku'}
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
                        maxHeight: 200,
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
                label="Status"
                value={editedStatus}
                onChange={(e) => setEditedStatus(e.target.value)}
                fullWidth
                data-testid="select-edit-task-status"
              >
                <MenuItem value="u_toku">U toku</MenuItem>
                <MenuItem value="na_cekanju">Na čekanju</MenuItem>
                <MenuItem value="završeno">Završeno</MenuItem>
                <MenuItem value="otkazano">Otkazano</MenuItem>
                <MenuItem value="arhiva">Arhiva</MenuItem>
              </TextField>
              <TextField
                variant="outlined"
                select
                label="Dodijeli članu"
                value={editedAssignedToId}
                onChange={(e) => setEditedAssignedToId(e.target.value)}
                fullWidth
                data-testid="select-edit-task-assignee"
              >
                <MenuItem value="">Bez dodijeljenja</MenuItem>
                {members?.map((member: any) => (
                  <MenuItem key={member.userId} value={member.userId}>
                    {member.user ? `${member.user.firstName} ${member.user.lastName}` : 'Nepoznat korisnik'}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                variant="outlined"
                label="Rok izvršavanja"
                type="date"
                value={editedDueDate}
                onChange={(e) => setEditedDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                data-testid="input-edit-task-due-date"
              />
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button onClick={() => setIsEditing(false)} data-testid="button-cancel-edit">
                  Otkaži
                </Button>
                <Button 
                  onClick={handleSaveEdit} 
                  variant="contained"
                  disabled={!editedTitle.trim()}
                  data-testid="button-save-edit"
                >
                  Sačuvaj
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
                      border: '2px solid #1976d2'
                    }}
                  />
                </Box>
              )}
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <Chip 
                  label={getStatusLabel(task.status)} 
                  color={getStatusColor(task.status) as any}
                  data-testid="chip-task-status"
                />
                {task.assignedToId && (
                  <Chip 
                    label={`Dodijeljeno: ${getAssignedUserName(task.assignedToId)}`} 
                    variant="outlined"
                    data-testid="chip-task-assigned"
                  />
                )}
                {task.dueDate && (
                  <Chip 
                    label={`Rok: ${new Date(task.dueDate).toLocaleDateString('hr-HR')}`} 
                    variant="outlined"
                    data-testid="chip-task-due-date"
                  />
                )}
              </Box>
              
              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {isAssignedUser && task.status !== 'na_cekanju' && task.status !== 'završeno' && (
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={handleMarkPending}
                    data-testid="button-mark-pending"
                  >
                    Označiti kao završeno
                  </Button>
                )}
                {isModeratorOrAdmin && task.status === 'na_cekanju' && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleApproveTask}
                    data-testid="button-approve-task"
                  >
                    Odobri kao završeno
                  </Button>
                )}
              </Box>
            </Box>
          )}

          {/* Comments Section */}
          {!isEditing && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Komentari</Typography>
              
              {/* Add Comment */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    variant="outlined"
                    placeholder="Dodaj komentar..."
                    value={newComment}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewComment(e.target.value)}
                    fullWidth
                    size="small"
                    data-testid="input-new-comment"
                  />
                  <Button 
                    onClick={handleAddComment} 
                    variant="contained" 
                    disabled={!newComment.trim()}
                    data-testid="button-add-comment"
                  >
                    Dodaj
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
                    {commentImage ? 'Promijeni sliku' : 'Dodaj sliku'}
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
                  <Box sx={{ mt: 1 }}>
                    <Box
                      component="img"
                      src={commentImage}
                      alt="Comment preview"
                      sx={{
                        width: '100%',
                        maxHeight: 150,
                        objectFit: 'cover',
                        borderRadius: 1,
                        border: '2px solid #1976d2'
                      }}
                    />
                  </Box>
                )}
              </Box>

              {/* Comments List */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 300, overflowY: 'auto' }}>
                {commentsQuery.data && Array.isArray(commentsQuery.data) && commentsQuery.data.length > 0 ? (
                  commentsQuery.data.map((comment: any) => (
                    <Card key={comment.id} variant="outlined">
                      <CardContent sx={{ py: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : 'Nepoznat korisnik'} • {new Date(comment.createdAt).toLocaleDateString('hr-HR')}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {comment.content}
                        </Typography>
                        {comment.commentImage && (
                          <Box sx={{ mt: 1 }}>
                            <Box
                              component="img"
                              src={comment.commentImage}
                              alt="Comment image"
                              sx={{
                                width: '100%',
                                maxHeight: 200,
                                objectFit: 'cover',
                                borderRadius: 1,
                                border: '2px solid #1976d2'
                              }}
                            />
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    Nema komentara
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
      const response = await apiRequest('PATCH', `/api/tasks/${task.id}/move`, { newWorkGroupId });
      return response.json();
    },
    onSuccess: (data) => {
      const newWorkGroup = workGroupsQuery.data?.find(wg => wg.id === selectedWorkGroupId);
      queryClient.invalidateQueries({ queryKey: ['/api/work-groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ 
        title: 'Uspjeh', 
        description: `Zadatak uspješno premješten u ${newWorkGroup?.name || 'novu sekciju'}` 
      });
      onMoveSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Greška', 
        description: error.message || 'Greška pri premještanju zadatka', 
        variant: 'destructive' 
      });
    }
  });

  const handleMove = () => {
    if (!selectedWorkGroupId) {
      toast({ 
        title: 'Greška', 
        description: 'Molimo odaberite sekciju', 
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
        <Typography variant="h6">Premjesti Zadatak</Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Premjesti zadatak "{task?.title}" u drugu sekciju
          </Typography>
          <TextField
            variant="outlined"
            select
            label="Odaberite sekciju"
            value={selectedWorkGroupId}
            onChange={(e) => setSelectedWorkGroupId(e.target.value)}
            fullWidth
            disabled={moveTaskMutation.isPending || workGroupsQuery.isLoading}
            data-testid="select-move-work-group"
          >
            {workGroupsQuery.isLoading ? (
              <MenuItem value="" disabled>Učitavanje...</MenuItem>
            ) : availableWorkGroups.length === 0 ? (
              <MenuItem value="" disabled>Nema dostupnih sekcija</MenuItem>
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
          Odustani
        </Button>
        <Button 
          onClick={handleMove} 
          variant="contained"
          disabled={moveTaskMutation.isPending || !selectedWorkGroupId}
          data-testid="button-confirm-move"
        >
          {moveTaskMutation.isPending ? 'Premještanje...' : 'Potvrdi'}
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);

  // Fetch tasks for the work group
  const tasksQuery = useQuery({
    queryKey: ['/api/work-groups', workGroup?.id, 'tasks'],
    enabled: !!workGroup?.id,
    retry: 1,
  });

  // Fetch work group members to check moderator status
  const membersQuery = useQuery({
    queryKey: ['/api/work-groups', workGroup?.id, 'members'],
    enabled: !!workGroup?.id,
    retry: 1,
  });

  // Check if current user is moderator or admin
  const isModeratorOrAdmin = () => {
    if (!currentUser || !membersQuery.data) return false;
    if (currentUser.isAdmin) return true;
    
    const userMembership = Array.isArray(membersQuery.data) ? membersQuery.data.find((member: any) => member.userId === currentUser.id) : null;
    return userMembership?.isModerator || false;
  };

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await apiRequest('POST', '/api/tasks', taskData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-groups', workGroup?.id, 'tasks'] });
      toast({ title: 'Uspjeh', description: 'Zadatak je uspješno kreiran' });
      setCreateTaskOpen(false);
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri kreiranju zadatka', variant: 'destructive' });
    }
  });

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await apiRequest('PUT', `/api/tasks/${taskId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-groups', workGroup?.id, 'tasks'] });
      toast({ title: 'Uspjeh', description: 'Status zadatka je ažuriran' });
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri ažuriranju zadatka', variant: 'destructive' });
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
    switch (status) {
      case 'u_toku': return 'U toku';
      case 'na_cekanju': return 'Na čekanju';
      case 'završeno': return 'Završeno';
      case 'otkazano': return 'Otkazano';
      case 'arhiva': return 'Arhiva';
      default: return status;
    }
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
      {/* Header with Create Task Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Zadaci ({Array.isArray(tasksQuery.data) ? tasksQuery.data.length : 0})
        </Typography>
        {isModeratorOrAdmin() && (
          <Button
            variant="contained"
            onClick={handleCreateTask}
            data-testid="button-create-task"
          >
            Kreiraj Novi Zadatak
          </Button>
        )}
      </Box>

      {/* Task List */}
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
                      {task.assignedToId && (
                        <Typography variant="caption" color="text.secondary">
                          Dodijeljeno: {task.assignedToId}
                        </Typography>
                      )}
                      {task.dueDate && (
                        <Typography variant="caption" color="text.secondary">
                          Rok: {new Date(task.dueDate).toLocaleDateString('hr-HR')}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {task.status !== 'završeno' && task.status !== 'na_cekanju' && task.assignedToId === currentUser?.id && (
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
                        Označiti kao završeno
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
                Nema zadataka za ovu sekciju
              </Typography>
              {isModeratorOrAdmin() && (
                <Button
                  variant="contained"
                  onClick={handleCreateTask}
                  sx={{ mt: 2 }}
                  data-testid="button-create-first-task"
                >
                  Kreiraj Prvi Zadatak
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Create Task Dialog */}
      <TaskCreateDialog
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        workGroup={workGroup}
        members={Array.isArray(membersQuery.data) ? membersQuery.data : []}
        onSave={createTaskMutation.mutate}
      />

      {/* Task Detail Dialog */}
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
