import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WallLogo } from "@/components/WallLogo";
import { openWall, wallNotReady } from "@/lib/openWall";

export const Route = createFileRoute("/_authenticated/offerwalls")({
  head: () => ({ meta: [{ title: "Offer Walls — Global Prime" }, { name: "description", content: "Complete offers from top providers." }] }),
  component: OfferwallsPage,
});

type OW = { id: string; provider: string; display_name: string; url_template: string; logo_url: string | null; description: string | null };

const fallbackOfferwalls: OW[] = [
  { id: "fallback-monlix", provider: "monlix", display_name: "Monlix", url_template: "https://offers.monlix.com/?appid=YOUR_APP_ID&userid={user_id}&subid=YOUR_SUB_ID", logo_url: null, description: "Monlix offer wall" },
  { id: "fallback-opinionuniverse", provider: "opinionuniverse", display_name: "Opinion Universe", url_template: "https://opinionuniverse.com/offerwall?pubId=1739&SID={user_id}&appId=ID_674446a7d443b8.69645396", logo_url: null, description: "Opinion Universe offer wall" },
  { id: "fallback-moustacheleads", provider: "moustacheleads", display_name: "Moustache Leads", url_template: "https://offerwall.moustacheleads.com/offerwall?placement_id=io6zVfCA3F8vU4YM&user_id={user_id}&api_key=PI4gWMWxmeOoGaFWBun8qrGBciGYwUrR", logo_url: null, description: "Moustache Leads offer wall" },
  { id: "fallback-gemi", provider: "gemi", display_name: "Gemi", url_template: "https://gemiwall.com/{PLACEMENT_ID}/{USER_ID}", logo_url: null, description: "Gemi offer wall" },
];

function OfferwallsPage() {
  const { user } = Route.useRouteContext();
  const [items, setItems] = useState<OW[]>([]);

  useEffect(() => {
    supabase.from("offerwalls").select("id,provider,display_name,url_template,logo_url,description").eq("active", true).then(({ data }) => setItems((data ?? []) as OW[]));
  }, []);

  const mergedItems = [...fallbackOfferwalls, ...items]
    .filter((o) => !["gemiads", "offery"].includes((o.provider || "").toLowerCase()))
    .filter((o, index, arr) => arr.findIndex((x) => x.provider === o.provider) === index);
  const ready = mergedItems.filter((o) => !wallNotReady(o));



  return (
    <div>
      <h1 className="text-lg font-bold text-[#1a1c3a] mb-3">🎯 Offer Walls</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {ready.map((o) => (
          <div key={o.id} className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition">
            <div className="flex justify-center"><WallLogo name={o.display_name} logoUrl={o.logo_url} urlTemplate={o.url_template} provider={o.provider} className="w-16 h-16" /></div>
            <div className="mt-2 font-bold text-sm">{o.display_name}</div>
            {o.description && <div className="text-xs text-gray-500 line-clamp-2 mt-1">{o.description}</div>}
            <button onClick={() => openWall(o, user.id)} className="mt-3 w-full bg-[#5a3dba] hover:bg-[#4a2fa8] text-white text-xs font-semibold py-2 rounded">
              Open Wall
            </button>
          </div>
        ))}
      </div>
      {ready.length === 0 && (
        <div className="bg-white rounded-lg p-6 text-center text-sm text-gray-500">No offer walls available right now. Please check back soon.</div>
      )}

    </div>
  );
}
