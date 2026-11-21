import type { CSSProperties } from 'react';

// The picture shown when a link to the site is shared. It is drawn by
// next/og (satori), which has no access to the site's CSS, so the Letter
// palette (app/letter.css) is repeated here as literal colours and every box
// with more than one child spells out its flex layout.
const PAPER = '#FCFAF6';
const CARD = '#FFFFFF';
const INK = '#1D1A16';
const SOFT_INK = '#423D37';
const RULE = '#E7E1D6';
const NAVY = '#1F2D45';
const PEN = '#A8482A';
const STAR = '#B7791F';

const SERIF = 'Newsreader';
const SANS = 'Source Sans 3';

const shellStyle: CSSProperties = {
  display: 'flex',
  width: '100%',
  height: '100%',
  background: PAPER,
  color: INK,
  fontFamily: SANS,
  fontWeight: 600,
};

const promises = ['5.0 on Google', 'No setup fee', '30-day money-back guarantee'];

interface SocialPreviewProps {
  /** Data URIs, read from /public by the image routes. */
  markSrc: string;
  dinosaurSrc: string;
}

export function SocialPreview({ markSrc, dinosaurSrc }: SocialPreviewProps) {
  return (
    <div style={shellStyle}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
          padding: '56px 0 52px 72px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- existing code; lint rules aligned with ASAP's in Nov 2026 */}
          <img src={markSrc} alt="" width={58} height={53} />
          <div
            style={{
              display: 'flex',
              fontFamily: SERIF,
              fontWeight: 500,
              fontSize: 38,
              letterSpacing: '-0.01em',
            }}
          >
            Velvet Dinosaur
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 21,
              letterSpacing: '0.15em',
              color: SOFT_INK,
            }}
          >
            WEB DESIGN IN WITNEY, OXFORDSHIRE
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 18,
              fontFamily: SERIF,
              fontWeight: 500,
              fontSize: 82,
              lineHeight: 1.02,
              letterSpacing: '-0.022em',
            }}
          >
            <div style={{ display: 'flex' }}>I’ll build your</div>
            <div style={{ display: 'flex' }}>website first.</div>
            <div style={{ display: 'flex', fontStyle: 'italic', color: PEN }}>You decide after.</div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 30,
            paddingTop: 22,
            borderTop: `2px solid ${RULE}`,
            fontSize: 23,
            color: SOFT_INK,
          }}
        >
          {promises.map((promise, index) => (
            <div key={promise} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  display: 'flex',
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  background: index === 0 ? STAR : NAVY,
                }}
              />
              {promise}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 430,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px 20px 22px',
            borderRadius: 6,
            background: CARD,
            border: `1px solid ${RULE}`,
            boxShadow: '0 34px 60px -34px rgba(29, 26, 22, 0.55), 0 2px 6px rgba(29, 26, 22, 0.12)',
            transform: 'rotate(2.2deg)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 296,
              height: 316,
              borderRadius: 3,
              background: '#F4F0EA',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- existing code; lint rules aligned with ASAP's in Nov 2026 */}
            <img src={dinosaurSrc} alt="" width={270} height={270} style={{ objectFit: 'contain' }} />
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 16,
              fontFamily: SERIF,
              fontWeight: 500,
              fontStyle: 'italic',
              fontSize: 25,
              color: INK,
            }}
          >
            Built before you pay.
          </div>
        </div>
      </div>
    </div>
  );
}
