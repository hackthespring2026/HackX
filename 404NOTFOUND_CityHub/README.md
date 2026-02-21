# 🏙️ CityHub — One Platform for City-Based Communities

CityHub is a full-stack civic-tech platform that unifies scattered local communities into one organised, democratic, and discoverable digital space.
It replaces fragmented tools like WhatsApp, Google Forms, and Meetup with a single structured system designed specifically for real-world community collaboration. 

---

## 🚀 Overview

Modern city communities exist across disconnected apps, making them hard to discover, manage, and sustain.
CityHub solves this by providing a unified platform where residents can find groups, participate in events, and govern communities collaboratively. 

---

## ❗ Problem Statement

Today’s community infrastructure is broken:

* Communities are hidden in private chats and invite links. 
* A single admin controls access, decisions, and communication. 
* Events and knowledge disappear with no persistent history. 
* New residents struggle to discover local groups. 

This fragmentation leads to exclusion, burnout for organisers, and loss of civic engagement. 

---

## ✅ Solution

CityHub provides:

* 🔍 Public community discovery across a city
* 🗳️ Majority-based membership approval (no gatekeeping)
* 🗺️ A city-wide activity memory map
* 👥 Shared leadership with role-based governance
* 💬 Structured in-app communication replacing chat chaos

It acts as a hybrid of **Discord + Meetup + Civic Governance**, purpose-built for local communities. 

---

## 🧩 Core Features

### 👤 User Profiles

* Interest-based profiles to help communities evaluate intent.
* OAuth login (Google/GitHub) and editable personal details. 

### 🏘️ Group Creation & Discovery

* Anyone can create a group with tags, description, and visibility settings.
* Searchable discovery feed for all public groups in a city. 

### ⚖️ Democratic Governance

* Two roles: **Member** and **Manager**.
* Groups with >3 members must maintain at least 2 managers to prevent centralised control. 

### ✍️ Intent-Based Join Requests

* Users submit a short purpose statement before joining.
* Helps filter spam and encourage meaningful participation. 

### 🗳️ Majority Voting System

* Join approvals require ≥50% manager votes (tie = approve).
* Ensures fairness and transparency. 

### 💬 Structured Communication

* Channel-based messaging: Announcements, Planning, Feedback, etc.
* Real-time updates powered by Convex subscriptions. 

### 🗺️ Activity Map (City Memory Layer)

* Interactive map showing past and upcoming events across the city.
* Creates a persistent civic history of community activity. 

### 📊 Built-in Polls & Feedback

* Native polls eliminate external Google Forms.
* Results stored permanently with group history. 

---

## 🛠️ Tech Stack

| Layer      | Technology           | Purpose                               |
| ---------- | -------------------- | ------------------------------------- |
| Frontend   | Next.js 14           | SSR + fast discovery experience       |
| UI         | Tailwind + shadcn/ui | Accessible design system              |
| Backend    | Convex               | Real-time database + serverless logic |
| Auth       | BetterAuth           | OAuth + secure sessions               |
| Maps       | ShadCN Maps          | Activity visualization                |
| Payments   | RazorPay             | Subscription & billing                |
| Deployment | Vercel               | Global CDN & CI/CD                    |

These tools replace traditional REST + DB + WebSocket stacks with a real-time serverless architecture. 

---

## 🏗️ Architecture

CityHub uses Convex as both database and backend runtime, enabling live updates without manual WebSocket infrastructure.
Actions like voting, messaging, or event creation sync instantly across all clients. 

---

## 💰 Monetisation Model

**Freemium Approach**

### Free Tier

* Create/join communities
* Up to 50 members per group
* Limited channels and history 

### Pro Tier (via Polar)

* Unlimited groups, members, and channels
* Full activity map history
* Analytics and custom URLs 

---

## 🎯 Target Users

* **Community Discoverers** — People looking to connect locally
* **Community Builders** — Organisers managing interest groups
* **Active Members** — Participants wanting structured collaboration 

---
Key AI Capabilities

📝 Proposal Summarization
Converts long proposals into clear summaries, impact points, and risk hints — helping members make informed decisions faster.

📊 Governance Health Insights
Detects participation drops, inactive leadership, or centralization risks and suggests corrective actions.

🗳 Voting Pattern Analysis
Identifies disagreement trends or delayed decisions and encourages discussion before governance stalls.

🗺 Event Recap Generation
Automatically creates short summaries of completed events, preserving the city’s collective activity history.

💬 Discussion Summaries
Generates TL;DRs and action items from long planning threads to reduce communication overload.

🎯 Smart Recommendations
Suggests governance improvements like adding managers, creating polls, or re-engaging members.

---

## 📊 Success Metrics

CityHub measures success through **real engagement**, not vanity metrics:

* Group creation across pilot cities
* Join-request approval rates
* Weekly member interaction
* Event participation and retention 

---

## 🚧 Roadmap (v1.0)

1. Authentication & platform foundation
2. Group discovery & profiles
3. Democratic governance workflows
4. Real-time communication channels
5. Event map integration
6. Feedback & polling system
7. Payment integration & beta launch 

---

## 🔐 Non-Functional Goals

* <1.5s page load on mobile networks
* Real-time updates under 500ms
* WCAG 2.1 accessible UI
* Secure OAuth + role-based access validation 

---

## 📌 Out of Scope (v1.0)

* Native mobile apps
* Video/voice calling
* Cross-city federation
* AI summarisation features 

---

## 🌆 Vision

Cities are not just infrastructure — they are networks of people.
CityHub provides the digital foundation for communities to be **discoverable, democratic, and enduring**. 

---

## 🧑‍💻 Getting Started (Development)

```bash
# Clone repository
git clone https://github.com/your-username/cityhub.git

# Install dependencies
npm install

# Run development server
npm run dev

