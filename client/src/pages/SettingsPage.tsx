import { useState } from 'react';
import { Box, Container, Tabs, Tab } from '@mui/material';
import { Settings as SettingsIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ContactInfoTab from '../components/ContactInfoTab';
import OrganizationSettingsPage from './OrganizationSettingsPage';

export default function SettingsPage() {
  const { t } = useTranslation('navigation');
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <SettingsIcon size={32} />
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 600 }}>{t('settings')}</h1>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': {
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 500,
            minHeight: 48,
          },
          '& .Mui-selected': {
            color: '#3949AB',
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#5C6BC0',
          }
        }}
      >
        <Tab label={t('settings.contactInfo')} data-testid="tab-contact-info" />
        <Tab label={t('settings.organizationalData')} data-testid="tab-org-settings" />
      </Tabs>

      {activeTab === 0 && <ContactInfoTab />}
      {activeTab === 1 && <OrganizationSettingsPage hideHeader={true} />}
    </Container>
  );
}
