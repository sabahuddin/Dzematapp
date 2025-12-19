import i18n from '@/i18n';

export const CRITERIA_TYPE_LABELS: Record<string, Record<string, string>> = {
  bs: {
    points: 'Ukupni bodovi',
    points_total: 'Ukupni bodovi',
    tasks_completed: 'Završeni zadaci',
    contributions_amount: 'Iznos donacija',
    donation_total: 'Iznos donacija',
    events_attended: 'Prisustvo događajima',
  },
  en: {
    points: 'Total points',
    points_total: 'Total points',
    tasks_completed: 'Completed tasks',
    contributions_amount: 'Donation amount',
    donation_total: 'Donation amount',
    events_attended: 'Events attended',
  },
  de: {
    points: 'Gesamtpunkte',
    points_total: 'Gesamtpunkte',
    tasks_completed: 'Erledigte Aufgaben',
    contributions_amount: 'Spendenbetrag',
    donation_total: 'Spendenbetrag',
    events_attended: 'Besuchte Veranstaltungen',
  },
  tr: {
    points: 'Toplam puan',
    points_total: 'Toplam puan',
    tasks_completed: 'Tamamlanan görevler',
    contributions_amount: 'Bağış miktarı',
    donation_total: 'Bağış miktarı',
    events_attended: 'Katılınan etkinlikler',
  },
  sq: {
    points: 'Pikë totale',
    points_total: 'Pikë totale',
    tasks_completed: 'Detyrat e përfunduara',
    contributions_amount: 'Shuma e donacioneve',
    donation_total: 'Shuma e donacioneve',
    events_attended: 'Ngjarjet e ndjekura',
  },
};

export const getCriteriaTypeLabel = (criteriaType: string): string => {
  const rawLng = i18n.language || 'bs';
  const lng = rawLng.split('-')[0];
  const labels = CRITERIA_TYPE_LABELS[lng] || CRITERIA_TYPE_LABELS.bs;
  return labels[criteriaType?.trim()] || criteriaType;
};

export const getBadgeColor = (criteriaType: string): { bg: string; text: string } => {
  switch (criteriaType) {
    case 'points':
    case 'points_total':
      return { bg: '#E3F2FD', text: '#1565C0' };
    case 'tasks_completed':
      return { bg: '#E8F5E9', text: '#2E7D32' };
    case 'contributions_amount':
    case 'donation_total':
      return { bg: '#FFF3E0', text: '#E65100' };
    case 'events_attended':
      return { bg: '#F3E5F5', text: '#7B1FA2' };
    default:
      return { bg: '#ECEFF1', text: '#546E7A' };
  }
};
