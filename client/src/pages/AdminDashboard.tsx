import { Box, Typography, Grid } from '@mui/material';
import { 
  EventsWidget, 
  MembershipFeeWidget, 
  TasksWidget, 
  ActivityWidget, 
  MessagesWidget, 
  ShopWidget 
} from '@/components/dashboard';

export default function AdminDashboard() {
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Admin Dashboard
      </Typography>

      <Grid container spacing={2}>
        {/* Column 1: Events, Tasks */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <EventsWidget />
            <TasksWidget />
          </Box>
        </Grid>

        {/* Column 2: Membership Fees, Activity (tall) */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <MembershipFeeWidget />
            <ActivityWidget />
          </Box>
        </Grid>

        {/* Column 3: Messages, Shop */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <MessagesWidget />
            <ShopWidget />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
