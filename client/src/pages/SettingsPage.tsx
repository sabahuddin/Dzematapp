import { useState } from 'react';
import { Box, Container, Tabs, Tab } from '@mui/material';
import { Settings as SettingsIcon } from 'lucide-react';
import ContactInfoTab from '../components/ContactInfoTab';
import OrganizationSettingsPage from './OrganizationSettingsPage';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <SettingsIcon size={32} />
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 600 }}>Podešavanja</h1>
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
        <Tab label="Kontakt informacije" data-testid="tab-contact-info" />
        <Tab label="Organizacijski podaci" data-testid="tab-org-settings" />
      </Tabs>

      {activeTab === 0 && <ContactInfoTab />}
      {activeTab === 1 && <OrganizationSettingsPage hideHeader={true} />}
    </Container>
  );
}
