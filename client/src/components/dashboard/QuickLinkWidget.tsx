import { Box, Typography, Card, CardContent } from '@mui/material';
import { useLocation } from 'wouter';
import { FileText, Settings, HelpCircle, MessageCircleQuestion } from 'lucide-react';

const cardStyle = { borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', height: '100%' };

interface QuickLinkWidgetProps {
  type: 'documents' | 'settings' | 'guide' | 'imam-qa';
}

const widgetConfig = {
  documents: {
    icon: FileText,
    title: 'Dokumenti',
    description: 'Pregled dokumenata',
    path: '/documents',
    color: '#3949AB',
  },
  settings: {
    icon: Settings,
    title: 'Podešavanja',
    description: 'Postavke sistema',
    path: '/settings',
    color: '#546E7A',
  },
  guide: {
    icon: HelpCircle,
    title: 'Vodič',
    description: 'Pomoć i upute',
    path: '/guide',
    color: '#26A69A',
  },
  'imam-qa': {
    icon: MessageCircleQuestion,
    title: 'Pitaj imama',
    description: 'Postavi pitanje',
    path: '/imam-questions',
    color: '#1E88E5',
  },
};

export default function QuickLinkWidget({ type }: QuickLinkWidgetProps) {
  const [, setLocation] = useLocation();
  const config = widgetConfig[type];
  const Icon = config.icon;

  return (
    <Card 
      sx={{ ...cardStyle, cursor: 'pointer', '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' } }} 
      onClick={() => setLocation(config.path)}
    >
      <CardContent sx={{ 
        p: 2, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <Box sx={{ 
          bgcolor: `${config.color}20`, 
          p: 1.5, 
          borderRadius: '12px', 
          mb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={28} color={config.color} />
        </Box>
        <Typography variant="body2" fontWeight={600}>{config.title}</Typography>
      </CardContent>
    </Card>
  );
}

// Export individual widgets for the registry
export function DocumentsWidget() {
  return <QuickLinkWidget type="documents" />;
}

export function SettingsWidget() {
  return <QuickLinkWidget type="settings" />;
}

export function GuideWidget() {
  return <QuickLinkWidget type="guide" />;
}

export function ImamQAWidget() {
  return <QuickLinkWidget type="imam-qa" />;
}
