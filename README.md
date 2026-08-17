# Pull Request Traffic Controller

> A workflow intelligence platform that analyzes GitHub Pull Requests, identifies dependency bottlenecks, calculates PR priority, monitors reviewer workload, and provides engineering workflow health metrics through a full-stack dashboard.

## Overview

The **Pull Request Traffic Controller (PRTC)** is a full-stack engineering workflow intelligence platform built to go beyond traditional GitHub PR management.

GitHub provides information about pull requests, reviews, checks, labels, and repository activity. However, engineering teams still need to determine:

* Which PR should be reviewed first?
* Which PRs are becoming bottlenecks?
* Which PR is blocking other work?
* Which reviewers have excessive workload?
* Which PRs require immediate attention?
* How healthy is the overall development workflow?

PRTC collects GitHub repository and Pull Request data, stores it in a relational database, analyzes the workflow using rule-based algorithms, and presents the results through an interactive React dashboard.

---

## Key Features

### 1. GitHub Integration

The system integrates with the GitHub REST API to retrieve repository and Pull Request information.

It can retrieve information such as:

* Repository metadata
* Pull Request number
* Pull Request title
* Pull Request description
* Author
* Creation date
* Open/closed state
* Labels
* Review information
* Merge conflicts
* CI/check information

The GitHub API acts as the primary external data source.

---

### 2. Automated Repository Synchronization

The backend contains a synchronization service that periodically retrieves GitHub data and stores it locally.

The synchronization flow is:

```text
GitHub API
     ↓
GitHub Service
     ↓
Sync Service
     ↓
Database
     ↓
Analysis Services
     ↓
Dashboard
```

This prevents the dashboard from directly depending on GitHub API calls for every request.

---

### 3. Pull Request Priority Engine

Each Pull Request receives a priority score based on multiple workflow factors.

The scoring system considers factors such as:

* PR age
* Pending reviews
* Merge conflicts
* Failing CI/CD checks
* Blocking dependencies
* PR labels

Example:

```text
PR #221

Priority Score: 92
Priority Level: Critical
```

Higher-impact PRs receive higher scores and are surfaced to the engineering team.

---

### 4. Dependency Analysis

PRTC can identify dependencies mentioned inside Pull Request descriptions.

For example:

```text
This PR depends on #120
```

The dependency analyzer extracts:

```text
120
```

and creates a relationship between the Pull Requests.

The resulting dependency graph can look like:

```text
PR #120
   ↓
PR #135
   ↓
PR #148
```

If PR #120 is delayed, downstream PRs may also be delayed.

This allows the system to identify potential workflow bottlenecks.

---

### 5. Bottleneck Detection

A Pull Request becomes particularly important when it blocks multiple downstream Pull Requests.

Example:

```text
             ┌──→ PR #135
             │
PR #120 ─────┤
             │
             └──→ PR #148
```

Here, PR #120 affects two downstream PRs.

The system can use this dependency information to calculate the PR's blocking impact and increase its priority.

---

### 6. Reviewer Workload Analysis

The system analyzes reviewer assignments and workload distribution.

Example:

```text
Reviewer A → 15 PRs
Reviewer B →  4 PRs
Reviewer C →  2 PRs
```

A significant workload imbalance can indicate a review bottleneck.

The reviewer analysis helps identify overloaded reviewers and potential review delays.

---

### 7. Workflow Health Dashboard

The React dashboard provides an overview of repository workflow health.

It can display metrics such as:

* Total Pull Requests
* Critical Pull Requests
* Blocked Pull Requests
* Connected Repositories
* Review metrics
* Merge metrics
* Repository health
* Priority distribution
* Workflow bottlenecks

The dashboard consumes data from FastAPI endpoints rather than directly querying GitHub.

---

### 8. Authentication

The application supports user authentication using:

* JWT authentication
* Password hashing
* Login
* Registration
* Current-user authentication
* Protected application routes

Authentication separates user access from the underlying GitHub integration and application data.

---

### 9. Background Synchronization

The application includes scheduled synchronization functionality.

The scheduler can trigger operations such as:

```text
Repository Sync
       ↓
Pull Request Sync
       ↓
Priority Refresh
```

This allows the database to remain updated without requiring a user to manually refresh GitHub data every time.

---

# System Architecture

