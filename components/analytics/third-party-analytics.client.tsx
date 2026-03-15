'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    lintrk?: (...args: unknown[]) => void;
    _linkedin_data_partner_ids?: string[];
  }
}

const GA4_MEASUREMENT_ID = (process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || '').trim();
const CLARITY_PROJECT_ID = (process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || '').trim();
const META_PIXEL_ID = (process.env.NEXT_PUBLIC_META_PIXEL_ID || '').trim();
const LINKEDIN_PARTNER_ID = (process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID || '').trim();

export function ThirdPartyAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_LHCI === 'true') return;
    if (typeof window === 'undefined') return;

    const search = searchParams?.toString() || '';
    const pagePath = search ? `${pathname}?${search}` : pathname || window.location.pathname;
    const pageLocation = `${window.location.origin}${pagePath}`;

    if (GA4_MEASUREMENT_ID && typeof window.gtag === 'function') {
      window.gtag('config', GA4_MEASUREMENT_ID, {
        page_path: pagePath,
        page_location: pageLocation
      });
    }

    if (META_PIXEL_ID && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [pathname, searchParams]);

  return (
    <>
      {GA4_MEASUREMENT_ID ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="vd-ga4" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
              window.gtag('js', new Date());
              window.gtag('config', '${GA4_MEASUREMENT_ID}', { send_page_view: false });
            `}
          </Script>
        </>
      ) : null}

      {CLARITY_PROJECT_ID ? (
        <Script id="vd-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
          `}
        </Script>
      ) : null}

      {META_PIXEL_ID ? (
        <>
          <Script id="vd-meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s){
                if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)
              }(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
            `}
          </Script>
          <noscript>
            {/* Tracking pixel required by Meta's noscript fallback. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      ) : null}

      {LINKEDIN_PARTNER_ID ? (
        <>
          <Script id="vd-linkedin-partner" strategy="afterInteractive">
            {`
              window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
              window._linkedin_data_partner_ids.push("${LINKEDIN_PARTNER_ID}");
            `}
          </Script>
          <Script
            src="https://snap.licdn.com/li.lms-analytics/insight.min.js"
            strategy="afterInteractive"
          />
          <noscript>
            {/* Tracking pixel required by LinkedIn's noscript fallback. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://px.ads.linkedin.com/collect/?pid=${LINKEDIN_PARTNER_ID}&fmt=gif`}
            />
          </noscript>
        </>
      ) : null}
    </>
  );
}
