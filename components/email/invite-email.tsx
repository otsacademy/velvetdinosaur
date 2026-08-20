/* eslint-disable @next/next/no-img-element -- Email HTML must use plain img tags. */
import type { CSSProperties } from 'react';

export type InviteEmailProps = {
  firstName?: string;
  email: string;
  appName: string;
  appUrl: string;
  roleName: string;
  permissions: string[];
  inviteUrl: string;
  invitedByName?: string;
  logoUrl: string;
};

function splitPermissionLabel(permission: string) {
  const index = permission.indexOf(':');
  if (index <= 0) {
    return { label: '', detail: permission.trim() };
  }
  return {
    label: permission.slice(0, index + 1).trim(),
    detail: permission.slice(index + 1).trim()
  };
}

export function InviteEmail({
  firstName = 'there',
  email,
  appName,
  appUrl,
  roleName,
  permissions,
  inviteUrl,
  invitedByName,
  logoUrl
}: InviteEmailProps) {
  const previewText = `You're invited to join ${appName} as ${roleName}`;
  const shownPermissions = permissions.slice(0, 6);
  const inviterName = invitedByName || `The ${appName} team`;

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

                    <p style={styles.h1}>You&apos;re invited to {appName}</p>
                    <p style={styles.text}>Hi {firstName},</p>
                    <p style={styles.text}>
                      We are delighted to welcome you to <strong>{appName}</strong>.
                    </p>
                    <p style={styles.text}>
                      Our mission to bridge rigorous scholarship with practical reform and challenge structural barriers
                      has never been more vital. To help us amplify this work across our global network,{' '}
                      <strong>{inviterName}</strong> has invited you to join our digital platform in the{' '}
                      <strong>{roleName}</strong> role.
                    </p>

                    {shownPermissions.length > 0 ? (
                      <>
                        <p style={styles.text}>With your new role, you&apos;ll be able to:</p>
                        <ul style={styles.list}>
                          {shownPermissions.map((permission) => {
                            const { label, detail } = splitPermissionLabel(permission);
                            return (
                              <li key={permission} style={styles.listItem}>
                                {label ? (
                                  <>
                                    <strong>{label}</strong> {detail}
                                  </>
                                ) : (
                                  permission
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </>
                    ) : null}

                    <p style={styles.text}>
                      <strong>Ready to get started?</strong>
                    </p>
                    <div style={styles.ctaRow}>
                      <a href={inviteUrl} style={styles.button}>
                        Set up your password
                      </a>
                    </div>
                    <p style={styles.small}>
                      Please verify your account and set your password by copying and pasting this link into your
                      browser:
                      <br />
                      <a href={inviteUrl} style={styles.link}>
                        {inviteUrl}
                      </a>
                    </p>
                    <p style={styles.text}>
                      Thank you for joining. We look forward to collaborating with you!
                    </p>
                    <p style={styles.signature}>
                      Best,
                      <br />
                      <strong>The {appName} team</strong>
                    </p>

                    <hr style={styles.hr} />
                    <p style={styles.italicSmall}>
                      <em>
                        This invitation was sent to <strong>{email}</strong>. If you were not expecting this, you can
                        safely ignore this email.
                      </em>
                    </p>
                    <p style={styles.footerItalic}>
                      <em>
                        (c) {new Date().getFullYear()} {appName} -{' '}
                        <a href={appUrl} style={styles.link}>
                          {appUrl}
                        </a>
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
  list: {
    marginTop: '6px',
    marginBottom: '12px',
    paddingLeft: '22px'
  },
  listItem: {
    fontSize: '14px',
    lineHeight: '22px',
    margin: '8px 0',
    color: '#111827'
  },
  ctaRow: {
    margin: '18px 0 16px',
    textAlign: 'left'
  },
  button: {
    backgroundColor: '#111827',
    color: '#ffffff',
    fontSize: '14px',
    padding: '12px 16px',
    borderRadius: '10px',
    textDecoration: 'none',
    display: 'inline-block'
  },
  small: {
    fontSize: '12px',
    lineHeight: '18px',
    color: '#4b5563',
    margin: '10px 0'
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
  signature: {
    fontSize: '14px',
    lineHeight: '22px',
    color: '#111827',
    marginTop: '8px'
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
