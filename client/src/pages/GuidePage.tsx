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
      color: 'hsl(207 88% 55%)',
    },
    {
      icon: <People sx={{ fontSize: 28 }} />,
      key: 'users',
      color: 'hsl(122 60% 29%)',
    },
    {
      icon: <Campaign sx={{ fontSize: 28 }} />,
      key: 'announcements',
      color: 'hsl(14 100% 45%)',
    },
    {
      icon: <Event sx={{ fontSize: 28 }} />,
      key: 'events',
      color: 'hsl(291 64% 32%)',
    },
    {
      icon: <Workspaces sx={{ fontSize: 28 }} />,
      key: 'workgroups',
      color: 'var(--semantic-info-text)',
    },
    {
      icon: <Mail sx={{ fontSize: 28 }} />,
      key: 'messages',
      color: 'hsl(291 64% 32%)',
    },
    {
      icon: <QuestionAnswer sx={{ fontSize: 28 }} />,
      key: 'askImam',
      color: 'hsl(14 100% 45%)',
    },
    {
      icon: <Assignment sx={{ fontSize: 28 }} />,
      key: 'requests',
      color: 'hsl(291 64% 32%)',
    },
    {
      icon: <ShoppingBag sx={{ fontSize: 28 }} />,
      key: 'shop',
      color: 'hsl(4 90% 58%)',
    },
    {
      icon: <Schedule sx={{ fontSize: 28 }} />,
      key: 'vaktija',
      color: 'hsl(122 60% 29%)',
    },
    {
      icon: <AccountBalance sx={{ fontSize: 28 }} />,
      key: 'finances',
      color: 'hsl(122 60% 29%)',
    },
    {
      icon: <FolderOpen sx={{ fontSize: 28 }} />,
      key: 'projects',
      color: 'hsl(291 64% 32%)',
    },
    {
      icon: <Timeline sx={{ fontSize: 28 }} />,
      key: 'activity',
      color: 'var(--semantic-neutral-text)',
    },
    {
      icon: <WorkspacePremium sx={{ fontSize: 28 }} />,
      key: 'badges',
      color: 'hsl(14 100% 45%)',
    },
    {
      icon: <EmojiEvents sx={{ fontSize: 28 }} />,
      key: 'points',
      color: 'hsl(14 100% 45%)',
    },
    {
      icon: <CardGiftcard sx={{ fontSize: 28 }} />,
      key: 'certificates',
      color: 'hsl(291 64% 32%)',
    },
    {
      icon: <Description sx={{ fontSize: 28 }} />,
      key: 'documents',
      color: 'var(--semantic-info-text)',
    },
    {
      icon: <OndemandVideo sx={{ fontSize: 28 }} />,
      key: 'media',
      color: 'hsl(14 100% 45%)',
    },
    {
      icon: <Settings sx={{ fontSize: 28 }} />,
      key: 'settings',
      color: 'var(--semantic-neutral-text)',
    },
  ];

  const roles = [
    {
      key: 'admin',
      color: 'hsl(4 90% 58%)',
    },
    {
      key: 'memberIO',
      color: 'hsl(14 100% 45%)',
    },
    {
      key: 'member',
      color: 'hsl(122 60% 29%)',
    },
    {
      key: 'familyMember',
      color: 'hsl(207 88% 55%)',
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
              margin: 1.5cm;
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
            /* Sakrij sidebar i koristi punu širinu za PDF */
            nav, aside, .sidebar, [role="navigation"] {
              display: none !important;
            }
            main {
              margin-left: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
            }
            .MuiContainer-root {
              max-width: 100% !important;
              padding-left: 0 !important;
              padding-right: 0 !important;
              margin: 0 !important;
            }
            /* Puna širina za sadržaj */
            body {
              margin: 0;
              padding: 0;
            }
            p, .MuiTypography-root {
              word-wrap: break-word;
              overflow-wrap: break-word;
              hyphens: auto;
            }
          }
        `}
      </style>

      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
          <Info sx={{ fontSize: 48, color: 'hsl(207 88% 55%)' }} />
          <Typography variant="h3" sx={{ fontWeight: 700, color: 'hsl(231 48% 22%)' }}>
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
            bgcolor: 'hsl(207 88% 55%)',
            '&:hover': { bgcolor: 'var(--semantic-info-text)' }
          }}
          data-testid="button-download-pdf"
        >
          {t('guide:pageHeader.downloadPdf')}
        </Button>
      </Box>

      {/* Introduction */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: 'hsl(231 48% 22%)' }}>
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
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: 'hsl(231 48% 22%)' }}>
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

      {/* Table of Contents - Meni */}
      <Box sx={{ mb: 5 }} className="page-break">
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'hsl(231 48% 22%)' }}>
          {t('guide:tableOfContents.title')}
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Box sx={{ display: 'grid', gap: 2 }}>
          {sections.map((section, index) => {
            const shortDesc = t(`guide:sections.${section.key}.shortDesc`, { defaultValue: '' });
            
            return (
              <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box
                  sx={{
                    bgcolor: section.color,
                    borderRadius: 1.5,
                    p: 1.2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    minWidth: 44,
                    minHeight: 44,
                    flexShrink: 0,
                  }}
                >
                  {section.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.3 }}>
                    {t(`guide:sections.${section.key}.title`)}
                  </Typography>
                  {shortDesc && (
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {shortDesc}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Sections - Full Width */}
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 4, color: 'hsl(231 48% 22%)' }} className="page-break">
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
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'hsl(231 48% 22%)' }}>
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
                      bgcolor: 'hsl(4 90% 58%)',
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
                      bgcolor: 'hsl(14 100% 45%)',
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
                      bgcolor: 'hsl(122 60% 29%)',
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
                      bgcolor: 'hsl(207 88% 55%)',
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
      <Box sx={{ mt: 6, p: 3, bgcolor: 'hsl(0 0% 96%)', borderRadius: 2 }} className="page-break">
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
