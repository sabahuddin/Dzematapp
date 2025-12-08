import { ReactNode } from "react";
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
import MyActivitiesPage from "@/pages/MyActivitiesPage";
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
import SponsorsPage from "@/pages/SponsorsPage";
import MembershipFeesPage from "@/pages/MembershipFeesPage";
import NotFound from "@/pages/not-found";

// Layout
import DashboardLayout from "@/components/layout/DashboardLayout";

// Create Material-UI theme - Spiritual Tech Indigo
const theme = createTheme({
  palette: {
    primary: {
      main: '#3949AB',
      dark: '#303F9F',
      light: '#5C6BC0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1E88E5',
      dark: '#1976D2',
      light: '#42A5F5',
      contrastText: '#ffffff',
    },
    success: {
      main: '#26A69A',
      light: '#4DB6AC',
      dark: '#00897B',
    },
    background: {
      default: '#ECEFF1',
      paper: '#ffffff',
    },
    text: {
      primary: '#0D1B2A',
      secondary: '#546E7A',
    },
  },
  typography: {
    fontFamily: 'Inter, Roboto, "SF Pro", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 700,
      color: '#0D1B2A',
    },
    h2: {
      fontWeight: 700,
      color: '#0D1B2A',
    },
    h3: {
      fontWeight: 600,
      color: '#0D1B2A',
    },
    h4: {
      fontWeight: 600,
      color: '#0D1B2A',
    },
    h5: {
      fontWeight: 600,
      color: '#0D1B2A',
    },
    h6: {
      fontWeight: 600,
      color: '#0D1B2A',
    },
    body1: {
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontWeight: 400,
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          border: 'none',
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ ownerState }) => {
          const isOverlay = ownerState.elevation !== undefined && ownerState.elevation > 3;
          
          return {
            borderRadius: 16,
            ...(!isOverlay && {
              backgroundColor: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
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
            backgroundColor: '#ECEFF1',
            borderRadius: 12,
            transition: 'box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',
            '&:hover': {
              backgroundColor: '#ffffff',
            },
            '&.Mui-focused': {
              backgroundColor: '#ffffff',
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#ECEFF1',
          borderRadius: 12,
          '&:hover': {
            backgroundColor: '#ffffff',
          },
          '&.Mui-focused': {
            backgroundColor: '#ffffff',
          },
        },
        notchedOutline: {
          border: '1px solid #c5cae9',
          borderRadius: 12,
          padding: 0,
          top: 0,
          '& legend': {
            display: 'none',
            width: 0,
            maxWidth: 0,
            padding: 0,
            height: 0,
            overflow: 'hidden',
          },
          '.MuiOutlinedInput-root:hover &': {
            border: '1px solid #9fa8da',
          },
          '.MuiOutlinedInput-root.Mui-focused &': {
            border: '2px solid #3949AB',
          },
        },
        input: {
          backgroundColor: 'transparent',
          borderRadius: 12,
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
      styleOverrides: {
        root: {
          position: 'relative',
          transform: 'none',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#0D1B2A',
          marginBottom: '6px',
          display: 'block',
        },
        shrink: {
          position: 'relative',
          transform: 'none',
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          backgroundColor: '#1E88E5',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#1976D2',
          },
        },
        outlined: {
          borderColor: '#3949AB',
          color: '#3949AB',
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(57, 73, 171, 0.04)',
            borderColor: '#3949AB',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 9999,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#3949AB',
          color: '#ffffff',
          boxShadow: 'none',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderTop: '1px solid #ECEFF1',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: '#B0BEC5',
          '&.Mui-selected': {
            color: '#3949AB',
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e8eaf6',
        },
        list: {
          padding: '8px',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 0',
          padding: '10px 16px',
          '&:hover': {
            backgroundColor: '#f8f9ff',
          },
          '&.Mui-selected': {
            backgroundColor: '#f0f2ff',
            '&:hover': {
              backgroundColor: '#e8eaf6',
            },
          },
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        },
        listbox: {
          padding: '8px',
        },
        option: {
          borderRadius: 8,
          margin: '2px 0',
          '&:hover': {
            backgroundColor: '#f8f9ff',
          },
          '&[aria-selected="true"]': {
            backgroundColor: '#f0f2ff',
            '&:hover': {
              backgroundColor: '#e8eaf6',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '1.25rem',
          color: '#0D1B2A',
          padding: '24px 24px 16px',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px 24px',
          gap: '12px',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f5f7ff',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #e8eaf6',
          padding: '16px',
        },
        head: {
          fontWeight: 600,
          color: '#0D1B2A',
          backgroundColor: '#f5f7ff',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#fafbff',
          },
          '&:last-child td': {
            borderBottom: 0,
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderRadius: '16px !important',
          border: '1px solid #c5cae9',
          boxShadow: '0 2px 8px rgba(57, 73, 171, 0.08)',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: '0 0 16px 0',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          backgroundColor: '#f5f7ff',
          borderRadius: 16,
          '&:hover': {
            backgroundColor: '#f5f7ff',
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '24px',
          backgroundColor: '#fafbff',
          borderTop: '1px solid #e8eaf6',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#3949AB',
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          color: '#546E7A',
          '&.Mui-selected': {
            color: '#3949AB',
            fontWeight: 600,
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 42,
          height: 26,
          padding: 0,
        },
        switchBase: {
          padding: 1,
          '&.Mui-checked': {
            color: '#ffffff',
            '& + .MuiSwitch-track': {
              backgroundColor: '#3949AB',
              opacity: 1,
            },
          },
        },
        thumb: {
          width: 24,
          height: 24,
        },
        track: {
          borderRadius: 13,
          backgroundColor: '#B0BEC5',
          opacity: 1,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#0D1B2A',
          color: '#ffffff',
          fontSize: '0.75rem',
          borderRadius: 8,
          padding: '8px 12px',
        },
        arrow: {
          color: '#0D1B2A',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '&:hover': {
            backgroundColor: 'rgba(57, 73, 171, 0.08)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&:hover': {
            backgroundColor: '#ECEFF1',
          },
          '&.Mui-selected': {
            backgroundColor: 'hsl(231 54% 97%)',
            color: '#3949AB',
            '&:hover': {
              backgroundColor: 'hsl(231 54% 95%)',
            },
          },
        },
      },
    },
  },
});

// Protected Route Component
function ProtectedRoute({ children }: { children: ReactNode }) {
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
function AdminRoute({ children }: { children: ReactNode }) {
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
function SuperAdminRoute({ children }: { children: ReactNode }) {
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
      
      <Route path="/membership-fees">
        <AdminRoute>
          <MembershipFeesPage />
        </AdminRoute>
      </Route>
      
      <Route path="/activity-log">
        <ProtectedRoute>
          <ActivityLogPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/my-activities">
        <ProtectedRoute>
          <MyActivitiesPage />
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
      
      <Route path="/sponsors">
        <ProtectedRoute>
          <SponsorsPage />
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
