-- ==============================================================================
-- PRFlow Supabase Database Initialization Script
-- Designed to be run directly in the Supabase SQL Editor
-- ==============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    github_id VARCHAR(64) UNIQUE,
    github_username VARCHAR(100),
    avatar_url VARCHAR(500),
    github_access_token VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS ix_users_id ON public.users(id);
CREATE INDEX IF NOT EXISTS ix_users_github_id ON public.users(github_id);

-- 2. REPOSITORIES TABLE
CREATE TABLE IF NOT EXISTS public.repositories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    github_repo_id INTEGER,
    owner VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    default_branch VARCHAR(100) DEFAULT 'main',
    description VARCHAR(500),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    last_synced_at TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT uq_repositories_user_github_repo_id UNIQUE (user_id, github_repo_id)
);

CREATE INDEX IF NOT EXISTS ix_repositories_id ON public.repositories(id);
CREATE INDEX IF NOT EXISTS ix_repositories_github_repo_id ON public.repositories(github_repo_id);

-- 3. REVIEWERS TABLE
CREATE TABLE IF NOT EXISTS public.reviewers (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    pending_reviews INTEGER DEFAULT 0,
    completed_reviews INTEGER DEFAULT 0,
    avg_review_time_hours INTEGER DEFAULT 0,
    workload_score INTEGER DEFAULT 0,
    capacity INTEGER DEFAULT 5,
    last_review_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_reviewers_id ON public.reviewers(id);

-- 4. PULL REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.pull_requests (
    id SERIAL PRIMARY KEY,
    repository_id INTEGER NOT NULL REFERENCES public.repositories(id) ON DELETE CASCADE,
    github_pr_number INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    author VARCHAR(100),
    status VARCHAR(50) DEFAULT 'open',
    priority_score INTEGER DEFAULT 0,
    priority_level VARCHAR(20) DEFAULT 'Low',
    priority_breakdown JSONB,
    review_count INTEGER DEFAULT 0,
    blocked_count INTEGER DEFAULT 0,
    is_blocking BOOLEAN DEFAULT FALSE,
    merge_conflict BOOLEAN DEFAULT FALSE,
    failing_checks BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    merged_at TIMESTAMP WITHOUT TIME ZONE,
    closed_at TIMESTAMP WITHOUT TIME ZONE,
    first_review_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS ix_pull_requests_id ON public.pull_requests(id);
CREATE INDEX IF NOT EXISTS ix_pull_requests_repository_id ON public.pull_requests(repository_id);
CREATE INDEX IF NOT EXISTS ix_pull_requests_priority_score ON public.pull_requests(priority_score);

-- 5. PR REVIEWERS TABLE (Requested Reviewers)
CREATE TABLE IF NOT EXISTS public.pr_reviewers (
    id SERIAL PRIMARY KEY,
    pull_request_id INTEGER NOT NULL REFERENCES public.pull_requests(id) ON DELETE CASCADE,
    reviewer_id INTEGER NOT NULL REFERENCES public.reviewers(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'requested',
    assigned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_pr_reviewers_id ON public.pr_reviewers(id);

-- 6. PR REVIEWS TABLE (Submitted Review Events)
CREATE TABLE IF NOT EXISTS public.pr_reviews (
    id SERIAL PRIMARY KEY,
    pull_request_id INTEGER NOT NULL REFERENCES public.pull_requests(id) ON DELETE CASCADE,
    reviewer_username VARCHAR(100),
    state VARCHAR(30),
    submitted_at TIMESTAMP WITHOUT TIME ZONE,
    fetched_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_pr_reviews_id ON public.pr_reviews(id);

-- 7. DEPENDENCIES TABLE
CREATE TABLE IF NOT EXISTS public.dependencies (
    id SERIAL PRIMARY KEY,
    source_pr_id INTEGER NOT NULL REFERENCES public.pull_requests(id) ON DELETE CASCADE,
    target_pr_id INTEGER NOT NULL REFERENCES public.pull_requests(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) DEFAULT 'manual',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_dependencies_id ON public.dependencies(id);

-- 8. ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'warning',
    title VARCHAR(255) NOT NULL,
    message TEXT,
    pull_request_id INTEGER REFERENCES public.pull_requests(id) ON DELETE SET NULL,
    reviewer_id INTEGER REFERENCES public.reviewers(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_alerts_id ON public.alerts(id);
CREATE INDEX IF NOT EXISTS ix_alerts_user_id ON public.alerts(user_id);

