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
import settingsBS from './locales/bs/settings.json';
import requestsBS from './locales/bs/requests.json';
import livestreamBS from './locales/bs/livestream.json';
import guideBS from './locales/bs/guide.json';
import certificatesBS from './locales/bs/certificates.json';
import applicationsBS from './locales/bs/applications.json';
import membershipFeesBS from './locales/bs/membershipFees.json';
import sponsorsBS from './locales/bs/sponsors.json';
import feedBS from './locales/bs/feed.json';

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
import settingsDE from './locales/de/settings.json';
import requestsDE from './locales/de/requests.json';
import livestreamDE from './locales/de/livestream.json';
import guideDE from './locales/de/guide.json';
import certificatesDE from './locales/de/certificates.json';
import applicationsDE from './locales/de/applications.json';
import membershipFeesDE from './locales/de/membershipFees.json';
import sponsorsDE from './locales/de/sponsors.json';
import feedDE from './locales/de/feed.json';

// Import all EN translations
import commonEN from './locales/en/common.json';
import loginEN from './locales/en/login.json';
import navigationEN from './locales/en/navigation.json';
import eventsEN from './locales/en/events.json';
import announcementsEN from './locales/en/announcements.json';
import usersEN from './locales/en/users.json';
import tasksEN from './locales/en/tasks.json';
import messagesEN from './locales/en/messages.json';
import shopEN from './locales/en/shop.json';
import vaktijaEN from './locales/en/vaktija.json';
import financesEN from './locales/en/finances.json';
import askImamEN from './locales/en/askImam.json';
import dashboardEN from './locales/en/dashboard.json';
import projectsEN from './locales/en/projects.json';
import badgesEN from './locales/en/badges.json';
import documentsEN from './locales/en/documents.json';
import activityEN from './locales/en/activity.json';
import quickTipsEN from './locales/en/quickTips.json';
import settingsEN from './locales/en/settings.json';
import requestsEN from './locales/en/requests.json';
import livestreamEN from './locales/en/livestream.json';
import guideEN from './locales/en/guide.json';
import certificatesEN from './locales/en/certificates.json';
import applicationsEN from './locales/en/applications.json';
import membershipFeesEN from './locales/en/membershipFees.json';
import sponsorsEN from './locales/en/sponsors.json';
import feedEN from './locales/en/feed.json';

// Import all SQ (Albanian) translations
import commonSQ from './locales/sq/common.json';
import loginSQ from './locales/sq/login.json';
import navigationSQ from './locales/sq/navigation.json';
import eventsSQ from './locales/sq/events.json';
import announcementsSQ from './locales/sq/announcements.json';
import usersSQ from './locales/sq/users.json';
import tasksSQ from './locales/sq/tasks.json';
import messagesSQ from './locales/sq/messages.json';
import shopSQ from './locales/sq/shop.json';
import vaktijaSQ from './locales/sq/vaktija.json';
import financesSQ from './locales/sq/finances.json';
import askImamSQ from './locales/sq/askImam.json';
import dashboardSQ from './locales/sq/dashboard.json';
import projectsSQ from './locales/sq/projects.json';
import badgesSQ from './locales/sq/badges.json';
import documentsSQ from './locales/sq/documents.json';
import activitySQ from './locales/sq/activity.json';
import quickTipsSQ from './locales/sq/quickTips.json';
import settingsSQ from './locales/sq/settings.json';
import requestsSQ from './locales/sq/requests.json';
import livestreamSQ from './locales/sq/livestream.json';
import guideSQ from './locales/sq/guide.json';
import certificatesSQ from './locales/sq/certificates.json';
import applicationsSQ from './locales/sq/applications.json';
import membershipFeesSQ from './locales/sq/membershipFees.json';
import sponsorsSQ from './locales/sq/sponsors.json';
import feedSQ from './locales/sq/feed.json';

