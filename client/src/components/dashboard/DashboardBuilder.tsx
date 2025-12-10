import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, Chip, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Add, Edit, Save, Close, DragIndicator } from '@mui/icons-material';
import GridLayout from 'react-grid-layout';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { widgetRegistry, getDefaultLayout, type WidgetDefinition } from './WidgetRegistry';
import EventsWidget from './EventsWidget';
import MembershipFeeWidget from './MembershipFeeWidget';
import TasksWidget from './TasksWidget';
import ActivityWidget from './ActivityWidget';
import MessagesWidget from './MessagesWidget';
import ShopWidget from './ShopWidget';
import AnnouncementsWidget from './AnnouncementsWidget';
import UsersStatsWidget from './UsersStatsWidget';
import PrayerTimesWidget from './PrayerTimesWidget';
import WorkGroupsWidget from './WorkGroupsWidget';
import { DocumentsWidget, SettingsWidget, GuideWidget, ImamQAWidget } from './QuickLinkWidget';

const GRID_COLS = 5;
const ROW_HEIGHT = 120;
const MARGIN = 12;

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface DashboardLayoutData {
  id?: string;
  layout: string;
}

const widgetComponents: Record<string, React.ComponentType<{ size?: { w: number; h: number } }>> = {
  EventsWidget,
  MembershipFeeWidget,
  TasksWidget,
  ActivityWidget,
  MessagesWidget,
  ShopWidget,
  AnnouncementsWidget,
  UsersStatsWidget,
  PrayerTimesWidget,
  WorkGroupsWidget,
  DocumentsWidget,
  SettingsWidget,
  GuideWidget,
  ImamQAWidget,
};

export default function DashboardBuilder() {
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [containerWidth, setContainerWidth] = useState(1200);

  // Fetch saved layout
  const { data: savedLayout, isLoading } = useQuery<DashboardLayoutData>({
    queryKey: ['/api/dashboard-layout'],
  });

  // Save layout mutation
  const saveLayoutMutation = useMutation({
    mutationFn: async (layoutData: LayoutItem[]) => {
      return apiRequest('/api/dashboard-layout', {
        method: 'POST',
        body: JSON.stringify({ layout: JSON.stringify(layoutData) }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-layout'] });
      setSnackbar({ open: true, message: 'Raspored spremljen!', severity: 'success' });
      setIsEditing(false);
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Greška pri spremanju', severity: 'error' });
    },
  });

  // Initialize layout
  useEffect(() => {
    if (savedLayout?.layout) {
      try {
        setLayout(JSON.parse(savedLayout.layout));
      } catch {
        setLayout(getDefaultLayout());
      }
    } else if (!isLoading) {
      setLayout(getDefaultLayout());
    }
  }, [savedLayout, isLoading]);

  // Calculate container width
  useEffect(() => {
    const updateWidth = () => {
      const container = document.getElementById('dashboard-container');
      if (container) {
        setContainerWidth(container.offsetWidth - 48);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const handleLayoutChange = useCallback((newLayout: LayoutItem[]) => {
    if (isEditing) {
      setLayout(newLayout);
    }
  }, [isEditing]);

  const handleSave = () => {
    saveLayoutMutation.mutate(layout);
  };

  const handleAddWidget = (widget: WidgetDefinition, size: { w: number; h: number }) => {
    const existingWidget = layout.find(l => l.i === widget.id);
    if (existingWidget) {
      setSnackbar({ open: true, message: 'Widget već postoji na dashboardu', severity: 'error' });
      return;
    }

    // Find first available position
    let x = 0;
    let y = 0;
    const maxY = layout.reduce((max, l) => Math.max(max, l.y + l.h), 0);
    
    // Try to find space in existing rows first
    for (let row = 0; row <= maxY; row++) {
      for (let col = 0; col <= GRID_COLS - size.w; col++) {
        const overlaps = layout.some(l => 
          col < l.x + l.w && col + size.w > l.x &&
          row < l.y + l.h && row + size.h > l.y
        );
        if (!overlaps) {
          x = col;
          y = row;
          break;
        }
      }
    }
    
    // If no space found, add at bottom
    if (x === 0 && y === 0 && layout.length > 0) {
      y = maxY;
    }

    setLayout([...layout, { i: widget.id, x, y, w: size.w, h: size.h }]);
    setShowAddDialog(false);
  };

  const handleRemoveWidget = (widgetId: string) => {
    setLayout(layout.filter(l => l.i !== widgetId));
  };

  const renderWidget = (widgetId: string, size: { w: number; h: number }) => {
    const widget = widgetRegistry.find(w => w.id === widgetId);
    if (!widget) return null;

    const Component = widgetComponents[widget.component];
    if (!Component) return null;

    return <Component size={size} />;
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  const activeWidgetIds = layout.map(l => l.i);
  const availableWidgets = widgetRegistry.filter(w => !activeWidgetIds.includes(w.id));

  return (
    <Box id="dashboard-container" sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Admin Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isEditing ? (
            <>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => setShowAddDialog(true)}
                size="small"
              >
                Dodaj widget
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={saveLayoutMutation.isPending}
                size="small"
              >
                Spremi
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Close />}
                onClick={() => {
                  if (savedLayout?.layout) {
                    setLayout(JSON.parse(savedLayout.layout));
                  }
                  setIsEditing(false);
                }}
                size="small"
              >
                Odustani
              </Button>
            </>
          ) : (
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => setIsEditing(true)}
              size="small"
            >
              Uredi dashboard
            </Button>
          )}
        </Box>
      </Box>

      {/* Grid Layout */}
      <GridLayout
        className="layout"
        layout={layout}
        cols={GRID_COLS}
        rowHeight={ROW_HEIGHT}
        width={containerWidth}
        margin={[MARGIN, MARGIN]}
        onLayoutChange={handleLayoutChange as any}
        isDraggable={isEditing}
        isResizable={isEditing}
        compactType="vertical"
        preventCollision={false}
      >
        {layout.map((item) => (
          <div key={item.i} style={{ position: 'relative' }}>
            {isEditing && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  zIndex: 10,
                  display: 'flex',
                  gap: 0.5,
                }}
              >
                <IconButton
                  size="small"
                  sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'error.light' } }}
                  onClick={() => handleRemoveWidget(item.i)}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            )}
            {isEditing && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 4,
                  left: 4,
                  zIndex: 10,
                  cursor: 'move',
                }}
              >
                <DragIndicator fontSize="small" sx={{ color: 'text.secondary' }} />
              </Box>
            )}
            <Box sx={{ height: '100%', opacity: isEditing ? 0.9 : 1 }}>
              {renderWidget(item.i, { w: item.w, h: item.h })}
            </Box>
          </div>
        ))}
      </GridLayout>

      {/* Add Widget Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Dodaj widget</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 2, pt: 1 }}>
            {availableWidgets.map((widget) => (
              <Card key={widget.id} sx={{ borderRadius: '8px' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {widget.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {widget.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Odaberi veličinu:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {widget.sizes.map((size) => (
                      <Chip
                        key={size.label}
                        label={size.label}
                        size="small"
                        onClick={() => handleAddWidget(widget, size)}
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'primary.light' } }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
          {availableWidgets.length === 0 && (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Svi widgeti su već dodani na dashboard
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Zatvori</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
