// Test double (not shipped); plain JavaScript so it loads without transpiling.
// TEST DOUBLE for utils/supabase/service-role.ts: records every RPC call in globalThis.__fakeDb.calls and implements
// replace_owned_plan_content like the real owner-only function (the row must exist and belong to that user).
export function createServiceRoleClient() {
  const db = globalThis.__fakeDb;
  return {
    rpc: async (fn, args) => {
      db.calls.push(`rpc ${fn}`);
      if (fn !== "replace_owned_plan_content") return { data: null, error: null };
      const row = db.rows.find((r) => r.id === args.p_plan_id && r.user_id === args.p_user_id);
      if (!row) return { data: false, error: null };
      row.preferences_json = JSON.parse(JSON.stringify(args.p_preferences));
      row.generated_plan_json = JSON.parse(JSON.stringify(args.p_generated));
      return { data: true, error: null };
    },
  };
}
