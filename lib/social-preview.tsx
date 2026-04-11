import type { CSSProperties } from 'react';
import { mainHeroCopy } from '@/lib/site-copy';

const previewShellStyle: CSSProperties = {
  display: 'flex',
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  background: 'linear-gradient(180deg, #fcfdff 0%, #eef5ff 56%, #e3eefc 100%)',
  color: '#0f172a',
};

const brandMarkStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 54,
  height: 54,
  borderRadius: 18,
  background: '#0f172a',
  color: '#ffffff',
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: '0.08em',
};

const navPillStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 16px',
  borderRadius: 999,
  border: '1px solid rgba(15, 23, 42, 0.08)',
  background: 'rgba(255, 255, 255, 0.88)',
  color: '#334155',
  fontSize: 15,
  fontWeight: 600,
};

const metricCardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minWidth: 160,
  padding: '16px 18px',
  borderRadius: 22,
  border: '1px solid rgba(148, 163, 184, 0.22)',
  background: 'rgba(255, 255, 255, 0.92)',
  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.06)',
};

const serviceTagStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 14px',
  borderRadius: 999,
  background: 'rgba(15, 23, 42, 0.9)',
  color: '#ffffff',
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: '0.02em',
};

const proofItems = [
  { value: '100/100', label: 'Lighthouse-ready builds' },
  { value: '5.0', label: 'Google rating' },
  { value: '4-6 wk', label: 'Typical brochure launch' },
];

const services = ['Websites', 'Web apps', 'Mobile apps'];

interface SocialPreviewProps {
  dinosaurSrc: string;
}

export function SocialPreview({ dinosaurSrc }: SocialPreviewProps) {
  return (
    <div style={previewShellStyle}>
      <div
        style={{
          position: 'absolute',
          left: -120,
          top: -160,
          width: 420,
          height: 420,
          borderRadius: 999,
          background: 'rgba(59, 130, 246, 0.16)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: -120,
          bottom: -190,
          width: 520,
          height: 520,
          borderRadius: 999,
          background: 'rgba(14, 165, 233, 0.18)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.08) 1px, transparent 0)',
          backgroundSize: '24px 24px',
          opacity: 0.45,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          padding: '32px 40px 28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={brandMarkStyle}>VD</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div
                style={{
                  display: 'flex',
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                }}
              >
                Velvet Dinosaur
              </div>
              <div style={{ display: 'flex', fontSize: 18, color: '#475569', fontWeight: 600 }}>
                Founder-led bespoke websites and apps
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={navPillStyle}>Services</div>
            <div style={navPillStyle}>Work</div>
            <div style={navPillStyle}>About</div>
            <div
              style={{
                ...navPillStyle,
                background: '#0f172a',
                borderColor: '#0f172a',
                color: '#ffffff',
              }}
            >
              Start a project
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 34,
            flex: 1,
            marginTop: 42,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 690, flex: 1, paddingTop: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                alignSelf: 'flex-start',
                padding: '10px 16px',
                borderRadius: 999,
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(37, 99, 235, 0.12)',
                color: '#1d4ed8',
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              {mainHeroCopy.badge}
            </div>

            <div
              style={{
                display: 'flex',
                marginTop: 18,
                fontSize: 56,
                lineHeight: 1.04,
                fontWeight: 800,
                letterSpacing: '-0.05em',
                color: '#0f172a',
              }}
            >
              {mainHeroCopy.heading}
            </div>

            <div
              style={{
                display: 'flex',
                marginTop: 18,
                maxWidth: 650,
                fontSize: 22,
                lineHeight: 1.34,
                color: '#334155',
              }}
            >
              {mainHeroCopy.description}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
              {proofItems.map((item) => (
                <div key={item.label} style={metricCardStyle}>
                  <div style={{ display: 'flex', fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{item.value}</div>
                  <div style={{ display: 'flex', fontSize: 15, lineHeight: 1.35, color: '#475569' }}>{item.label}</div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                marginTop: 20,
                fontSize: 18,
                fontWeight: 700,
                color: '#1d4ed8',
              }}
            >
              velvetdinosaur.com
            </div>
          </div>

          <div
              style={{
                display: 'flex',
                position: 'relative',
                alignItems: 'center',
                justifyContent: 'center',
                width: 390,
                height: 390,
                flexShrink: 0,
                marginTop: 8,
              }}
            >
            <div
              style={{
                position: 'absolute',
                width: 372,
                height: 372,
                borderRadius: 52,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(229,238,252,0.96) 100%)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
                boxShadow: '0 28px 60px rgba(15, 23, 42, 0.08)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 24,
                right: 18,
                display: 'flex',
                gap: 8,
              }}
            >
              {services.map((service) => (
                <div key={service} style={serviceTagStyle}>
                  {service}
                </div>
              ))}
            </div>
            <div
              style={{
                position: 'absolute',
                inset: 30,
                borderRadius: 40,
                border: '2px solid rgba(59, 130, 246, 0.16)',
              }}
            />
            <img
              src={dinosaurSrc}
              alt=""
              style={{
                position: 'relative',
                width: 304,
                height: 304,
                objectFit: 'contain',
                marginTop: 52,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
