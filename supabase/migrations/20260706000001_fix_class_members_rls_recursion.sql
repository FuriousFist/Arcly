-- Fix: "members can view class members" queried class_members inside its own
-- USING clause. RLS applies to queries inside policies too, so every select on
-- class_members failed with "infinite recursion detected in policy" (42P17).
-- A security definer function bypasses RLS for the membership lookup, which
-- breaks the cycle. It deliberately takes no user_id parameter — it only ever
-- answers for the calling user, so it can't be used to probe other users'
-- memberships.

create or replace function public.is_class_member(check_class_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
    select exists (
        select 1 from public.class_members
        where class_id = check_class_id
        and user_id = auth.uid()
    );
$$;

drop policy "members can view class members" on public.class_members;

create policy "members can view class members"
    on class_members for select
    to authenticated
    using (public.is_class_member(class_id));
