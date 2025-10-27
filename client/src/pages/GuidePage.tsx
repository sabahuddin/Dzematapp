import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Divider,
  Grid,
} from '@mui/material';
import {
  Dashboard,
  People,
  Campaign,
  Event,
  Workspaces,
  Mail,
  QuestionAnswer,
  Assignment,
  ShoppingBag,
  Schedule,
  Settings,
  Info,
  PictureAsPdf,
  AccountBalance,
  EmojiEvents,
  WorkspacePremium,
  FolderOpen,
  Timeline,
  CardGiftcard,
  Description,
  OndemandVideo,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const handlePrintPDF = () => {
  window.print();
};

export default function GuidePage() {
  const { user } = useAuth();
  const { t } = useTranslation(['guide']);

  const sections = [
    {
      icon: <Dashboard sx={{ fontSize: 28 }} />,
      key: 'dashboard',
      color: '#1976d2',
    },
    {
      icon: <People sx={{ fontSize: 28 }} />,
      key: 'users',
      color: '#2e7d32',
    },
    {
      icon: <Campaign sx={{ fontSize: 28 }} />,
      key: 'announcements',
      color: '#ed6c02',
    },
    {
      icon: <Event sx={{ fontSize: 28 }} />,
      key: 'events',
      color: '#9c27b0',
    },
    {
      icon: <Workspaces sx={{ fontSize: 28 }} />,
      key: 'workgroups',
      color: '#0097a7',
    },
    {
      icon: <Mail sx={{ fontSize: 28 }} />,
      key: 'messages',
      color: '#c2185b',
    },
    {
      icon: <QuestionAnswer sx={{ fontSize: 28 }} />,
      key: 'askImam',
      color: '#f57c00',
    },
    {
      icon: <Assignment sx={{ fontSize: 28 }} />,
      key: 'requests',
      color: '#5e35b1',
    },
    {
      icon: <ShoppingBag sx={{ fontSize: 28 }} />,
      key: 'shop',
      color: '#c62828',
    },
    {
      icon: <Schedule sx={{ fontSize: 28 }} />,
      key: 'vaktija',
      color: '#00796b',
    },
    {
      icon: <AccountBalance sx={{ fontSize: 28 }} />,
      key: 'finances',
      color: '#558b2f',
    },
    {
      icon: <FolderOpen sx={{ fontSize: 28 }} />,
      key: 'projects',
      color: '#6a1b9a',
    },
    {
      icon: <Timeline sx={{ fontSize: 28 }} />,
      key: 'activity',
      color: '#455a64',
    },
    {
      icon: <WorkspacePremium sx={{ fontSize: 28 }} />,
      key: 'badges',
      color: '#f9a825',
    },
    {
      icon: <EmojiEvents sx={{ fontSize: 28 }} />,
      key: 'points',
      color: '#d84315',
    },
    {
      icon: <CardGiftcard sx={{ fontSize: 28 }} />,
      key: 'certificates',
      color: '#e91e63',
    },
    {
      icon: <Description sx={{ fontSize: 28 }} />,
      key: 'documents',
      color: '#3f51b5',
    },
    {
      icon: <OndemandVideo sx={{ fontSize: 28 }} />,
      key: 'media',
      color: '#ff5722',
    },
    {
      icon: <Settings sx={{ fontSize: 28 }} />,
      key: 'settings',
      color: '#616161',
    },
  ];

  const roles = [
    {
      key: 'admin',
      color: '#d32f2f',
    },
    {
      key: 'memberIO',
      color: '#f57c00',
    },
    {
      key: 'member',
      color: '#388e3c',
    },
    {
      key: 'familyMember',
      color: '#1976d2',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <style>
        {`
          @media print {
            body { 
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @page {
              size: A4;
              margin: 2cm;
            }
            .no-print {
              display: none !important;
            }
            .page-break {
              page-break-before: always;
            }
            .section-block {
              page-break-inside: avoid;
            }
          }
        `}
      </style>

      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
          <Info sx={{ fontSize: 48, color: '#1976d2' }} />
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#1a237e' }}>
            {t('guide:pageHeader.title')}
          </Typography>
        </Box>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {t('guide:pageHeader.subtitle')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<PictureAsPdf />}
          onClick={handlePrintPDF}
          className="no-print"
          sx={{ 
            textTransform: 'none',
            bgcolor: '#1976d2',
            '&:hover': { bgcolor: '#1565c0' }
          }}
          data-testid="button-download-pdf"
        >
          {t('guide:pageHeader.downloadPdf')}
        </Button>
      </Box>

      {/* Introduction */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#1a237e' }}>
          {t('guide:introduction.title')}
        </Typography>
        <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 2 }}>
          {t('guide:introduction.paragraph1')}
        </Typography>
        <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
          {t('guide:introduction.paragraph2')}
        </Typography>
      </Box>

      {/* Roles */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#1a237e' }}>
          {t('guide:rolesSection.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('guide:rolesSection.description')}
        </Typography>
        {roles.map((role, index) => (
          <Box key={role.key} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box
                sx={{
                  bgcolor: role.color,
                  color: 'white',
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                  fontWeight: 600,
                  minWidth: 180,
                }}
              >
                {t(`guide:rolesSection.roles.${role.key}.name`)}
              </Box>
            </Box>
            <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 0.5 }}>
              {t(`guide:rolesSection.roles.${role.key}.description`)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              <strong>{t('guide:rolesSection.accessLabel')}:</strong> {t(`guide:rolesSection.roles.${role.key}.permissions`)}
            </Typography>
            {index < roles.length - 1 && <Divider sx={{ mt: 2 }} />}
          </Box>
        ))}
      </Box>

      {/* Table of Contents */}
      <Box sx={{ mb: 5 }} className="page-break">
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: '#1a237e' }}>
          {t('guide:tableOfContents.title')}
        </Typography>
        <Grid container spacing={2}>
          {sections.map((section, index) => (
            <Grid key={index} sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    bgcolor: section.color,
                    borderRadius: 1.5,
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    minWidth: 40,
                    minHeight: 40,
                  }}
                >
                  {section.icon}
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {t(`guide:sections.${section.key}.title`)}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Sections - Full Width */}
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 4, color: '#1a237e' }} className="page-break">
        {t('guide:detailedExplanation')}
      </Typography>

      {sections.map((section, index) => {
        const features = t(`guide:sections.${section.key}.features`, { returnObjects: true }) as string[];
        const hasAdmin = t(`guide:sections.${section.key}.admin`, { defaultValue: '' });
        const hasModerator = t(`guide:sections.${section.key}.moderator`, { defaultValue: '' });
        const hasMember = t(`guide:sections.${section.key}.member`, { defaultValue: '' });
        const hasAll = t(`guide:sections.${section.key}.all`, { defaultValue: '' });

        return (
          <Box key={index} className="section-block" sx={{ mb: 5 }}>
            {/* Section Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  bgcolor: section.color,
                  borderRadius: 2,
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                {section.icon}
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a237e' }}>
                {t(`guide:sections.${section.key}.title`)}
              </Typography>
            </Box>

            {/* Description */}
            <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 2 }}>
              {t(`guide:sections.${section.key}.description`)}
            </Typography>

            {/* Features */}
            {features && Array.isArray(features) && features.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                  {t('guide:keyFeatures')}
                </Typography>
                {features.map((feature, idx) => (
                  <Typography key={idx} variant="body2" sx={{ mb: 0.8, lineHeight: 1.7, pl: 2 }}>
                    • {feature}
                  </Typography>
                ))}
              </Box>
            )}

            <Divider sx={{ my: 2.5 }} />

            {/* Roles */}
            <Box sx={{ display: 'grid', gap: 2.5 }}>
              {hasAdmin && (
                <Box>
                  <Box
                    sx={{
                      bgcolor: '#d32f2f',
                      color: 'white',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontWeight: 600,
                      display: 'inline-block',
                      mb: 1,
                    }}
                  >
                    {t('guide:roleLabels.admins')}
                  </Box>
                  <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                    {hasAdmin}
                  </Typography>
                </Box>
              )}
              {hasModerator && (
                <Box>
                  <Box
                    sx={{
                      bgcolor: '#f57c00',
                      color: 'white',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontWeight: 600,
                      display: 'inline-block',
                      mb: 1,
                    }}
                  >
                    {t('guide:roleLabels.moderators')}
                  </Box>
                  <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                    {hasModerator}
                  </Typography>
                </Box>
              )}
              {hasMember && (
                <Box>
                  <Box
                    sx={{
                      bgcolor: '#388e3c',
                      color: 'white',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontWeight: 600,
                      display: 'inline-block',
                      mb: 1,
                    }}
                  >
                    {t('guide:roleLabels.members')}
                  </Box>
                  <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                    {hasMember}
                  </Typography>
                </Box>
              )}
              {hasAll && (
                <Box>
                  <Box
                    sx={{
                      bgcolor: '#1976d2',
                      color: 'white',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontWeight: 600,
                      display: 'inline-block',
                      mb: 1,
                    }}
                  >
                    {t('guide:roleLabels.allUsers')}
                  </Box>
                  <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                    {hasAll}
                  </Typography>
                </Box>
              )}
            </Box>

            {index < sections.length - 1 && <Divider sx={{ mt: 4 }} />}
          </Box>
        );
      })}

      {/* Footer Info */}
      <Box sx={{ mt: 6, p: 3, bgcolor: '#f5f5f5', borderRadius: 2 }} className="page-break">
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          {t('guide:additionalInfo.title')}
        </Typography>
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            <strong>• {t('guide:additionalInfo.notificationsLabel')}</strong> {t('guide:additionalInfo.notifications')}
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            <strong>• {t('guide:additionalInfo.autoRefreshLabel')}</strong> {t('guide:additionalInfo.autoRefresh')}
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            <strong>• {t('guide:additionalInfo.dateFormatLabel')}</strong> {t('guide:additionalInfo.dateFormat')}
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            <strong>• {t('guide:additionalInfo.currencyLabel')}</strong> {t('guide:additionalInfo.currency')}
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            <strong>• {t('guide:additionalInfo.guestAccessLabel')}</strong> {t('guide:additionalInfo.guestAccess')}
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            <strong>• {t('guide:additionalInfo.securityLabel')}</strong> {t('guide:additionalInfo.security')}
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            <strong>• {t('guide:additionalInfo.supportLabel')}</strong> {t('guide:additionalInfo.support')}
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
