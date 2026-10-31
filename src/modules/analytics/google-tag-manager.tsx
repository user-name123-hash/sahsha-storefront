import Script from "next/script"

type GoogleTagManagerProps = {
  gtmId?: string
}

/**
 * Local GTM bootstrap — same behavior as commerce-core, but GTM payload is
 * lazyOnload so it does not compete with first paint (SEO render-blocking audit).
 */
export function GoogleTagManager({ gtmId }: GoogleTagManagerProps = {}) {
  const id = gtmId?.trim()
  if (!id) return null

  return (
    <>
      <Script
        id="gtm-consent-default"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              var consent = null;
              try { consent = localStorage.getItem('cookie_consent'); } catch (e) {}
              gtag('consent', 'default', {
                'ad_storage': consent === 'granted' ? 'granted' : 'denied',
                'analytics_storage': consent === 'granted' ? 'granted' : 'denied',
                'ad_user_data': consent === 'granted' ? 'granted' : 'denied',
                'ad_personalization': consent === 'granted' ? 'granted' : 'denied'
              });
            `,
        }}
      />
      <Script
        id="gtm-script"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${id}');
            `,
        }}
      />
    </>
  )
}

type GoogleTagManagerNoScriptProps = {
  gtmId?: string
}

export function GoogleTagManagerNoScript({
  gtmId,
}: GoogleTagManagerNoScriptProps = {}) {
  const id = gtmId?.trim()
  if (!id) return null

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${id}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  )
}
