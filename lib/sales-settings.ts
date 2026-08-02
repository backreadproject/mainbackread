import type { SupabaseClient } from "@supabase/supabase-js";

// How this customer sells.
//
// One value today, and that is deliberate. Two features -- the outcome prompt
// and the cooling list -- both had a hardcoded seven-day threshold, which is
// the point at which a setting stops being a field nobody asked for and starts
// being a preference the product actually reads. A single-consumer setting
// belongs next to its feature or nowhere.
//
// Every value has a working default, so the product is fully useful having
// never been configured. Somebody who never opens Settings should not notice
// this exists.
export const DEFAULT_QUIET_DAYS = 7;

export type SalesSettings = {
  quietDays: number;
};

export const SALES_DEFAULTS: SalesSettings = {
  quietDays: DEFAULT_QUIET_DAYS,
};

/**
 * Read a person's settings, falling back to the defaults.
 *
 * Never throws and never returns null: a settings lookup failing must not take
 * a page down, and the defaults are correct behaviour rather than a degraded
 * mode.
 */
export async function getSalesSettings(
  client: SupabaseClient,
  userId: string
): Promise<SalesSettings> {
  try {
    const { data } = await client
      .from("sales_settings")
      .select("quiet_days")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return SALES_DEFAULTS;
    const q = Number(data.quiet_days);
    return {
      quietDays: Number.isFinite(q) && q >= 1 && q <= 90 ? q : DEFAULT_QUIET_DAYS,
    };
  } catch {
    return SALES_DEFAULTS;
  }
}