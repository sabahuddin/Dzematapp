import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all BS translations
import commonBS from './locales/bs/common.json';
import loginBS from './locales/bs/login.json';
import navigationBS from './locales/bs/navigation.json';
import eventsBS from './locales/bs/events.json';
import announcementsBS from './locales/bs/announcements.json';
import usersBS from './locales/bs/users.json';
import tasksBS from './locales/bs/tasks.json';
import messagesBS from './locales/bs/messages.json';
import shopBS from './locales/bs/shop.json';
import vaktijaBS from './locales/bs/vaktija.json';
import financesBS from './locales/bs/finances.json';
import askImamBS from './locales/bs/askImam.json';
import dashboardBS from './locales/bs/dashboard.json';
import projectsBS from './locales/bs/projects.json';
import badgesBS from './locales/bs/badges.json';
import documentsBS from './locales/bs/documents.json';
import activityBS from './locales/bs/activity.json';
import quickTipsBS from './locales/bs/quickTips.json';

// Import all DE translations
import commonDE from './locales/de/common.json';
import loginDE from './locales/de/login.json';
import navigationDE from './locales/de/navigation.json';
import eventsDE from './locales/de/events.json';
import announcementsDE from './locales/de/announcements.json';
import usersDE from './locales/de/users.json';
import tasksDE from './locales/de/tasks.json';
import messagesDE from './locales/de/messages.json';
import shopDE from './locales/de/shop.json';
import vaktijaDE from './locales/de/vaktija.json';
import financesDE from './locales/de/finances.json';
import askImamDE from './locales/de/askImam.json';
import dashboardDE from './locales/de/dashboard.json';
import projectsDE from './locales/de/projects.json';
import badgesDE from './locales/de/badges.json';
import documentsDE from './locales/de/documents.json';
import activityDE from './locales/de/activity.json';
import quickTipsDE from './locales/de/quickTips.json';

const resources = {
  bs: {
    common: commonBS,
    login: loginBS,
    navigation: navigationBS,
    events: eventsBS,
    announcements: announcementsBS,
    users: usersBS,
    tasks: tasksBS,
    messages: messagesBS,
    shop: shopBS,
    vaktija: vaktijaBS,
    finances: financesBS,
    askImam: askImamBS,
    dashboard: dashboardBS,
    projects: projectsBS,
    badges: badgesBS,
    documents: documentsBS,
    activity: activityBS,
    quickTips: quickTipsBS,
  },
  de: {
    common: commonDE,
    login: loginDE,
    navigation: navigationDE,
    events: eventsDE,
    announcements: announcementsDE,
    users: usersDE,
    tasks: tasksDE,
    messages: messagesDE,
    shop: shopDE,
    vaktija: vaktijaDE,
    finances: financesDE,
    askImam: askImamDE,
    dashboard: dashboardDE,
    projects: projectsDE,
    badges: badgesDE,
    documents: documentsDE,
    activity: activityDE,
    quickTips: quickTipsDE,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'bs', // Default to Bosnian
    fallbackLng: 'bs',
    defaultNS: 'common',
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language',
    },
  });

export default i18n;
