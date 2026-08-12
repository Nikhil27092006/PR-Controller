# PR Controller

## Overview

PR Controller is an intelligent Pull Request management and analytics platform designed to help engineering teams reduce review bottlenecks, prioritize critical pull requests, analyze reviewer workload, and improve repository health.

The system integrates with GitHub repositories, continuously synchronizes pull request data, performs automated analysis, and presents actionable insights through a modern dashboard.

---

## Features

### Pull Request Prioritization

Automatically ranks pull requests using factors such as:

* PR age
* Pending reviews
* Merge conflicts
* Failing CI/CD checks
* Blocking dependencies
* Labels (Bug, Security, Urgent)

### Dependency Analysis

Detects PR dependencies directly from pull request descriptions.

Examples:

* Depends on #15
* Blocked by #20
* Requires #30

### Bottleneck Detection

Identifies pull requests that block the largest number of dependent PRs.

### Reviewer Analytics

Tracks:

* Pending review load
* Completed reviews
* Average review time
* Reviewer workload scores

### Repository Health Monitoring

Calculates repository health based on:

* Open pull requests
* Critical pull requests
* Stale pull requests
* Dependency bottlenecks

### GitHub Integration

Synchronizes data directly from GitHub using the GitHub REST API.

### Automated Background Sync

Uses APScheduler to periodically:

* Sync repositories
* Sync pull requests
* Refresh priority scores
* Update analytics

---

## System Architecture

GitHub Repository

↓

GitHub API

↓

FastAPI Backend

↓

PostgreSQL Database

↓

Analysis Engine

↓

Dashboard UI

---

## Tech Stack

### Backend

* FastAPI
* SQLAlchemy
* PostgreSQL
* APScheduler
* Requests

### Analysis Engine

* Custom Priority Engine
* Dependency Analyzer
* Bottleneck Analyzer
* Reviewer Analyzer
* Repository Health Analyzer

### Frontend

* React
* JavaScript
* CSS

### Infrastructure

* Docker
* GitHub API

---

## Project Structure

```text
app/

├── analyzers/
├── config/
├── constants/
├── database/
├── models/
├── routes/
├── scheduler/
├── schemas/
├── services/
├── utils/
└── main.py
```

---

## Installation

### Clone Repository

```bash
git clone <repository-url>
cd pr-controller
```

### Create Virtual Environment

```bash
python -m venv venv
```

### Activate Environment

Windows:

```bash
venv\Scripts\activate
```

Linux/Mac:

```bash
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Environment Variables

Create a `.env` file:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/pr_controller

GITHUB_TOKEN=your_github_token

SYNC_INTERVAL_MINUTES=10
```

---

## Database Setup

Create PostgreSQL database:

```sql
CREATE DATABASE pr_controller;
```

---

## Run Application

```bash
uvicorn app.main:app --reload
```

Application:

```text
http://localhost:8000
```

Swagger Documentation:

```text
http://localhost:8000/docs
```

ReDoc:

```text
http://localhost:8000/redoc
```

---

## API Modules

### Dashboard API

Provides:

* Repository health
* Critical PR counts
* Review metrics
* Team analytics

### Pull Request API

Provides:

* PR listing
* Priority scores
* Search and filtering

### Dependency API

Provides:

* Dependency detection
* Dependency graph generation

### Reviewer API

Provides:

* Reviewer workload analytics
* Review distribution metrics

### Repository API

Provides:

* Repository synchronization
* Repository metadata

---

## Analysis Components

### Priority Engine

Calculates priority scores for pull requests.

### Dependency Analyzer

Extracts dependency relationships from pull request descriptions.

### Bottleneck Analyzer

Detects pull requests blocking the largest amount of work.

### Reviewer Analyzer

Measures reviewer workload and capacity.

### Health Analyzer

Calculates repository health scores.

---

## Future Enhancements

* Machine Learning-based priority prediction
* GitHub Webhook support
* Slack integration
* Microsoft Teams integration
* AI-generated PR summaries
* Predictive bottleneck detection
* Team performance forecasting

---

## License

This project is intended for educational, research, and engineering productivity purposes.

---

## Author

PR Controller Development Team
