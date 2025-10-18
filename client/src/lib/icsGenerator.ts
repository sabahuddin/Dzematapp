import { Event } from '@shared/schema';

export interface ICSEvent {
  name: string;
  description?: string;
  location: string;
  dateTime: Date;
  reminderTime?: string | null;
}

function formatICSDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

function getAlarmMinutes(reminderTime?: string | null): number | null {
  if (!reminderTime) return null;
  
  switch (reminderTime) {
    case '7_days':
      return 10080; // 7 days * 24 hours * 60 minutes
    case '24_hours':
      return 1440; // 24 hours * 60 minutes
    case '2_hours':
      return 120; // 2 hours * 60 minutes
    default:
      return null;
  }
}

export function generateICS(event: ICSEvent): string {
  const startDate = new Date(event.dateTime);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
  const now = new Date();
  
  const alarmMinutes = getAlarmMinutes(event.reminderTime);
  
  const description = event.description 
    ? event.description.replace(/<[^>]*>/g, '').replace(/\n/g, '\\n')
    : '';
  
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//JamatHub//Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@jamathub.com`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${event.name}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${event.location}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0'
  ];
  
  if (alarmMinutes) {
    icsContent.push(
      'BEGIN:VALARM',
      'TRIGGER:-PT' + alarmMinutes + 'M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Podsetnik: ${event.name}`,
      'END:VALARM'
    );
  }
  
  icsContent.push(
    'END:VEVENT',
    'END:VCALENDAR'
  );
  
  return icsContent.join('\r\n');
}

export function downloadICS(event: ICSEvent): void {
  const icsContent = generateICS(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
