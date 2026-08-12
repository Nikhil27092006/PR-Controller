// Mock backend database for PRFlow Intelligence platform

export const MOCK_PRS = [
  {
    id: '4521',
    title: 'Migrate core authentication database layer to Redis',
    repo: 'vercel/next.js',
    author: 'Sam Rivera',
    avatar: 'SR',
    priority: 'Critical',
    priorityScore: 98,
    status: 'Blocked',
    age: '4d ago',
    reviewCount: 3,
    branch: 'feature/db-redis',
    baseBranch: 'main',
    additions: 421,
    deletions: 112,
    reviewers: ['Alex Chen', 'Riley Morgan', 'Casey Mills'],
    ciStatus: 'failed',
    desc: 'Upgrades user lookup speed by caching primary JWT schemas inside Redis. Blocked by upstream database migration PR #4498.',
    dependencies: {
      blocking: ['4498'],
      blocked: ['4509', '4512']
    }
  },
  {
    id: '4498',
    title: 'Implement enterprise SSO security tokens via OAuth2',
    repo: 'facebook/react',
    author: 'Alex Chen',
    avatar: 'AC',
    priority: 'High',
    priorityScore: 87,
    status: 'Reviewing',
    age: '2d ago',
    reviewCount: 2,
    branch: 'security/sso-oauth2',
    baseBranch: 'main',
    additions: 890,
    deletions: 24,
    reviewers: ['Riley Morgan', 'Taylor Nguyen'],
    ciStatus: 'success',
    desc: 'Sets up organization-level single-sign-on hooks. Blocks Redis DB migration PR #4521.',
    dependencies: {
      blocking: ['4489'],
      blocked: ['4521']
    }
  },
  {
    id: '4509',
    title: 'Refactor state manager render buffers & canvas overlays',
    repo: 'vercel/next.js',
    author: 'Jordan Park',
    avatar: 'JP',
    priority: 'Medium',
    priorityScore: 76,
    status: 'In Progress',
    age: '1d ago',
    reviewCount: 1,
    branch: 'refactor/render-buffers',
    baseBranch: 'main',
    additions: 120,
    deletions: 340,
    reviewers: ['Casey Mills'],
    ciStatus: 'success',
    desc: 'Cleans up legacy layout calculations in standard browser overlay modules. Blocked by PR #4521.',
    dependencies: {
      blocking: ['4521'],
      blocked: []
    }
  },
  {
    id: '4512',
    title: 'Rollout progressive rendering feature flags',
    repo: 'fastapi/fastapi',
    author: 'Casey Mills',
    avatar: 'CM',
    priority: 'Medium',
    priorityScore: 63,
    status: 'Reviewing',
    age: '3d ago',
    reviewCount: 0,
    branch: 'release/ff-rendering',
    baseBranch: 'main',
    additions: 45,
    deletions: 8,
    reviewers: ['Taylor Nguyen'],
    ciStatus: 'success',
    desc: 'Enables gradual release of layout updates. Blocked by PR #4521.',
    dependencies: {
      blocking: ['4521'],
      blocked: []
    }
  },
  {
    id: '4489',
    title: 'Add inline documentation & type definitions',
    repo: 'facebook/react',
    author: 'Taylor Nguyen',
    avatar: 'TN',
    priority: 'Low',
    priorityScore: 51,
    status: 'Ready',
    age: 'Just now',
    reviewCount: 4,
    branch: 'docs/types-update',
    baseBranch: 'main',
    additions: 512,
    deletions: 0,
    reviewers: ['Alex Chen', 'Casey Mills', 'Sam Rivera'],
    ciStatus: 'success',
    desc: 'Fills docstring slots in user profiles and auth contexts. Blocks SSO PR #4498.',
    dependencies: {
      blocking: [],
      blocked: ['4498']
    }
  },
  {
    id: '4452',
    title: 'Setup background worker scheduler threads',
    repo: 'fastapi/fastapi',
    author: 'Riley Morgan',
    avatar: 'RM',
    priority: 'High',
    priorityScore: 82,
    status: 'Merged',
    age: '5d ago',
    reviewCount: 3,
    branch: 'feature/bg-scheduler',
    baseBranch: 'main',
    additions: 312,
    deletions: 98,
    reviewers: ['Sam Rivera', 'Alex Chen'],
    ciStatus: 'success',
    desc: 'Configures cron schedules for repository metadata syncing.',
    dependencies: {
      blocking: [],
      blocked: []
    }
  }
]

