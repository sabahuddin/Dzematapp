import React from 'react';
import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { bs } from 'date-fns/locale';
import { queryClient } from "./lib/queryClient";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import LoginPage from "@/pages/LoginPage";
import GuestPage from "@/pages/GuestPage";
import DashboardHome from "@/pages/DashboardHome";
import UsersPage from "@/pages/UsersPage";
import AnnouncementsPage from "@/pages/AnnouncementsPage";
import EventsPage from "@/pages/EventsPage";
import TaskManagerPage from "@/pages/TaskManagerPage";
import MessagesPage from "@/pages/MessagesPage";
import AskImamPage from "@/pages/AskImamPage";
import DocumentsPage from "@/pages/DocumentsPage";
import ShopPage from "@/pages/ShopPage";
import LivestreamPage from "@/pages/LivestreamPage";
import LivestreamSettingsPage from "@/pages/LivestreamSettingsPage";
import OrganizationSettingsPage from "@/pages/OrganizationSettingsPage";
import VaktijaPage from "@/pages/VaktijaPage";
import GuidePage from "@/pages/GuidePage";
import FinancesPage from "@/pages/FinancesPage";
import ActivityLogPage from "@/pages/ActivityLogPage";
import UserPointsDetailsPage from "@/pages/UserPointsDetailsPage";
import BadgesPage from "@/pages/BadgesPage";
import MyBadgesPage from "@/pages/MyBadgesPage";
import ProjectsPage from "@/pages/ProjectsPage";
import CertificateTemplatesPage from "@/pages/CertificateTemplatesPage";
import IssueCertificatesPage from "@/pages/IssueCertificatesPage";
import MyCertificatesPage from "@/pages/MyCertificatesPage";
import AllCertificatesPage from "@/pages/AllCertificatesPage";
import MembershipApplicationsPage from "@/pages/MembershipApplicationsPage";
import ApplicationsPage from "@/pages/ApplicationsPage";
import FeedPage from "@/pages/FeedPage";
import NotFound from "@/pages/not-found";

// Layout
import DashboardLayout from "@/components/layout/DashboardLayout";

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#eeeeee',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiTextField: {
      defaultProps: {
        InputLabelProps: {
          shrink: true,
        },
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: '#e0e0e0',
              borderWidth: '1px',
            },
            '&:hover fieldset': {
              borderColor: '#bdbdbd',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1976d2',
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiSelect: {
      defaultProps: {
        displayEmpty: true,
      },
    },
    MuiInputLabel: {
      defaultProps: {
        shrink: true,
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: '#e0e0e0',
              borderWidth: '1px',
            },
            '&:hover fieldset': {
              borderColor: '#bdbdbd',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1976d2',
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

// Admin-Only Route Component
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (!user.isAdmin) {
    return <Redirect to="/dashboard" />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

// Router Component
function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        {user ? <Redirect to="/dashboard" /> : <LoginPage />}
      </Route>
      
      <Route path="/guest">
        <GuestPage />
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardHome />
        </ProtectedRoute>
      </Route>
      
      <Route path="/feed">
        <ProtectedRoute>
          <FeedPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/vaktija">
        <ProtectedRoute>
          <VaktijaPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/vodic">
        <ProtectedRoute>
          <GuidePage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/users">
        <ProtectedRoute>
          <UsersPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/finances">
        <ProtectedRoute>
          <FinancesPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/activity-log">
        <ProtectedRoute>
          <ActivityLogPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/my-points">
        <ProtectedRoute>
          <UserPointsDetailsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/my-badges">
        <ProtectedRoute>
          <MyBadgesPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/badges">
        <AdminRoute>
          <BadgesPage />
        </AdminRoute>
      </Route>
      
      <Route path="/projects">
        <ProtectedRoute>
          <ProjectsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/certificate-templates">
        <AdminRoute>
          <CertificateTemplatesPage />
        </AdminRoute>
      </Route>
      
      <Route path="/issue-certificates">
        <AdminRoute>
          <IssueCertificatesPage />
        </AdminRoute>
      </Route>
      
      <Route path="/my-certificates">
        <ProtectedRoute>
          <MyCertificatesPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/all-certificates">
        <AdminRoute>
          <AllCertificatesPage />
        </AdminRoute>
      </Route>
      
      <Route path="/membership-applications">
        <ProtectedRoute>
          <MembershipApplicationsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/announcements">
        <ProtectedRoute>
          <AnnouncementsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/events">
        <ProtectedRoute>
          <EventsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/tasks">
        <ProtectedRoute>
          <TaskManagerPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/messages">
        <ProtectedRoute>
          <MessagesPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/ask-imam">
        <ProtectedRoute>
          <AskImamPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/documents">
        <ProtectedRoute>
          <DocumentsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/shop">
        <ProtectedRoute>
          <ShopPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/applications">
        <ProtectedRoute>
          <ApplicationsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/livestream">
        <ProtectedRoute>
          <LivestreamPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/livestream-settings">
        <AdminRoute>
          <LivestreamSettingsPage />
        </AdminRoute>
      </Route>
      
      <Route path="/organization-settings">
        <AdminRoute>
          <OrganizationSettingsPage />
        </AdminRoute>
      </Route>
      
      <Route path="/">
        {user ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={bs}>
            <AuthProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </AuthProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  );
}

export default App;
