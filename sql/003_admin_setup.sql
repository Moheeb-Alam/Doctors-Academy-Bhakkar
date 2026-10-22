insert into public.profiles (id, full_name, role)
values (
  '040bad71-18f7-4cd9-a25c-5f5d86f21024'::uuid,
  'Academy Admin',
  'admin'
)
on conflict (id)
do update set
  full_name = excluded.full_name,
  role = 'admin';


 