-- ============================================================
-- 1. TABLES
-- ============================================================

create table if not exists users (
    id uuid primary key references auth.users(id) on delete cascade,
    email text unique not null,
    name text not null,
    created_at timestamptz default now(),
    avatar_url text
);

create table if not exists classes (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    created_at timestamptz default now(),
    instructor_id uuid references users(id) on delete restrict,
    invite_code char(8) unique not null
);

create table if not exists class_members (
    class_id uuid references classes(id) on delete cascade,
    user_id uuid references users(id) on delete cascade,
    role text check (role in ('student', 'instructor')) not null,
    joined_at timestamptz default now(),
    primary key (class_id, user_id)
);

create type submission_types as enum ('text', 'file');

create table if not exists assignments (
    id uuid primary key default gen_random_uuid(),
    class_id uuid references classes(id) on delete cascade,
    title text not null,
    brief text,
    due_at timestamptz,
    created_at timestamptz default now(),
    rubric_json jsonb,
    status text check (status in ('draft', 'published', 'closed')) default 'draft',
    submission_types submission_types[]
);

create table if not exists submissions (
    id uuid primary key default gen_random_uuid(),
    assignment_id uuid references assignments(id) on delete cascade,
    student_id uuid references users(id) on delete cascade,
    text_content text,
    file_urls text[],
    submitted_at timestamptz default now(),
    status text check (status in ('submitted', 'graded', 'resubmission_requested')) default 'submitted'
);

create table if not exists grades (
    id uuid primary key default gen_random_uuid(),
    submission_id uuid references submissions(id) on delete cascade,

    ai_grade numeric check (ai_grade >= 0 and ai_grade <= 100),
    ai_feedback text,
    ai_rubric_scores_json jsonb,
    ai_confidence numeric check (ai_confidence >= 0 and ai_confidence <= 1),

    graded_by uuid references users(id) on delete set null,
    released_at timestamptz,
    instructor_grade numeric check (instructor_grade >= 0 and instructor_grade <= 100),
    instructor_feedback text,
    instructor_rubric_json jsonb,
    unique(submission_id)
);


-- ============================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================

alter table users enable row level security;
alter table classes enable row level security;
alter table class_members enable row level security;
alter table assignments enable row level security;
alter table submissions enable row level security;
alter table grades enable row level security;


-- ============================================================
-- 3. POLICIES
-- ============================================================

-- users
create policy "authenticated users can view all profiles"
    on users for select
    to authenticated
    using (true);

create policy "users can insert own row"
    on users for insert
    to authenticated
    with check (auth.uid() = id);

create policy "users can update own row"
    on users for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- classes
create policy "members can view their classes"
    on classes for select
    to authenticated
    using (
        exists (
            select 1 from class_members cm
            where cm.class_id = classes.id
            and cm.user_id = auth.uid()
        )
    );

create policy "authenticated users can create classes"
    on classes for insert
    to authenticated
    with check (instructor_id = auth.uid());

create policy "only instructors can update classes"
    on classes for update
    to authenticated
    using (instructor_id = auth.uid())
    with check (instructor_id = auth.uid());

create policy "only instructors can delete classes"
    on classes for delete
    to authenticated
    using (instructor_id = auth.uid());

-- class_members
create policy "members can view class members"
    on class_members for select
    to authenticated
    using (
        exists (
            select 1 from class_members cm
            where cm.class_id = class_members.class_id
            and cm.user_id = auth.uid()
        )
    );

create policy "members can join or be added to classes"
    on class_members for insert
    to authenticated
    with check (
        user_id = auth.uid()
        or exists (
            select 1 from classes
            where classes.id = class_id
            and classes.instructor_id = auth.uid()
        )
    );

create policy "members can leave or be removed from classes"
    on class_members for delete
    to authenticated
    using (
        user_id = auth.uid()
        or exists (
            select 1 from classes
            where classes.id = class_id
            and classes.instructor_id = auth.uid()
        )
    );

-- assignments
create policy "members can view assignments"
    on assignments for select
    to authenticated
    using (
        exists (
            select 1 from class_members cm
            where cm.class_id = assignments.class_id
            and cm.user_id = auth.uid()
            and (
                assignments.status != 'draft'
                or cm.role = 'instructor'
            )
        )
    );

create policy "instructors can create assignments"
    on assignments for insert
    to authenticated
    with check (
        exists (
            select 1 from class_members cm
            where cm.class_id = class_id
            and cm.user_id = auth.uid()
            and cm.role = 'instructor'
        )
    );

create policy "instructors can update assignments"
    on assignments for update
    to authenticated
    using (
        exists (
            select 1 from class_members cm
            where cm.class_id = assignments.class_id
            and cm.user_id = auth.uid()
            and cm.role = 'instructor'
        )
    )
    with check (
        exists (
            select 1 from class_members cm
            where cm.class_id = assignments.class_id
            and cm.user_id = auth.uid()
            and cm.role = 'instructor'
        )
    );

create policy "instructors can delete assignments"
    on assignments for delete
    to authenticated
    using (
        exists (
            select 1 from class_members cm
            where cm.class_id = assignments.class_id
            and cm.user_id = auth.uid()
            and cm.role = 'instructor'
        )
    );

-- submissions
create policy "students see own submissions, instructors see all in class"
    on submissions for select
    to authenticated
    using (
        student_id = auth.uid()
        or exists (
            select 1 from assignments a
            join class_members cm on cm.class_id = a.class_id
            where a.id = submissions.assignment_id
            and cm.user_id = auth.uid()
            and cm.role = 'instructor'
        )
    );

create policy "students can submit to their class assignments"
    on submissions for insert
    to authenticated
    with check (
        student_id = auth.uid()
        and exists (
            select 1 from class_members cm
            join assignments a on a.class_id = cm.class_id
            where a.id = assignment_id
            and cm.user_id = auth.uid()
            and cm.role = 'student'
        )
    );

create policy "students can update own submissions"
    on submissions for update
    to authenticated
    using (student_id = auth.uid())
    with check (student_id = auth.uid());

-- grades
create policy "instructors see all grades, students see released only"
    on grades for select
    to authenticated
    using (
        exists (
            select 1 from submissions s
            join assignments a on a.id = s.assignment_id
            join class_members cm on cm.class_id = a.class_id
            where s.id = grades.submission_id
            and cm.user_id = auth.uid()
            and cm.role = 'instructor'
        )
        or (
            released_at is not null
            and exists (
                select 1 from submissions s
                where s.id = grades.submission_id
                and s.student_id = auth.uid()
            )
        )
    );

create policy "instructors can create grades"
    on grades for insert
    to authenticated
    with check (
        exists (
            select 1 from submissions s
            join assignments a on a.id = s.assignment_id
            join class_members cm on cm.class_id = a.class_id
            where s.id = submission_id
            and cm.user_id = auth.uid()
            and cm.role = 'instructor'
        )
    );

create policy "instructors can update grades"
    on grades for update
    to authenticated
    using (
        exists (
            select 1 from submissions s
            join assignments a on a.id = s.assignment_id
            join class_members cm on cm.class_id = a.class_id
            where s.id = grades.submission_id
            and cm.user_id = auth.uid()
            and cm.role = 'instructor'
        )
    )
    with check (
        exists (
            select 1 from submissions s
            join assignments a on a.id = s.assignment_id
            join class_members cm on cm.class_id = a.class_id
            where s.id = grades.submission_id
            and cm.user_id = auth.uid()
            and cm.role = 'instructor'
        )
    );
