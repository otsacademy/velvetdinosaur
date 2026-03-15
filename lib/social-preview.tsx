import type { CSSProperties } from 'react';
import { mainHeroCopy } from '@/lib/site-copy';

const shellStyle: CSSProperties = {
  display: 'flex',
  position: 'relative',
  width: '100%',
  height: '100%',
  background: 'linear-gradient(135deg, #f8fbff 0%, #dbeafe 50%, #bfdbfe 100%)',
  color: '#0f172a',
  overflow: 'hidden'
};

const brandTileStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 64,
  height: 64,
  borderRadius: 20,
  background: '#0f172a',
  color: '#ffffff',
  fontSize: 26,
  fontWeight: 700
};

const badgeStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '10px 18px',
  background: 'rgba(255,255,255,0.78)',
  color: '#1e3a8a',
  fontSize: 20,
  fontWeight: 600,
  border: '1px solid rgba(30,58,138,0.12)'
};

interface SocialPreviewProps {
  dinosaurSrc: string;
}

export function SocialPreview({ dinosaurSrc }: SocialPreviewProps) {
  return (
    <div style={shellStyle}>
      <div
        style={{
          position: 'absolute',
          left: -120,
          top: -140,
          width: 420,
          height: 420,
          borderRadius: 999,
          background: 'rgba(30,58,138,0.12)',
          transform: 'rotate(10deg)'
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: -70,
          bottom: -100,
          width: 420,
          height: 420,
          borderRadius: 999,
          background: 'rgba(59,130,246,0.24)'
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(15,23,42,0.12) 1px, transparent 0)',
          backgroundSize: '22px 22px',
          opacity: 0.35
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 40,
          width: '100%',
          padding: '54px 60px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 660, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={brandTileStyle}>VD</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div
                style={{
                  display: 'flex',
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#1e3a8a'
                }}
              >
                Velvet Dinosaur
              </div>
              <div style={{ display: 'flex', fontSize: 24, fontWeight: 600, color: '#334155' }}>
                Bespoke web design and development
              </div>
            </div>
          </div>

          <div style={badgeStyle}>{mainHeroCopy.badge}</div>

          <div
            style={{
              display: 'flex',
              fontSize: 58,
              lineHeight: 1.04,
              fontWeight: 700,
              letterSpacing: '-0.04em'
            }}
          >
            {mainHeroCopy.heading}
          </div>

          <div
            style={{
              display: 'flex',
              maxWidth: 640,
              fontSize: 26,
              lineHeight: 1.32,
              color: '#334155'
            }}
          >
            {mainHeroCopy.description}
          </div>

          <div
            style={{
              display: 'flex',
              maxWidth: 620,
              fontSize: 20,
              lineHeight: 1.35,
              color: '#475569'
            }}
          >
            {mainHeroCopy.supportingLine}
          </div>

          <div style={{ display: 'flex', fontSize: 22, fontWeight: 700, color: '#1e3a8a' }}>
            velvetdinosaur.com
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 360,
            flexShrink: 0
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 360,
              height: 360,
              padding: 18,
              borderRadius: 34,
              background: 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(15,23,42,0.08)'
            }}
          >
            <img
              src={dinosaurSrc}
              alt=""
              style={{
                width: 320,
                height: 320,
                objectFit: 'cover',
                borderRadius: 24
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
