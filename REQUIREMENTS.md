# 🧩 RolloutHQ (Feature Flag Dashboard) — Requirements Specification

## Table of Contents
1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [Data Model (Conceptual)](#5-data-model-conceptual)
6. [System Workflows](#6-system-workflows)
7. [Future Enhancements](#7-future-enhancements)
8. [Acceptance Criteria](#8-acceptance-criteria)

---

## 1. Introduction

### 1.1 Purpose
This document defines the functional and non-functional requirements for the **Feature Flag Dashboard**, a web-based application that enables teams to manage and monitor feature flags across environments and users.

### 1.2 Scope
The system is a **full-stack web project** with a **separate backend (API)** and **frontend (dashboard UI)**.

Goals:
- Support multiple **environments** (e.g., dev, staging, production)
- Allow **per-feature** and **per-user** configuration
- Expose a **client API** for flag evaluation
- Provide **role-based access control (RBAC)**
- Remain **stack-agnostic**, so it can be re-implemented with different languages/frameworks

### 1.3 Objectives
- Strengthen full-stack development skills.
- Practice designing APIs, data models, and environment-based configs.
- Build a portable architecture (React ↔ Next.js; Node/Express ↔ Java/Spring).

---

## 2. System Overview

### Components
1. **Frontend (Dashboard UI)**
   - Built with React (and later Next.js)
   - Displays features, environments, and toggles
   - Communicates via REST API

2. **Backend (REST API)**
   - Built with Node.js + Express (later portable to Java)
   - Provides endpoints for features, environments, users, and flag evaluation
   - Handles auth and role-based permissions

3. **Database**
   - Stores features, environments, users, and flag assignments
   - Supports relational queries and constraints

4. **Client Evaluation API**
   - External apps query this API to determine if a feature is enabled for a given user/environment

---

## 3. Functional Requirements

### 3.1 User Roles

| Role | Description | Permissions |
|------|--------------|--------------|
| **Admin** | Full access to create, edit, and toggle features; manage environments and users | CRUD |
| **Viewer** | Read-only access to view features and flags | Read-only |

### 3.2 Authentication
- Users log in with email and password
- Backend issues JWT on successful login
- Protected routes require valid JWT

### 3.3 Feature Management
- Admins can:
  - Create, edit, archive, or delete features
  - Toggle feature state per environment (`on`, `off`, `percentageRollout`)
- Feature attributes:
  - `id`, `key`, `name`, `description`, `createdAt`, `archived`

### 3.4 Environment Management
- Supports multiple environments (`dev`, `staging`, `prod`)
- Each environment has `id`, `key`, `name`
- Admins can add/remove environments

### 3.5 User Management
- Admins can invite/add users with specific roles
- Each user: `id`, `email`, `passwordHash`, `role`

### 3.6 Feature Flag Assignments
- Defines feature states per environment:
  - `state`: `"on" | "off" | "percentageRollout"`
  - `rolloutPct`: number (0–100)
- Optional per-user overrides

### 3.7 Client Evaluation Endpoint
Evaluation order:
1. User override  
2. Percentage rollout  
3. Default environment state

### 3.8 Real-Time Updates *(Optional)*
- Dashboards auto-update via WebSockets or SSE when feature states change.

### 3.9 Audit Logging *(Optional)*
- Log actions such as:
  - Who toggled what
  - Which environment
  - Timestamp

---

## 4. Non-Functional Requirements

| Category | Requirement |
|-----------|--------------|
| **Architecture** | Separate frontend & backend communicating via REST JSON |
| **Security** | JWT auth, password hashing (bcrypt), HTTPS in production |
| **Performance** | Evaluation endpoint <100 ms; dashboard load <1 s for <100 features |
| **Scalability** | Support multi-user and multi-environment setups |
| **Maintainability** | Modular code structure, consistent naming, environment configs |
| **Portability** | Re-implementable with other stacks (Next.js, Java/Spring) |

---

## 5. Data Model (Conceptual)

| Entity | Key Fields | Relationships |
|--------|-------------|---------------|
| **Feature** | id, key, name, description, archived | 1 → N FlagAssignments |
| **Environment** | id, key, name | 1 → N FlagAssignments |
| **User** | id, email, passwordHash, role | 1 → N UserOverrides |
| **FlagAssignment** | id, featureId, environmentId, state, rolloutPct | N → 1 Feature, Environment |
| **UserOverride** | id, featureId, environmentId, userId, state | N → 1 Feature, Environment, User |

---

## 6. System Workflows

### 6.1 Admin Toggles a Feature
1. Admin logs in  
2. Navigates to feature detail page  
3. Toggles environment flag  
4. Backend updates database and optionally emits WebSocket event  
5. UI updates instantly

### 6.2 Client App Evaluates a Feature
1. Client calls `/client/v1/evaluate`  
2. Backend checks UserOverride → PercentageRollout → Default  
3. Returns `{ enabled: true | false }`

---

## 7. Future Enhancements
- SDKs for multiple languages
- User segmentation (“beta testers”)
- Rollout analytics
- Third-party OAuth (Google, GitHub)
- Multi-tenant organizations

---

## 8. Acceptance Criteria
✅ Admin can log in and manage features per environment  
✅ Viewer can view features but not edit  
✅ Client evaluation returns correct state  
✅ Backend and frontend run as separate services  
✅ Optional realtime updates function correctly  

---