-- ==============================================================================
-- Wayground-Style AP Physics Assessment Platform: Supabase Database Schema
-- ==============================================================================
-- Paste this script into your Supabase Dashboard -> SQL Editor and click "Run".

-- 1. Create table for Active Teacher Assignments
create table if not exists public.active_assignments (
    id uuid default gen_random_uuid() primary key,
    join_code text unique not null,              -- e.g. "849201"
    subject text not null,                       -- e.g. "AP Physics 1: Algebra-Based"
    unit text not null,                          -- e.g. "Unit 2"
    assessment_id text not null,                 -- e.g. "app1_unit2_section_2.5_quiz"
    assessment_title text not null,              -- e.g. "Section 2.5 Quiz"
    class_period text default 'General',
    time_limit_minutes integer default 0,        -- 0 = untimed, or 15, 30, 45, etc.
    is_active boolean default true,              -- true = students can take it; false = closed
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create table for Student Exam Submissions
create table if not exists public.exam_submissions (
    id uuid default gen_random_uuid() primary key,
    join_code text not null,                     -- links directly to active_assignments
    student_name text not null,
    class_period text default 'General',
    subject text not null,
    unit text not null,
    assessment_id text not null,
    assessment_title text not null,
    score integer not null,
    total_questions integer not null,
    percentage numeric(5,2) not null,
    time_spent_seconds integer not null,
    answers jsonb default '{}'::jsonb,           -- record of student choices for item analysis
    submitted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create performance indexes
create index if not exists idx_active_assignments_code on public.active_assignments (join_code);
create index if not exists idx_submissions_join_code on public.exam_submissions (join_code, score desc, time_spent_seconds asc);
create index if not exists idx_submissions_assessment on public.exam_submissions (assessment_id);

-- 4. Enable Row Level Security (RLS)
alter table public.active_assignments enable row level security;
alter table public.exam_submissions enable row level security;

-- 5. Policies for active_assignments
create policy "Allow public to read active assignments"
    on public.active_assignments for select to anon using (true);

create policy "Allow teachers to insert/update assignments"
    on public.active_assignments for all to anon using (true) with check (true);

-- 6. Policies for exam_submissions
create policy "Allow student submissions insert"
    on public.exam_submissions for insert to anon with check (true);

create policy "Allow public leaderboard reads"
    on public.exam_submissions for select to anon using (true);

-- 7. Enable Realtime Publications for instant multi-device updates
alter publication supabase_realtime add table public.active_assignments;
alter publication supabase_realtime add table public.exam_submissions;

-- 8. Session participants (which students have joined this assignment)
create table if not exists public.session_participants (
    id uuid default gen_random_uuid() primary key,
    join_code text not null,
    student_name text not null,
    joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (join_code, student_name)
);

-- 9. Live per-question answers (reported on each selection, not just at submit)
create table if not exists public.live_question_answers (
    id uuid default gen_random_uuid() primary key,
    join_code text not null,
    student_name text not null,
    question_real_index integer not null,
    selected_letter text,
    is_correct boolean default false,
    answered_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (join_code, student_name, question_real_index)
);

-- 10. Performance indexes for live session queries
create index if not exists idx_participants_code on public.session_participants (join_code);
create index if not exists idx_live_answers_code_q on public.live_question_answers (join_code, question_real_index);

-- 11. Add timer-sync and discussion-pause columns to active_assignments
alter table public.active_assignments add column if not exists question_started_at timestamp with time zone;
alter table public.active_assignments add column if not exists discussion_active boolean default false;

-- 12. Enable Row Level Security on new tables
alter table public.session_participants enable row level security;
alter table public.live_question_answers enable row level security;

-- 13. Policies for session_participants (anon read/write)
create policy "Allow public to read participants"
    on public.session_participants for select to anon using (true);

create policy "Allow participant upsert"
    on public.session_participants for insert to anon with check (true);

create policy "Allow participant update"
    on public.session_participants for update to anon using (true);

-- 14. Policies for live_question_answers (anon read/write)
create policy "Allow public to read live answers"
    on public.live_question_answers for select to anon using (true);

create policy "Allow live answer upsert"
    on public.live_question_answers for insert to anon with check (true);

create policy "Allow live answer update"
    on public.live_question_answers for update to anon using (true);

-- 15. Enable Realtime for new live-session tables
alter publication supabase_realtime add table public.session_participants;
alter publication supabase_realtime add table public.live_question_answers;