```text
                     ┌──────────────────┐
                     │     GitHub       │
                     │    REST API      │
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │ GitHub Service   │
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │   Sync Service   │
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │    Database      │
                     │                  │
                     │ Users            │
                     │ Repositories     │
                     │ Pull Requests    │
                     │ Dependencies     │
                     │ Reviewers        │
                     └────────┬─────────┘
                              │
               ┌──────────────┼──────────────┐
               │              │              │
               ▼              ▼              ▼
        ┌────────────┐ ┌────────────┐ ┌─────────────┐
        │ Priority   │ │ Dependency │ │  Reviewer   │
        │  Engine    │ │  Analyzer  │ │  Analyzer   │
        └──────┬─────┘ └──────┬─────┘ └──────┬──────┘
               │              │              │
               └──────────────┼──────────────┘
                              ▼
                     ┌──────────────────┐
                     │    FastAPI       │
                     │   REST API       │
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │      React       │
                     │    Dashboard     │
                     └──────────────────┘
```

---

# Priority Scoring

The priority engine uses a rule-based scoring system.

Example rules include:

| Factor          | Condition  | Score |
| --------------- | ---------- | ----: |
| PR Age          | 0–2 days   |   +10 |
| PR Age          | 3–5 days   |   +20 |
| PR Age          | 6–10 days  |   +40 |
| PR Age          | 10+ days   |   +60 |
| Pending Reviews | 1 review   |   +10 |
| Pending Reviews | 2 reviews  |   +20 |
| Pending Reviews | 3+ reviews |   +30 |
| Merge Conflict  | Present    |   +50 |
| Failing CI/CD   | Present    |   +40 |
| Blocking PR     | Present    |  +100 |
| Urgent Label    | Present    |   +80 |
| Bug Label       | Present    |   +50 |
| Security Label  | Present    |  +100 |

The final score is converted into a priority level such as:

```text
Critical
High
Medium
Low
```

The exact scoring rules are implemented in the backend priority engine.

---

# Dependency Detection

The dependency analyzer currently detects dependency references from Pull Request descriptions.

Supported patterns include:

```text
depends on #123
blocked by #123
requires #123
```

For example:

```text
This PR depends on #123
```

produces:

```python
[123]
```

The extracted PR number can then be mapped to an existing Pull Request in the database.

The important point is that **dependency detection is based on Pull Request relationships, not Pull Request titles**.

---

# Bottleneck Detection

The bottleneck system uses the dependency graph.

Consider:

```text
PR #100
   ↓
PR #110
   ↓
PR #120
```

If PR #100 remains unresolved:

```text
PR #110 → blocked
PR #120 → indirectly affected
```

The system can calculate the downstream impact of PR #100.

A PR that blocks multiple other PRs receives greater importance in the priority calculation.

This transforms the system from a simple PR dashboard into a workflow analysis tool.

---

# Technology Stack

## Backend

* Python
* FastAPI
* SQLAlchemy
* Pydantic
* JWT
* bcrypt/password hashing
* Requests
* APScheduler

## Database

Development:

* SQLite

Production-ready option:

* PostgreSQL

Database models include:

```text
User
Repository
PullRequest
Dependency
Reviewer
```

## Frontend

* React
* JavaScript
* React Router
* Vite
* CSS
* REST API integration

## External Integration

* GitHub REST API
* GitHub Personal Access Token

---

# Project Structure

```text
project/
│
├── backend/
│   │
│   ├── app/
│   │   ├── core/
│   │   │   └── security.py
│   │   │
│   │   ├── config/
│   │   │   └── settings.py
│   │   │
│   │   ├── database/
│   │   │   ├── base.py
│   │   │   ├── db.py
│   │   │   └── session.py
│   │   │
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── repository.py
│   │   │   ├── pull_request.py
│   │   │   ├── dependency.py
│   │   │   └── reviewer.py
│   │   │
│   │   ├── routes/
│   │   │   ├── auth_routes.py
│   │   │   ├── dashboard_routes.py
│   │   │   ├── repository_routes.py
│   │   │   └── pr_routes.py
│   │   │
│   │   ├── services/
│   │   │   ├── github_service.py
│   │   │   ├── sync_service.py
│   │   │   ├── pr_service.py
│   │   │   ├── priority_service.py
│   │   │   ├── repository_service.py
│   │   │   ├── dashboard_service.py
│   │   │   ├── dependency_service.py
│   │   │   └── reviewer_service.py
│   │   │
│   │   └── main.py
│   │
│   ├── scheduler/
│   │   └── sync_jobs.py
│   │
│   ├── requirements.txt
│   ├── .env
│   └── .gitignore
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── store/
│   └── App.jsx
│
├── package.json
└── README.md
```

