-- Defense-in-depth only -- NOT a security fix. Live QA of Custom Plan Fulfillment V1 proved
-- RLS already fully protects public.custom_plan_final_plans: an authenticated customer's
-- UPDATE/DELETE against their own delivered row affects exactly zero rows and returns no error
-- (Postgres's standard behavior for a DML command with no matching RLS policy -- the row is
-- simply filtered out, not "allowed then silently reverted") -- verified live, and the row's
-- content was confirmed byte-for-byte unchanged afterward.
--
-- The ONLY change here: explicit revokes on public.custom_plan_final_plans for `authenticated`,
-- matching the style already used on public.custom_plan_drafts (20260906120000) and
-- public.custom_plan_requests, so a blocked write raises a clear "permission denied for table"
-- error immediately instead of a silent 0-rows-affected result -- purely a clarity/consistency
-- improvement, changes no actual access outcome.
--
-- Additive only. Touches no data, no other table, no policy definition.

revoke insert, update, delete on public.custom_plan_final_plans from authenticated;

notify pgrst, 'reload schema';
