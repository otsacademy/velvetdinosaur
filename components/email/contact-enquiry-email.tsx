/* eslint-disable @next/next/no-img-element -- Email HTML must use plain img tags. */
import type { CSSProperties } from 'react';

type ContactEnquiryEmailProps = {
  name?: string | null;
  email: string;
  topic?: string | null;
  message: string;
  sentAt: string;
  appName: string;
  appUrl: string;
  logoUrl: string;
};

function normalizeValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || '-';
}

export function ContactEnquiryEmail({
  name,
  email,
  topic,
  message,
  sentAt,
  appName,
  appUrl,
  logoUrl
}: ContactEnquiryEmailProps) {
  const previewText = `New contact enquiry via ${appName}`;
  const hasAppUrl = appUrl.trim().length > 0;
  const displayName = normalizeValue(name);
  const displayTopic = normalizeValue(topic);
  const displayMessage = normalizeValue(message);
  const displaySentAt = normalizeValue(sentAt);

  return (
    <html>
      <body style={styles.body}>
        <div style={styles.preview}>{previewText}</div>
        <table width="100%" cellPadding={0} cellSpacing={0} style={styles.wrapper}>
          <tr>
            <td align="center">
              <table width="560" cellPadding={0} cellSpacing={0} style={styles.containerTable}>
                <tr>
                  <td style={styles.container}>
                    <div style={styles.header}>
                      <a href={appUrl} style={styles.link}>
                        <img src={logoUrl} width="90" alt={`${appName} logo`} style={styles.logo} />
                      </a>
                    </div>
                    <p style={styles.h1}>New contact enquiry</p>
                    <p style={styles.text}>
                      You have received a new contact enquiry from the{' '}
                      <strong>{appName}</strong> website.
                    </p>
                    <p style={styles.text}>
                      <strong>Name:</strong> {displayName}
                    </p>
                    <p style={styles.text}>
                      <strong>Email:</strong> {email}
                    </p>
                    <p style={styles.text}>
                      <strong>Topic:</strong> {displayTopic}
                    </p>
                    <p style={styles.text}>
                      <strong>Message:</strong>
                      <br />
                      <span style={styles.preWrap}>{displayMessage}</span>
                    </p>
                    <p style={styles.text}>
                      <strong>Received:</strong> {displaySentAt}
                    </p>
                    <hr style={styles.hr} />
                    <p style={styles.italicSmall}>
                      <em>Reply directly to this email to respond to the sender.</em>
                    </p>
                    <p style={styles.footerItalic}>
                      <em>
                        (c) {new Date().getFullYear()} {appName}
                        {hasAppUrl ? (
                          <>
                            {' '}
                            -{' '}
                            <a href={appUrl} style={styles.link}>
                              {appUrl}
                            </a>
                          </>
                        ) : null}
                      </em>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}

const styles: Record<string, CSSProperties> = {
  body: {
    margin: 0,
    backgroundColor: '#f6f7fb',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    padding: '24px 0'
  },
  preview: {
    display: 'none',
    fontSize: '1px',
    color: '#f6f7fb',
    lineHeight: '1px',
    maxHeight: '0px',
    maxWidth: '0px',
    opacity: 0,
    overflow: 'hidden'
  },
  wrapper: {
    backgroundColor: '#f6f7fb',
    padding: '0 12px'
  },
  containerTable: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  container: {
    padding: '28px'
  },
  header: {
    textAlign: 'left',
    marginBottom: '12px'
  },
  logo: {
    display: 'block'
  },
  h1: {
    fontSize: '22px',
    lineHeight: '28px',
    fontWeight: 700,
    margin: '16px 0 8px',
    color: '#111827'
  },
  text: {
    fontSize: '14px',
    lineHeight: '22px',
    color: '#111827',
    margin: '10px 0'
  },
  preWrap: {
    whiteSpace: 'pre-wrap',
    lineHeight: '22px'
  },
  link: {
    color: '#111827',
    textDecoration: 'underline',
    wordBreak: 'break-word'
  },
  hr: {
    borderColor: '#e5e7eb',
    margin: '18px 0'
  },
  italicSmall: {
    fontSize: '12px',
    lineHeight: '18px',
    color: '#4b5563',
    margin: '10px 0'
  },
  footerItalic: {
    fontSize: '12px',
    lineHeight: '18px',
    color: '#6b7280',
    marginTop: '12px'
  }
};