// Import all TR (Turkish) translations
import commonTR from './locales/tr/common.json';
import loginTR from './locales/tr/login.json';
import navigationTR from './locales/tr/navigation.json';
import eventsTR from './locales/tr/events.json';
import announcementsTR from './locales/tr/announcements.json';
import usersTR from './locales/tr/users.json';
import tasksTR from './locales/tr/tasks.json';
import messagesTR from './locales/tr/messages.json';
import shopTR from './locales/tr/shop.json';
import vaktijaTR from './locales/tr/vaktija.json';
import financesTR from './locales/tr/finances.json';
import askImamTR from './locales/tr/askImam.json';
import dashboardTR from './locales/tr/dashboard.json';
import projectsTR from './locales/tr/projects.json';
import badgesTR from './locales/tr/badges.json';
import documentsTR from './locales/tr/documents.json';
import activityTR from './locales/tr/activity.json';
import quickTipsTR from './locales/tr/quickTips.json';
import settingsTR from './locales/tr/settings.json';
import requestsTR from './locales/tr/requests.json';
import livestreamTR from './locales/tr/livestream.json';
import guideTR from './locales/tr/guide.json';
import certificatesTR from './locales/tr/certificates.json';
import applicationsTR from './locales/tr/applications.json';
import membershipFeesTR from './locales/tr/membershipFees.json';
import sponsorsTR from './locales/tr/sponsors.json';
import feedTR from './locales/tr/feed.json';

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
    settings: settingsBS,
    requests: requestsBS,
    livestream: livestreamBS,
    guide: guideBS,
    certificates: certificatesBS,
    applications: applicationsBS,
    membershipFees: membershipFeesBS,
    sponsors: sponsorsBS,
    feed: feedBS,
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
    settings: settingsDE,
    requests: requestsDE,
    livestream: livestreamDE,
    guide: guideDE,
    certificates: certificatesDE,
    applications: applicationsDE,
    membershipFees: membershipFeesDE,
    sponsors: sponsorsDE,
    feed: feedDE,
  },
  en: {
    common: commonEN,
    login: loginEN,
    navigation: navigationEN,
    events: eventsEN,
    announcements: announcementsEN,
    users: usersEN,
    tasks: tasksEN,
    messages: messagesEN,
    shop: shopEN,
    vaktija: vaktijaEN,
    finances: financesEN,
    askImam: askImamEN,
    dashboard: dashboardEN,
    projects: projectsEN,
    badges: badgesEN,
    documents: documentsEN,
    activity: activityEN,
    quickTips: quickTipsEN,
    settings: settingsEN,
    requests: requestsEN,
    livestream: livestreamEN,
    guide: guideEN,
    certificates: certificatesEN,
    applications: applicationsEN,
    membershipFees: membershipFeesEN,
    sponsors: sponsorsEN,
    feed: feedEN,
  },
  sq: {
    common: commonSQ,
    login: loginSQ,
    navigation: navigationSQ,
    events: eventsSQ,
    announcements: announcementsSQ,
    users: usersSQ,
    tasks: tasksSQ,
    messages: messagesSQ,
    shop: shopSQ,
    vaktija: vaktijaSQ,
    finances: financesSQ,
    askImam: askImamSQ,
    dashboard: dashboardSQ,
    projects: projectsSQ,
    badges: badgesSQ,
    documents: documentsSQ,
    activity: activitySQ,
    quickTips: quickTipsSQ,
    settings: settingsSQ,
    requests: requestsSQ,
    livestream: livestreamSQ,
    guide: guideSQ,
    certificates: certificatesSQ,
    applications: applicationsSQ,
    membershipFees: membershipFeesSQ,
    sponsors: sponsorsSQ,
    feed: feedSQ,
  },
  tr: {
    common: commonTR,
    login: loginTR,
    navigation: navigationTR,
    events: eventsTR,
    announcements: announcementsTR,
    users: usersTR,
    tasks: tasksTR,
    messages: messagesTR,
    shop: shopTR,
    vaktija: vaktijaTR,
    finances: financesTR,
    askImam: askImamTR,
    dashboard: dashboardTR,
    projects: projectsTR,
    badges: badgesTR,
    documents: documentsTR,
    activity: activityTR,
    quickTips: quickTipsTR,
    settings: settingsTR,
    requests: requestsTR,
    livestream: livestreamTR,
    guide: guideTR,
    certificates: certificatesTR,
    applications: applicationsTR,
    membershipFees: membershipFeesTR,
    sponsors: sponsorsTR,
    feed: feedTR,
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