export const MOCK_PR_DETAILS = {
  '4521': {
    ...MOCK_PRS[0],
    priorityBreakdown: [
      { factor: 'Blocking Depth', weight: 'High', score: 35, desc: 'Blocks 2 downstream PRs (#4509, #4512)' },
      { factor: 'Queue Latency', weight: 'Medium', score: 25, desc: 'Awaiting review for 4 days' },
      { factor: 'Reviewer Load', weight: 'High', score: 23, desc: 'Assignees have high workloads (Alex: 94%)' },
      { factor: 'Business Criticality', weight: 'Medium', score: 15, desc: 'Affects auth infrastructure performance' }
    ],
    ciRuns: [
      { name: 'Unit Tests (Jest)', status: 'success', duration: '2m 14s' },
      { name: 'Linter (ESLint)', status: 'success', duration: '45s' },
      { name: 'Build compilation', status: 'success', duration: '1m 20s' },
      { name: 'Security Audit (SonarQube)', status: 'failed', duration: '3m 5s', error: 'JWT token extraction leaks logs' }
    ],
    timeline: [
      { type: 'create', user: 'Sam Rivera', avatar: 'SR', action: 'opened this pull request', date: '4 days ago' },
      { type: 'ci', name: 'GitHub Actions', action: 'build failed on SonarQube audit', date: '4 days ago', status: 'failed' },
      { type: 'comment', user: 'Alex Chen', avatar: 'AC', action: 'commented', text: 'This looks good, but let\'s review the database lockups. Redis could block events if connections aren\'t closed properly.', date: '3 days ago' },
      { type: 'block', action: 'marked as blocked by PR #4498', date: '2 days ago' },
      { type: 'review', user: 'Riley Morgan', avatar: 'RM', action: 'requested changes', text: 'Tests are failing on security audits. Check line #114 in auth.js', date: '1 day ago' }
    ]
  },
  '4498': {
    ...MOCK_PRS[1],
    priorityBreakdown: [
      { factor: 'Blocking Depth', weight: 'High', score: 40, desc: 'Blocks critical DB migration PR #4521' },
      { factor: 'Queue Latency', weight: 'Low', score: 15, desc: 'Awaiting review for 2 days' },
      { factor: 'Reviewer Load', weight: 'Medium', score: 18, desc: 'Assignees are busy' },
      { factor: 'Business Criticality', weight: 'High', score: 14, desc: 'Enterprise security integration' }
    ],
    ciRuns: [
      { name: 'Unit Tests (Jest)', status: 'success', duration: '4m 10s' },
      { name: 'Linter (ESLint)', status: 'success', duration: '50s' },
      { name: 'Build compilation', status: 'success', duration: '2m 15s' }
    ],
    timeline: [
      { type: 'create', user: 'Alex Chen', avatar: 'AC', action: 'opened this pull request', date: '2 days ago' },
      { type: 'ci', name: 'GitHub Actions', action: 'all checks passed', date: '2 days ago', status: 'success' },
      { type: 'review', user: 'Riley Morgan', avatar: 'RM', action: 'approved changes', text: 'Clean code, security compliance checks out.', date: '1 day ago' }
    ]
  }
}