---

# Installation

## 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/pull-request-traffic-controller.git

cd pull-request-traffic-controller
```

---

# Backend Setup

## 2. Create Virtual Environment

Windows:

```bash
cd backend

python -m venv venv

venv\Scripts\activate
```

Linux/macOS:

```bash
python3 -m venv venv

source venv/bin/activate
```

---

## 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 4. Configure Environment Variables

Create:

```text
backend/.env
```

Example:

```env
GITHUB_TOKEN=your_github_token

DATABASE_URL=sqlite:///./app.db

SECRET_KEY=your_secret_key

ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Do **not** commit the `.env` file.

---

# GitHub Token

The application requires a GitHub access token to communicate with the GitHub API.

The token should be stored in the environment configuration rather than hard-coded into the source code.

Example:

```env
GITHUB_TOKEN=github_token_here
```

Make sure your token has only the permissions required by the application.

---

# Run Backend

From the `backend` directory:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

---

# Frontend Setup

From the project root/frontend directory:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

The frontend communicates with the FastAPI backend through the configured API base URL.

---

# Data Synchronization

The normal data flow is:

```text
GitHub Repository
       ↓
GitHub API
       ↓
GitHubService
       ↓
SyncService
       ↓
Repository Database Record
       ↓
Pull Request Database Record
       ↓
Dependency Analysis
       ↓
Priority Calculation
       ↓
Dashboard
```

The dashboard reads analyzed data from the database rather than making GitHub API requests every time the dashboard is opened.

---

# API Overview

Important endpoints include:

```text
POST /auth/register
POST /auth/login
GET  /auth/me

GET  /dashboard

GET  /repositories
POST /repositories
DELETE /repositories/{id}

GET  /prs
GET  /prs/{id}
```

The exact available endpoints depend on the current backend route configuration.

FastAPI's interactive API documentation can be used to inspect all registered endpoints:

```text
/docs
```

---

# Example Workflow

A typical workflow looks like this:

### 1. User authenticates

```text
Register/Login
      ↓
JWT Token
```

### 2. Repository is connected

```text
GitHub Repository
      ↓
Repository Record
```

### 3. Synchronization runs

```text
GitHub
  ↓
Repositories
  ↓
Pull Requests
  ↓
Database
```

### 4. PR analysis occurs

```text
Pull Request
     ↓
Priority Engine
     ↓
Dependency Analyzer
     ↓
Reviewer Analysis
```

### 5. Dashboard displays results

```text
Critical PRs
Blocked PRs
Reviewer Workload
Repository Health
Workflow Bottlenecks
```

---

# Security Considerations

The application uses authentication and environment variables for sensitive configuration.

Important security practices:

* Never commit GitHub tokens.
* Never commit JWT secrets.
* Keep `.env` in `.gitignore`.
* Use strong production secrets.
* Use HTTPS in production.
* Restrict GitHub token permissions.
* Validate API input.
* Implement proper authentication on protected endpoints.
* Use PostgreSQL for production deployments.
* Configure CORS for trusted frontend origins instead of using `*` in production.

---

# Development vs Production

The project can run locally using:

```text
SQLite
+
FastAPI development server
+
React/Vite development server
```

For production deployment, the architecture should use:

```text
React frontend
       ↓
Production web server/CDN

FastAPI backend
       ↓
PostgreSQL
       ↓
GitHub API
```

Additional production infrastructure can include:

* Docker
* Docker Compose
* PostgreSQL
* Alembic migrations
* HTTPS
* Reverse proxy
* CI/CD
* Automated tests
* Centralized logging
* Monitoring
* Rate-limit handling
* Secret management

---

# Why This Project?

Traditional student applications often focus on CRUD operations:

```text
Create
Read
Update
Delete
```

PRTC focuses on **engineering workflow analysis**.

The system doesn't simply display GitHub Pull Requests. It analyzes relationships and workflow signals to determine which engineering work requires attention.

The project combines:

* External API integration
* Backend architecture
* Database modeling
* Authentication
* Scheduling
* Rule-based algorithms
* Graph-based dependency analysis
* Workload analysis
* Full-stack development

---

