-- Run after 001_schema.sql. Access is restricted to authenticated users with an admin profile.
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.sections enable row level security;
alter table public.students enable row level security;
alter table public.fee_payments enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "Admins can read own profile" on public.profiles;
create policy "Admins can read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()) and role = 'admin');

drop policy if exists "Admins manage classes" on public.classes;
create policy "Admins manage classes" on public.classes
  for all to authenticated using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );

drop policy if exists "Admins manage sections" on public.sections;
create policy "Admins manage sections" on public.sections
  for all to authenticated using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );

drop policy if exists "Admins manage students" on public.students;
create policy "Admins manage students" on public.students
  for all to authenticated using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );

drop policy if exists "Admins manage fee payments" on public.fee_payments;
create policy "Admins manage fee payments" on public.fee_payments
  for all to authenticated using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );

drop policy if exists "Admins manage expenses" on public.expenses;
create policy "Admins manage expenses" on public.expenses
  for all to authenticated using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );

-- Restrict table privileges to authenticated users; RLS determines which records are accessible.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.classes, public.sections,
  public.students, public.fee_payments, public.expenses to authenticated;
