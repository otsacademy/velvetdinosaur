import type { ReactNode } from 'react';

type ContactEnquiryEmailProps = {
  name?: string | null;
  email: string;
  topic?: string | null;
  message: string;
  sentAt: string;
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <tr>
      <td style={{ padding: '10px 0', borderBottom: '1px solid #e6e6e6' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: '#6b7280', textTransform: 'uppercase' }}>
          {label}
        </div>
        <div style={{ marginTop: '6px', fontSize: '15px', color: '#111827' }}>{children}</div>
      </td>
    </tr>
  );
}

export function ContactEnquiryEmail({ name, email, topic, message, sentAt }: ContactEnquiryEmailProps) {
  return (
    <html>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f4f5f7', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#f4f5f7', padding: '24px 0' }}>
          <tr>
            <td align="center">
              <table width="600" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)' }}>
                <tr>
                  <td style={{ backgroundColor: '#0f172a', padding: '28px 32px' }}>
                    <div style={{ fontSize: '12px', letterSpacing: '0.24em', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>
                      Contact
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>
                      New contact enquiry
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '28px 32px' }}>
                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse' }}>
                      {name ? <Field label="Name">{name}</Field> : null}
                      <Field label="Email">{email}</Field>
                      {topic ? <Field label="Topic">{topic}</Field> : null}
                      <Field label="Message">
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{message}</div>
                      </Field>
                      <tr>
                        <td style={{ padding: '10px 0' }}>
                          <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#94a3b8' }}>
                            Received {sentAt}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style={{ backgroundColor: '#f8fafc', padding: '18px 32px', fontSize: '12px', color: '#6b7280' }}>
                    Reply directly to this email to respond.
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