# Engineering Problems Solved

### Problem 1 — Too many open PRs

Solution:

```text
Priority Scoring
```

PRs are ranked according to their workflow impact.

### Problem 2 — Dependency chains

Solution:

```text
Dependency Graph
```

The system identifies relationships between PRs and evaluates downstream impact.

### Problem 3 — Reviewer overload

Solution:

```text
Reviewer Workload Analysis
```

Reviewer assignments are analyzed to identify workload imbalance.

### Problem 4 — Hidden workflow bottlenecks

Solution:

```text
Bottleneck Detection
```

The system identifies PRs whose unresolved state affects downstream work.

### Problem 5 — Lack of workflow visibility

Solution:

```text
Engineering Workflow Dashboard
```

Important metrics are consolidated into a single interface.

---

# Limitations

The current dependency detection relies on recognizable dependency references in Pull Request descriptions, such as:

```text
Depends on #123
Blocked by #123
Requires #123
```

Therefore, dependencies that are not explicitly mentioned may not be detected.

Future versions can improve dependency detection using:

* GitHub linked issues
* Branch relationships
* Commit relationships
* GitHub dependency metadata
* Code-level dependency analysis
* Machine-learning-based workflow prediction

---

# Future Improvements

Potential future improvements include:

* GitHub Webhooks for event-driven synchronization
* PostgreSQL production deployment
* Alembic database migrations
* Dockerized deployment
* Advanced dependency inference
* Review delay prediction
* ML-based priority prediction
* Advanced repository health scoring
* Slack/Teams notifications
* Email alerts
* GitHub App authentication
* Advanced analytics
* Historical workflow trend analysis
* CI/CD integration
* Automated testing
* Observability and monitoring

---

# Resume Description

**Pull Request Traffic Controller**

> Built a full-stack workflow intelligence platform integrating GitHub REST APIs to analyze Pull Requests, detect dependency bottlenecks, prioritize critical engineering work, and monitor reviewer workload distribution.

> Designed the system using FastAPI, SQLAlchemy, React, and GitHub APIs with automated repository synchronization, rule-based priority scoring, dependency graph analysis, authentication, scheduled background processing, and engineering workflow dashboards.

---

# Interview Explanation

If asked:

### "What does your project do?"

A concise explanation:

> Pull Request Traffic Controller is a workflow intelligence platform built on top of GitHub. Instead of simply displaying Pull Requests, it analyzes their age, reviews, CI status, conflicts, dependencies, and blocking impact to determine which PRs require attention first.

### "How do you get Pull Requests?"

> The backend communicates with the GitHub REST API using an authenticated GitHub token. The GitHub service retrieves repository and Pull Request data, and the synchronization service stores the relevant information in the database.

### "How do you detect dependencies?"

> The current implementation analyzes Pull Request descriptions for references such as "depends on #123" or "blocked by #123". Those references are converted into relationships between Pull Requests and stored in the dependency table.

### "How do you find bottlenecks?"

> The system models dependencies as a directed graph. If one PR is blocking multiple downstream PRs, its downstream impact increases. That impact can contribute to its priority score, allowing the dashboard to surface workflow bottlenecks.

### "How is priority calculated?"

> The priority engine uses multiple signals including PR age, pending reviews, merge conflicts, CI failures, dependency impact, and labels. Each rule contributes points to the PR's score, which is then mapped to a priority level.

### "Why not just use GitHub directly?"

> GitHub provides the raw workflow data, but it doesn't provide the application's combined workflow intelligence. PRTC creates an analysis layer on top of GitHub that ranks work, models dependencies, identifies bottlenecks, and provides aggregated engineering health metrics.

---

# Project Highlights

```text
✓ GitHub REST API Integration
✓ Automated Repository Synchronization
✓ Pull Request Synchronization
✓ Priority Scoring Engine
✓ Dependency Detection
✓ Dependency Graph Modeling
✓ Bottleneck Detection
✓ Reviewer Workload Analysis
✓ JWT Authentication
✓ Database Persistence
✓ Background Scheduling
✓ FastAPI REST API
✓ React Dashboard
✓ API-driven Dashboard
✓ Workflow Analytics
```

---

# Author

**Your Name**

GitHub: `https://github.com/YOUR_USERNAME`

LinkedIn: `https://linkedin.com/in/YOUR_PROFILE`

---

# License

This project is available for educational and portfolio purposes.
