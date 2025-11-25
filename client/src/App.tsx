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
import SuperAdminLoginPage from "@/pages/SuperAdminLoginPage";
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
import SettingsPage from "@/pages/SettingsPage";
import VaktijaPage from "@/pages/VaktijaPage";
import GuidePage from "@/pages/GuidePage";
import FinancesPage from "@/pages/FinancesPage";
import ActivityLogPage from "@/pages/ActivityLogPage";
import BadgesPage from "@/pages/BadgesPage";
import MyBadgesPage from "@/pages/MyBadgesPage";
import BadgesAdminPage from "@/pages/BadgesAdminPage";
import ProjectsPage from "@/pages/ProjectsPage";
import CertificateTemplatesPage from "@/pages/CertificateTemplatesPage";
import IssueCertificatesPage from "@/pages/IssueCertificatesPage";
import MyCertificatesPage from "@/pages/MyCertificatesPage";
import AllCertificatesPage from "@/pages/AllCertificatesPage";
import CertificatesPage from "@/pages/CertificatesPage";
import RecognitionsPage from "@/pages/RecognitionsPage";
import MembershipApplicationsPage from "@/pages/MembershipApplicationsPage";
import ApplicationsPage from "@/pages/ApplicationsPage";
import FeedPage from "@/pages/FeedPage";
import ModulesPage from "@/pages/ModulesPage";
import MobileDashboard from "@/pages/MobileDashboard";
import MyProfilePage from "@/pages/MyProfilePage";
import NotificationsPage from "@/pages/NotificationsPage";
import SuperAdminPanel from "@/pages/SuperAdminPanel";
import PricingPage from "@/pages/PricingPage";
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
      default: 'hsl(240 4% 96%)',
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
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--semantic-success-bg)',
          border: '2px solid var(--semantic-success-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 12px 24px rgba(18, 94, 48, 0.12)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ ownerState }) => {
          // Exclude high-elevation overlays (dialogs, menus, popovers) from green styling
          // Overlays typically use elevation 8+ (Menu=8, Popover=8, Dialog=24, Drawer=16)
          const isOverlay = ownerState.elevation !== undefined && ownerState.elevation > 3;
          
          return {
            borderRadius: 'var(--radius-lg)',
            // Apply green styling to all Papers EXCEPT high-elevation overlays
            ...(!isOverlay && {
              backgroundColor: 'var(--semantic-success-bg)',
              border: '2px solid var(--semantic-success-border)',
              boxShadow: '0 8px 16px rgba(18, 94, 48, 0.10)',
            }),
          };
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        InputLabelProps: {
          shrink: true,
        },
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'var(--surface-field)',
            borderRadius: 'var(--radius-lg)',
            transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--surface-field)',
          borderRadius: 'var(--radius-lg)',
          '& fieldset': {
            borderColor: 'var(--semantic-success-border)',
            borderWidth: '2px',
          },
          '&:hover fieldset': {
            borderColor: 'var(--semantic-success-active)',
          },
          '&.Mui-focused fieldset': {
            borderColor: 'var(--semantic-success-active)',
          },
          '&.Mui-focused': {
            boxShadow: '0 0 0 4px hsla(120, 68%, 42%, 0.20)',
          },
        },
        input: {
          backgroundColor: 'var(--surface-field)',
          borderRadius: 'var(--radius-lg)',
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
          borderRadius: '12px',
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

// Super Admin-Only Route Component (Global tenant management)
function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (!user.isSuperAdmin) {
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
      
      <Route path="/superadmin/login">
        {user?.isSuperAdmin ? <Redirect to="/super-admin/panel" /> : <SuperAdminLoginPage />}
      </Route>
      
      <Route path="/guest">
        <GuestPage />
      </Route>
      
      <Route path="/pricing">
        <PricingPage />
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
      
      <Route path="/badges-admin">
        <AdminRoute>
          <BadgesAdminPage />
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
      
      <Route path="/recognitions">
        <ProtectedRoute>
          <RecognitionsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/all-certificates">
        <AdminRoute>
          <AllCertificatesPage />
        </AdminRoute>
      </Route>
      
      <Route path="/certificates">
        <AdminRoute>
          <CertificatesPage />
        </AdminRoute>
      </Route>
      
      <Route path="/super-admin/panel">
        <SuperAdminRoute>
          <SuperAdminPanel />
        </SuperAdminRoute>
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
      
      <Route path="/settings">
        <AdminRoute>
          <SettingsPage />
        </AdminRoute>
      </Route>
      
      {/* Legacy route - redirect to /settings */}
      <Route path="/organization-settings">
        <AdminRoute>
          <SettingsPage />
        </AdminRoute>
      </Route>
      
      <Route path="/modules">
        <ProtectedRoute>
          <ModulesPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/my-profile">
        <ProtectedRoute>
          <MyProfilePage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/notifications">
        <ProtectedRoute>
          <NotificationsPage />
        </ProtectedRoute>
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
