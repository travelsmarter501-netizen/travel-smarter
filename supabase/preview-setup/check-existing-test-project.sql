-- READ-ONLY check of an EXISTING Supabase test project before reusing it for the Budapest Preview (2026-11-16).
-- It changes nothing and returns no personal data: only whether each object the migrations create exists, and row COUNTS.
-- Run it in the SQL Editor of the TEST project (never production). Paste the result table back (it contains no secrets).
-- Expected objects are taken from supabase/migrations/ (22 files). Missing objects mean migrations to compare, not to re-run blindly.

with expected(kind, name) as (
  values
    ('table', 'public.custom_plan_drafts'), ('table', 'public.custom_plan_final_plans'), ('table', 'public.custom_plan_requests'),
    ('table', 'public.order_attribution'), ('table', 'public.order_items'), ('table', 'public.orders'),
    ('table', 'public.personalized_plan_generation_leases'), ('table', 'public.personalized_plan_requests'), ('table', 'public.products'),
    ('table', 'public.smart_planner_saved_plans'), ('table', 'public.user_entitlements'),
    ('function', 'public.begin_owner_plan_generation'), ('function', 'public.begin_personalized_plan_generation'),
    ('function', 'public.claim_guest_order'), ('function', 'public.claim_guest_order_status'),
    ('function', 'public.complete_personalized_plan_generation'), ('function', 'public.create_complimentary_personalized_plan_request'),
    ('function', 'public.create_custom_plan_order'), ('function', 'public.create_custom_plan_request'), ('function', 'public.create_pending_order'),
    ('function', 'public.create_personalized_plan_order'), ('function', 'public.delete_saved_plan'), ('function', 'public.end_owner_plan_generation'),
    ('function', 'public.replace_owned_plan_content'), ('function', 'public.set_saved_plan_archived'), ('function', 'public.user_owns_personalized_plan'),
    ('function', 'reporting.sales_start'),
    ('view', 'reporting.real_orders'), ('view', 'reporting.sales_overview'), ('view', 'reporting.checkout_conversion_daily')
),
present as (
  select e.kind, e.name,
         case e.kind
           when 'table' then to_regclass(e.name) is not null
           when 'view' then to_regclass(e.name) is not null
           else exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                        where n.nspname || '.' || p.proname = e.name)
         end as ok
  from expected e
)
select 'object' as section, kind || ' ' || name as item, case when ok then 'present' else 'MISSING' end as result from present
union all
select 'rls', 'public.smart_planner_saved_plans RLS', case when (select relrowsecurity from pg_class where oid = to_regclass('public.smart_planner_saved_plans')) then 'on' else 'OFF or missing' end
union all
select 'rls', 'policies on smart_planner_saved_plans', (select count(*)::text from pg_policies where schemaname = 'public' and tablename = 'smart_planner_saved_plans')
union all
select 'counts', 'auth.users (count only)', (select count(*)::text from auth.users)
union all
select 'counts', 'public.orders (count only)', case when to_regclass('public.orders') is null then 'n/a' else (select count(*)::text from public.orders) end
union all
select 'counts', 'public.smart_planner_saved_plans (count only)', case when to_regclass('public.smart_planner_saved_plans') is null then 'n/a' else (select count(*)::text from public.smart_planner_saved_plans) end
union all
select 'product', coalesce(slug, '?'), coalesce(price_ils::text, '?') || case when active then ' active' else ' inactive' end
from public.products where slug = 'travel-smarter-personalized-plan'
order by 1, 2;
