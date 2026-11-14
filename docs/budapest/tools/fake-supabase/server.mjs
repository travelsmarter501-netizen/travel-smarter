// Test double (not shipped); plain JavaScript so it loads without transpiling.
// TEST DOUBLE for utils/supabase/server.ts: an in-memory "database" (globalThis.__fakeDb) with one user and their saved-plan rows.
// Swapped in only by the resolution hook in bud-action-save.mts. Nothing real is contacted.
export async function createClient() {
  const db = globalThis.__fakeDb;
  return {
    auth: { getUser: async () => ({ data: { user: db.user }, error: null }) },
    from(table) {
      const filters = {};
      const builder = {
        select: () => builder,
        eq: (column, value) => { filters[column] = value; return builder; },
        maybeSingle: async () => {
          db.calls.push(`select ${table}`);
          const row = table === "smart_planner_saved_plans" ? db.rows.find((r) => Object.entries(filters).every(([k, v]) => r[k] === v)) : null;
          return { data: row ? JSON.parse(JSON.stringify(row)) : null, error: null };
        },
      };
      return builder;
    },
  };
}