export const MOCK_DEPENDENCY_NETWORK = {
  nodes: [
    { id: '4489', label: 'PR #4489', status: 'Ready', priority: 'Low', color: '#34d399', x: 200, y: 150 },
    { id: '4498', label: 'PR #4498', status: 'Reviewing', priority: 'High', color: '#60a5fa', x: 400, y: 150 },
    { id: '4521', label: 'PR #4521', status: 'Blocked', priority: 'Critical', color: '#fbbf24', x: 600, y: 150 },
    { id: '4509', label: 'PR #4509', status: 'In Progress', priority: 'Medium', color: '#a855f7', x: 800, y: 100 },
    { id: '4512', label: 'PR #4512', status: 'Reviewing', priority: 'Medium', color: '#22d3ee', x: 800, y: 200 }
  ],
  links: [
    { source: '4489', target: '4498', type: 'blocks', label: 'OAuth requirements' },
    { source: '4498', target: '4521', type: 'blocks', label: 'SSO configuration' },
    { source: '4521', target: '4509', type: 'blocks', label: 'Redis dependencies' },
    { source: '4521', target: '4512', type: 'blocks', label: 'Rollout config' }
  ]
}

export const MOCK_REVIEWERS = [
  { initials: 'AC', name: 'Alex Chen', role: 'Senior Engineer', load: 94, pending: 5, timeMetric: '1.2h avg response', status: 'overloaded' },
  { initials: 'SR', name: 'Sam Rivera', role: 'Staff Engineer', load: 42, pending: 2, timeMetric: '4.8h avg response', status: 'available' },
  { initials: 'JP', name: 'Jordan Park', role: 'Tech Lead', load: 73, pending: 4, timeMetric: '3.1h avg response', status: 'busy' },
  { initials: 'RM', name: 'Riley Morgan', role: 'Senior Engineer', load: 97, pending: 6, timeMetric: '0.8h avg response', status: 'overloaded' },
  { initials: 'CM', name: 'Casey Mills', role: 'Engineer II', load: 28, pending: 1, timeMetric: '5.2h avg response', status: 'available' },
  { initials: 'TN', name: 'Taylor Nguyen', role: 'Principal Eng', load: 61, pending: 3, timeMetric: '2.4h avg response', status: 'busy' }
]

export const MOCK_RECOMMENDATIONS = [
  { prId: '4521', fromReviewer: 'Alex Chen', toReviewer: 'Sam Rivera', reason: 'Sam has 42% workload vs Alex\'s 94% overload, and possesses context on Redis caches.' },
  { prId: '4498', fromReviewer: 'Riley Morgan', toReviewer: 'Casey Mills', reason: 'Casey has 28% workload and reviewed previous OAuth modules.' }
]

export const MOCK_BOTTLENECK_REPORT = {
  critical_bottleneck: 4521,
  blocked_prs: 3,
  blocked_pr_ids: [4521, 4509, 4512],
  impact_score: 95,
  longest_chain_pr: 4509,
  longest_chain_depth: 3,
  highest_impact_pr: 4521,
  highest_impact_cascade: 2,
  bottleneck_score: 72,
  chain_details: [
    { pr_id: 4489, is_root: true,  fan_out: 1, label: 'Docs & Types' },
    { pr_id: 4498, is_root: false, fan_out: 1, label: 'SSO OAuth2' },
    { pr_id: 4521, is_root: false, fan_out: 2, label: 'Redis Migration' },
    { pr_id: 4509, is_root: false, fan_out: 0, label: 'Render Buffers' },
  ],
  top_blockers: [
    { pr_id: 4521, cascade_size: 2, chain_depth: 2, fan_out: 2, is_root: false, score: 98.0, title: 'Migrate core authentication to Redis' },
    { pr_id: 4498, cascade_size: 3, chain_depth: 1, fan_out: 1, is_root: false, score: 87.0, title: 'Enterprise SSO security tokens' },
    { pr_id: 4489, cascade_size: 4, chain_depth: 0, fan_out: 1, is_root: true,  score: 82.0, title: 'Inline docs & type definitions' },
    { pr_id: 4509, cascade_size: 0, chain_depth: 3, fan_out: 0, is_root: false, score: 44.0, title: 'Refactor render buffers' },
    { pr_id: 4512, cascade_size: 0, chain_depth: 2, fan_out: 0, is_root: false, score: 38.0, title: 'Progressive rendering feature flags' },
  ],
  trend: [
    { week: 'W1', blocked: 2, score: 45 },
    { week: 'W2', blocked: 3, score: 58 },
    { week: 'W3', blocked: 5, score: 64 },
    { week: 'W4', blocked: 7, score: 78 },
    { week: 'W5', blocked: 4, score: 61 },
    { week: 'W6', blocked: 3, score: 72 },
  ]
}

