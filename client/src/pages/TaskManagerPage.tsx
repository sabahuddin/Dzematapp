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
  DialogActions,
  TextField
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
  const [taskManagementDialogOpen, setTaskManagementDialogOpen] = useState(false);
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
    setSelectedWorkGroup(workGroup);
    setTaskManagementDialogOpen(true);
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
      <MemberManagementDialog
        open={memberManagementDialogOpen && selectedWorkGroup !== null}
        onClose={() => setMemberManagementDialogOpen(false)}
        workGroup={selectedWorkGroup || { id: '', name: '', description: '', createdAt: new Date() }}
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
  const [assignedToId, setAssignedToId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = () => {
    if (!title || !workGroup) return;
    
    const taskData = {
      title,
      description,
      workGroupId: workGroup.id,
      assignedToId: assignedToId || null,
      dueDate: dueDate ? new Date(dueDate) : null
    };
    
    onSave(taskData);
    setTitle('');
    setDescription('');
    setAssignedToId('');
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
}

function TaskDetailDialog({ open, onClose, task, workGroup, currentUser }: TaskDetailDialogProps) {
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  // Fetch task comments
  const commentsQuery = useQuery({
    queryKey: ['/api/tasks', task?.id, 'comments'],
    enabled: !!task?.id && open,
    retry: 1,
  });

  // Fetch group files
  const filesQuery = useQuery({
    queryKey: ['/api/work-groups', workGroup?.id, 'files'],
    enabled: !!workGroup?.id && open,
    retry: 1,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', `/api/tasks/${task.id}/comments`, { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', task.id, 'comments'] });
      setNewComment('');
      toast({ title: 'Uspjeh', description: 'Komentar je dodan' });
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri dodavanju komentara', variant: 'destructive' });
    }
  });

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment.trim());
  };

  if (!task) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{task.title}</Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Task Description */}
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>{task.description}</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip label={`Status: ${task.status}`} />
              {task.assignedToId && (
                <Chip label={`Dodijeljeno: ${task.assignedToId}`} variant="outlined" />
              )}
              {task.dueDate && (
                <Chip 
                  label={`Rok: ${new Date(task.dueDate).toLocaleDateString('hr-HR')}`} 
                  variant="outlined" 
                />
              )}
            </Box>
          </Box>

          {/* Comments Section */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Komentari</Typography>
            
            {/* Add Comment */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
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

            {/* Comments List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 200, overflowY: 'auto' }}>
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

          {/* Files Section */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Fajlovi grupe</Typography>
            {filesQuery.data && Array.isArray(filesQuery.data) && filesQuery.data.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {filesQuery.data.map((file: any) => (
                  <Card key={file.id} variant="outlined">
                    <CardContent sx={{ py: 1 }}>
                      <Typography variant="body2">{file.fileName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {file.uploadedBy ? `${file.uploadedBy.firstName} ${file.uploadedBy.lastName}` : 'Nepoznat korisnik'} • {new Date(file.uploadedAt).toLocaleDateString('hr-HR')}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                Nema fajlova
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
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
    updateTaskMutation.mutate({ taskId, status: 'completed' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Završeno';
      case 'in_progress': return 'U tijeku';
      default: return 'Za uraditi';
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
                    {task.status !== 'completed' && task.assignedToId === currentUser?.id && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
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
                Nema zadataka za ovu grupu
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
        onClose={() => setTaskDetailOpen(false)}
        task={selectedTask}
        workGroup={workGroup}
        currentUser={currentUser}
      />
    </Box>
  );
}
