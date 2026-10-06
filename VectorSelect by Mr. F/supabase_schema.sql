-- VectorSelect Supabase schema.
-- Run this once in Supabase SQL Editor before publishing the frontend.
-- Current anon policies preserve the classroom join-code workflow. For
-- stronger security, move grading and teacher mutations behind server APIs.

create extension if not exists pgcrypto;

create table if not exists public.active_assignments (
    id uuid primary key default gen_random_uuid(),
    join_code text unique not null,
    subject text not null default '',
    unit text not null default '',
    assessment_id text not null,
    assessment_title text not null default '',
    title text not null default '',
    class_period text not null default 'General',
    time_limit_minutes integer not null default 0,
    quiz_mode text not null default 'student_led',
    per_question_seconds integer not null default 0,
    current_question_index integer not null default 0,
    allow_calculator boolean not null default false,
    show_leaderboard boolean not null default true,
    enable_lockdown boolean not null default false,
    randomize_questions boolean not null default false,
    allow_student_review boolean not null default false,
    allow_review boolean not null default false,
    enable_point_redemption boolean not null default true,
    is_active boolean not null default true,
    is_started boolean not null default false,
    started_at timestamptz,
    timer_paused boolean not null default false,
    is_paused boolean not null default false,
    paused_remaining_seconds integer,
    timer_remaining_seconds integer,
    remaining_seconds integer not null default 0,
    discussion_active boolean not null default false,
    answer_revealed boolean not null default false,
    revealed_answer text not null default '',
    revealed_explanation text not null default '',
    previous_correct_answer text not null default '',
    question_started_at timestamptz,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.answer_keys (
    id uuid primary key default gen_random_uuid(),
    assessment_id text unique not null,
    subject text not null default '',
    unit text not null default '',
    keys jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.exam_submissions (
    id uuid primary key default gen_random_uuid(),
    assignment text,
    join_code text not null,
    student_name text not null,
    class_period text not null default 'General',
    subject text not null default '',
    unit text not null default '',
    assessment_id text not null default '',
    assessment_title text not null default '',
    score integer not null default 0,
    total_questions integer not null default 0,
    percentage numeric(6,2) not null default 0,
    score_percentage numeric(6,2) not null default 0,
    points numeric(8,2) not null default 0,
    speed_bonus numeric(8,2) not null default 0,
    streak integer not null default 0,
    max_streak integer not null default 0,
    recoveries_completed integer not null default 0,
    tab_switch_count integer not null default 0,
    fullscreen_exits integer not null default 0,
    time_spent_seconds integer not null default 0,
    answers jsonb not null default '{}'::jsonb,
    submitted_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.session_participants (
    id uuid primary key default gen_random_uuid(),
    join_code text not null,
    student_name text not null,
    joined_at timestamptz not null default timezone('utc', now()),
    unique (join_code, student_name)
);

create table if not exists public.live_question_answers (
    id uuid primary key default gen_random_uuid(),
    join_code text not null,
    student_name text not null,
    question_real_index integer not null,
    selected_letter text,
    is_correct boolean not null default false,
    points numeric(8,2) not null default 0,
    speed_bonus numeric(8,2) not null default 0,
    streak integer not null default 0,
    recovered_points numeric(8,2) not null default 0,
    answered_at timestamptz not null default timezone('utc', now()),
    unique (join_code, student_name, question_real_index)
);

create table if not exists public.live_reactions (
    id uuid primary key default gen_random_uuid(),
    join_code text not null,
    student_name text not null default 'Student',
    emoji text not null default '🚀',
    timestamp bigint not null,
    created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_submissions_join_code
    on public.exam_submissions (join_code, points desc, score desc, time_spent_seconds asc);
create index if not exists idx_submissions_assessment
    on public.exam_submissions (assessment_id);
create index if not exists idx_participants_code
    on public.session_participants (join_code);
create index if not exists idx_live_answers_code_q
    on public.live_question_answers (join_code, question_real_index);
create index if not exists idx_live_reactions_code_time
    on public.live_reactions (join_code, timestamp);

create or replace function public.get_server_time()
returns timestamptz
language sql
stable
as $$ select now(); $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

drop trigger if exists active_assignments_updated_at on public.active_assignments;
create trigger active_assignments_updated_at
before update on public.active_assignments
for each row execute function public.set_updated_at();

drop trigger if exists answer_keys_updated_at on public.answer_keys;
create trigger answer_keys_updated_at
before update on public.answer_keys
for each row execute function public.set_updated_at();

alter table public.active_assignments enable row level security;
alter table public.answer_keys enable row level security;
alter table public.exam_submissions enable row level security;
alter table public.session_participants enable row level security;
alter table public.live_question_answers enable row level security;
alter table public.live_reactions enable row level security;

drop policy if exists "public can read assignments" on public.active_assignments;
create policy "public can read assignments"
on public.active_assignments for select to anon, authenticated using (true);
drop policy if exists "public can create assignments" on public.active_assignments;
create policy "public can create assignments"
on public.active_assignments for insert to anon, authenticated with check (true);
drop policy if exists "public can update assignments" on public.active_assignments;
create policy "public can update assignments"
on public.active_assignments for update to anon, authenticated using (true) with check (true);
drop policy if exists "public can delete assignments" on public.active_assignments;
create policy "public can delete assignments"
on public.active_assignments for delete to anon, authenticated using (true);

drop policy if exists "public can read answer keys" on public.answer_keys;
create policy "public can read answer keys"
on public.answer_keys for select to anon, authenticated using (true);

drop policy if exists "public can write submissions" on public.exam_submissions;
create policy "public can write submissions"
on public.exam_submissions for insert to anon, authenticated with check (true);
drop policy if exists "public can read submissions" on public.exam_submissions;
create policy "public can read submissions"
on public.exam_submissions for select to anon, authenticated using (true);

drop policy if exists "public can read participants" on public.session_participants;
create policy "public can read participants"
on public.session_participants for select to anon, authenticated using (true);
drop policy if exists "public can check in participants" on public.session_participants;
create policy "public can check in participants"
on public.session_participants for insert to anon, authenticated with check (true);
drop policy if exists "public can update participants" on public.session_participants;
create policy "public can update participants"
on public.session_participants for update to anon, authenticated using (true) with check (true);

drop policy if exists "public can read live answers" on public.live_question_answers;
create policy "public can read live answers"
on public.live_question_answers for select to anon, authenticated using (true);
drop policy if exists "public can write live answers" on public.live_question_answers;
create policy "public can write live answers"
on public.live_question_answers for insert to anon, authenticated with check (true);
drop policy if exists "public can update live answers" on public.live_question_answers;
create policy "public can update live answers"
on public.live_question_answers for update to anon, authenticated using (true) with check (true);

drop policy if exists "public can read reactions" on public.live_reactions;
create policy "public can read reactions"
on public.live_reactions for select to anon, authenticated using (true);
drop policy if exists "public can create reactions" on public.live_reactions;
create policy "public can create reactions"
on public.live_reactions for insert to anon, authenticated with check (true);

do $$
begin
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='active_assignments') then
        execute 'alter publication supabase_realtime add table public.active_assignments';
    end if;
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='session_participants') then
        execute 'alter publication supabase_realtime add table public.session_participants';
    end if;
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='live_question_answers') then
        execute 'alter publication supabase_realtime add table public.live_question_answers';
    end if;
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='live_reactions') then
        execute 'alter publication supabase_realtime add table public.live_reactions';
    end if;
end;
$$;
