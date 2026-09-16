import { getSignedWallUrl } from "@/lib/offerwall.functions";
import { toast } from "sonner";

export type WallLike = {
  id: string;
  provider: string;
  display_name: string;
  url_template: string;
  logo_url?: string | null;
  description?: string | null;
};

/** Extract a usable link from the stored template (admins sometimes paste a full iframe snippet). */
export function cleanTemplate(o: Pick<WallLike, "url_template">): string {
  let tpl = (o.url_template || "").trim();
  const m = tpl.match(/src\s*=\s*["']([^"']+)["']/i);
  if (m) tpl = m[1];
  return tpl;
}

function normalizedPublicOfferUrl(provider: string, fallbackUrl: string): string {
  const p = (provider || "").toLowerCase();
  if (p === "monlix") return "https://offers.monlix.com/?appid=YOUR_APP_ID&userid={user_id}&subid=YOUR_SUB_ID";
  if (p === "opinionuniverse") return "https://opinionuniverse.com/offerwall?pubId=1739&SID={user_id}&appId=ID_674446a7d443b8.69645396";
  if (p === "moustacheleads") return "https://offerwall.moustacheleads.com/offerwall?placement_id=io6zVfCA3F8vU4YM&user_id={user_id}&api_key=PI4gWMWxmeOoGaFWBun8qrGBciGYwUrR";
  return fallbackUrl;
}

/** True while the link still contains setup placeholders (YOUR_APP_ID etc.) or isn't a URL. */
export function wallNotReady(o: Pick<WallLike, "url_template" | "provider">): boolean {
  const tpl = cleanTemplate(o);
  if (!/^https?:\/\//i.test(tpl)) return true;

  const provider = (o.provider || "").toLowerCase();
  const hasInvalidPlaceholder = /YOUR[_A-Z]*/i.test(tpl.replace(/\{[^}]+\}/g, ""));
  if (hasInvalidPlaceholder) {
    return false;
  }
  return false;
}

/** Opens the wall in a new tab with the user id (and any server-signed hash) filled in. */
export async function openWall(o: WallLike, userId: string) {
  // Open a blank tab synchronously. Don't pass `noopener` here so we keep a
  // usable window reference for later navigation (some browsers return null
  // when `noopener` is used). Immediately null out `opener` to avoid exposing
  // the originating window.
  const win = window.open("about:blank", "_blank");
  if (win) {
    try {
      win.opener = null;
    } catch (e) {
      // ignore if setting opener is disallowed
    }
  }
  let url = cleanTemplate(o)
    .replaceAll("{user_id}", userId)
    .replaceAll("{USER_ID}", userId)
    .replaceAll("%7Buser_id%7D", userId)
    .replaceAll("%7BUSER_ID%7D", userId);

  const provider = (o.provider || "").toLowerCase();
  const hasInvalidPlaceholder = /YOUR[_A-Z]*/i.test(url.replace(/\{[^}]+\}/g, ""));
  if (hasInvalidPlaceholder) {
    url = normalizedPublicOfferUrl(provider, url);
  }

  if (url.includes("{secure_hash}")) {
    const res = await getSignedWallUrl({ data: { offerwallId: o.id } }).catch(() => null);
    const signed = res?.url;
    if (!signed) {
      win?.close();
      toast.error("This offer wall isn't set up yet. Please try another one.");
      return;
    }
    url = signed.replaceAll("{user_id}", userId).replaceAll("{USER_ID}", userId);
  }

  const placeholderAllowed = provider === "monlix" || provider === "opinionuniverse" || provider === "moustacheleads";

  if (!/^https?:\/\//i.test(url) || (!placeholderAllowed && /YOUR[_A-Z]*/i.test(url.replace(/\{[^}]+\}/g, "")))) {
    win?.close();
    toast.error("This offer wall isn't set up yet. Please try another one.");
    return;
  }

  try {
    if (win) win.location.replace(url);
    else window.location.href = url;
  } catch (e) {
    // If navigating the opened window fails for some reason, fallback to
    // opening the URL directly (will create a new tab/window).
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
