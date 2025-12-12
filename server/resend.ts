import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  // Production: use environment variable
  if (process.env.RESEND_API_KEY) {
    return {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@dzematapp.com'
    };
  }
  
  // Replit development: use connector
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('RESEND_API_KEY not set and Replit token not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email};
}

export async function getUncachableResendClient() {
  const credentials = await getCredentials();
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: credentials.fromEmail
  };
}

export async function sendContactEmail(data: {
  name: string;
  email: string;
  dzemat?: string;
  message: string;
}) {
  const { client, fromEmail } = await getUncachableResendClient();
  
  const result = await client.emails.send({
    from: fromEmail || 'noreply@dzematapp.com',
    to: 'info@dzematapp.com',
    replyTo: data.email,
    subject: `Upit sa DžematApp - ${data.name}`,
    html: `
      <h2>Nova poruka sa kontakt forme</h2>
      <p><strong>Ime:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Džemat:</strong> ${data.dzemat || 'Nije navedeno'}</p>
      <hr>
      <h3>Poruka:</h3>
      <p>${data.message.replace(/\n/g, '<br>')}</p>
    `,
    text: `
Nova poruka sa kontakt forme

Ime: ${data.name}
Email: ${data.email}
Džemat: ${data.dzemat || 'Nije navedeno'}

Poruka:
${data.message}
    `
  });
  
  return result;
}
