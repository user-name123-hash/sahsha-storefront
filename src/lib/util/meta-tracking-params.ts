/**
 * Meta (Facebook / Instagram) click & share IDs appended to outbound links.
 * These break Next.js hydration / client routers inside Instagram's in-app browser.
 * Strip them while preserving legitimate params (utm_*, v_id, page, step, …).
 */
export const META_TRACKING_PARAMS = [
  "fbclid",
  "igsh",
  "igshid",
  "fb_action_ids",
  "fb_action_types",
  "fb_source",
  "mbextid",
] as const

export type MetaTrackingParam = (typeof META_TRACKING_PARAMS)[number]

/** Inline script for <head> — runs before React hydrates. */
export const STRIP_META_TRACKING_PARAMS_SCRIPT = `(function(){try{var p=new URLSearchParams(location.search);var k=${JSON.stringify(
  META_TRACKING_PARAMS
)};var c=false;for(var i=0;i<k.length;i++){if(p.has(k[i])){p.delete(k[i]);c=true}}if(!c)return;var q=p.toString();history.replaceState(null,"",location.pathname+(q?"?"+q:"")+location.hash)}catch(e){}})();`
