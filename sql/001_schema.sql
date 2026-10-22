-- Run this file first in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Academy Admin',
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (class_id, name),
  unique (id, class_id)
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  student_code text not null unique,
  full_name text not null,
  father_name text not null,
  phone text,
  monthly_fee numeric(12,2) not null default 0 check (monthly_fee >= 0),
  class_id uuid references public.classes(id) on delete set null,
  section_id uuid,
  status text not null default 'active' check (status in ('active','inactive')),
  enrolled_on date not null default current_date,
  created_at timestamptz not null default now(),
  constraint student_section_matches_class
    foreign key (section_id, class_id) references public.sections(id, class_id)
    on delete set null (section_id)
);

create table if not exists public.fee_payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  paid_on date not null default current_date,
  period text not null,
  method text not null default 'cash' check (method in ('cash','bank','online','other')),
  reference text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  amount numeric(12,2) not null check (amount > 0),
  spent_on date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists students_name_idx on public.students (full_name);
create index if not exists students_class_idx on public.students (class_id, section_id);
create index if not exists fee_payments_student_period_idx on public.fee_payments (student_id, period);
create index if not exists fee_payments_paid_on_idx on public.fee_payments (paid_on);
create index if not exists expenses_spent_on_idx on public.expenses (spent_on);