export const MOCK_PRIORITY_SCORES = {
  ranked_prs: [
    {
      rank: 1, pr_id: 4489, priority_score: 97,
      factors: { cascade_size: 4, chain_depth: 0, age_days: 0, reviewer_load: 0.61, ci_failing: false, business_critical: false,
        sub_scores: { cascade: 34, depth: 20, age: 0, reviewer: 7, ci: 0, business: 0 } }
    },
    {
      rank: 2, pr_id: 4521, priority_score: 92,
      factors: { cascade_size: 2, chain_depth: 2, age_days: 4, reviewer_load: 0.94, ci_failing: true, business_critical: true,
        sub_scores: { cascade: 24, depth: 13, age: 11, reviewer: 11, ci: 8, business: 7 } }
    },
    {
      rank: 3, pr_id: 4498, priority_score: 84,
      factors: { cascade_size: 3, chain_depth: 1, age_days: 2, reviewer_load: 0.42, ci_failing: false, business_critical: true,
        sub_scores: { cascade: 30, depth: 16, age: 7, reviewer: 5, ci: 0, business: 7 } }
    },
    {
      rank: 4, pr_id: 4512, priority_score: 51,
      factors: { cascade_size: 0, chain_depth: 2, age_days: 3, reviewer_load: 0.28, ci_failing: false, business_critical: false,
        sub_scores: { cascade: 0, depth: 13, age: 10, reviewer: 3, ci: 0, business: 0 } }
    },
    {
      rank: 5, pr_id: 4509, priority_score: 44,
      factors: { cascade_size: 0, chain_depth: 3, age_days: 1, reviewer_load: 0.73, ci_failing: false, business_critical: false,
        sub_scores: { cascade: 0, depth: 7, age: 5, reviewer: 9, ci: 0, business: 0 } }
    },
  ],
  merge_order: [4489, 4498, 4521, 4509, 4512],
  summary: { total_prs: 5, max_score: 97, min_score: 44, avg_score: 74, critical_count: 2, high_count: 1, medium_count: 1, low_count: 1 }
}

export const MOCK_ANALYTICS = {
  reviewTimeTrend: [
    { week: 'W1', value: 12.4 }, { week: 'W2', value: 10.8 }, { week: 'W3', value: 15.2 },
    { week: 'W4', value: 18.9 }, { week: 'W5', value: 14.1 }, { week: 'W6', value: 9.8 }
  ],
  mergeTimeTrend: [
    { week: 'W1', value: 24.5 }, { week: 'W2', value: 22.1 }, { week: 'W3', value: 31.0 },
    { week: 'W4', value: 38.4 }, { week: 'W5', value: 29.8 }, { week: 'W6', value: 18.2 }
  ],
  prCreationClosed: [
    { week: 'W1', created: 24, closed: 20 },
    { week: 'W2', created: 30, closed: 28 },
    { week: 'W3', created: 18, closed: 15 },
    { week: 'W4', created: 42, closed: 30 },
    { week: 'W5', created: 35, closed: 38 },
    { week: 'W6', created: 28, closed: 31 }
  ],
  blockersTrend: [
    { week: 'W1', count: 4 }, { week: 'W2', count: 3 }, { week: 'W3', count: 7 },
    { week: 'W4', count: 9 }, { week: 'W5', count: 5 }, { week: 'W6', count: 2 }
  ]
}
