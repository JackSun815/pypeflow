# Tavus Solutions Engineer Take-Home Report

## 1. Project Summary
I built a Conversational Video Interview (CVI) feature directly inside my existing product, Pypeflow, instead of building a standalone demo.

The feature allows an SDR to click Practice with AI Prospect from a real scheduled meeting and instantly launch a Tavus-powered live video conversation with an AI prospect generated from that meeting context.

This is a production-style integration, not a toy prototype. It reflects a real workflow used by Pypeflow clients and demonstrates how Tavus can be embedded into an enterprise sales process.

## 2. Why I Chose This Project
### 2.1 Product-first decision
I chose to integrate Tavus into Pypeflow because:
- It is already a functioning app with authentic user workflows
- The SDR practice use case is immediately valuable to real users
- It proves Tavus value in context, where business systems and constraints already exist

### 2.2 Real use case fit
Pypeflow manages SDR meetings, contacts, and account context. That makes it an ideal surface for AI roleplay training because:
- A meeting already contains who the prospect is
- The workflow already has where and when training should happen
- The SDR can train in the exact context of a live upcoming meeting

### 2.3 Why this aligns with Tavus enterprise direction
From Tavus public positioning, I focused on these themes:
- Build conversational video agents with low-latency building blocks
- Deploy AI humans at scale for enterprise workflows
- Offer multiple adoption paths: APIs, embedded solutions, and managed integrations

My implementation intentionally demonstrates the Embedded solutions path while still using API-level control patterns that scale toward enterprise deployment.

## 3. Problem Statement
SDRs usually practice with static scripts, not realistic face-to-face simulations. This creates a gap between preparation and real meetings.

The goal of this project was to close that gap by enabling:
- One-click AI prospect roleplay from an actual scheduled meeting
- Real-time conversational video interaction
- Secure and scoped access to only the correct SDR context

## 4. Solution Overview
I added a new Tavus Practice flow to Pypeflow:
- SDR opens a meeting card
- Clicks Practice with AI Prospect
- Pypeflow calls a Supabase Edge Function
- Edge Function creates or reuses a valid Tavus conversation
- App renders the Tavus conversation URL in an embedded frame

I also implemented reliability guards for real-world behavior:
- Session reuse to avoid unnecessary duplicate conversation creation
- Validation against stale or deleted sessions
- Automatic re-launch if the room no longer exists
- Better error surfacing from edge function responses

## 5. Architecture
### 5.1 High-level system components
- Frontend: React + TypeScript + Vite
- Backend: Supabase Postgres + Supabase Edge Functions
- AI video layer: Tavus CVI API
- Data model: meetings + ai_practice_sessions

### 5.2 Data flow diagram
1) SDR clicks Practice with AI Prospect in Pypeflow UI
2) Frontend loads meeting record and validates access
3) Frontend invokes launch edge function with meeting id and optional SDR token
4) Edge function fetches meeting context and builds conversation prompt
5) Edge function creates Tavus conversation (or safely reuses active one)
6) Edge function stores session metadata in ai_practice_sessions
7) Frontend receives conversation_url and opens Tavus call in embedded frame
8) Tavus webhook updates session status events in Supabase
9) Frontend auto-recovers from stale room errors by relaunching

### 5.3 Architecture sketch
User (SDR)
  -> Pypeflow React app
  -> Supabase Edge Function (launch-tavus-practice)
  -> Tavus Conversations API
  -> returns conversation_url
  -> Embedded Tavus video session in app

Parallel event path:
Tavus callbacks
  -> Supabase Edge Function (tavus-webhook)
  -> ai_practice_sessions table updates

## 6. Technical Stack Used
### 6.1 Application stack
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router

### 6.2 Backend and infrastructure
- Supabase Postgres
- Supabase Row-Level Security patterns
- Supabase Edge Functions (Deno runtime)

### 6.3 Tavus integration
- Tavus Conversations API
- Persona-based conversational context
- Custom greeting and meeting-specific prompt construction

## 7. Implementation Decisions and Thought Process
### 7.1 Embed into an existing workflow, not a blank canvas
I deliberately built this inside a production-style app to show:
- How Tavus fits into existing enterprise software
- How quickly teams can add human-like AI touchpoints without rebuilding their product

### 7.2 Meeting-driven prompt design
I generate conversation context from actual meeting data:
- Contact identity
- Company and role
- Notes and background
- Seller account context

This keeps roleplay grounded and realistic for SDR practice.

### 7.3 Identity lock for role fidelity
One challenge in AI roleplay is role drift. I added explicit identity-lock instructions so the AI consistently behaves as the prospect, not as the seller.

### 7.4 Reliability and operational resilience
I added safeguards for enterprise reliability:
- Reuse active sessions to avoid unnecessary cost and concurrency pressure
- Validate session freshness to avoid stale-room failures
- Recover automatically from no-room errors without forcing user refresh

## 8. Enterprise Relevance
This pattern can be adapted beyond SDR training into enterprise use cases where AI humans are deployed at scale:
- Sales enablement and roleplay simulation
- Customer onboarding and guided setup
- Internal training and policy coaching
- Support triage and escalation handoff
- Partner enablement and product education

What makes this enterprise-ready in principle:
- Built around existing business workflows
- API-driven orchestration
- Controlled access and scoped context
- Operational fallback handling

## 9. Demo Environment and Walkthrough
I set up a demo environment with seeded meeting data so reviewers can test realistic scenarios quickly.

### 9.1 Demo steps
1. Log in to Pypeflow demo account
2. Navigate to SDR dashboard
3. Open any seeded meeting card
4. Click Practice with AI Prospect
5. Observe Tavus conversation launch inside the app
6. Test objection handling and discovery flow live with the AI prospect

### 9.2 Suggested screenshots for submission
- Screenshot 1: Meeting card with Practice button
- Screenshot 2: Practice session loading state
- Screenshot 3: Active Tavus conversation in embedded view
- Screenshot 4: Edge function / architecture view (optional)

## 10. Results and What This Demonstrates
This project demonstrates that Tavus can be integrated as a native enterprise feature, not just a demo endpoint.

It validates:
- Product embedding strategy
- Real-time conversational video interaction in a business workflow
- Operational handling needed for production-like reliability
- A clear path from prototype to broader enterprise deployment

## 11. If I Had More Time
If given additional time, I would expand this in four directions:

### 11.1 Persona controls and scenario tuning
- Multiple prospect personas (friendly, neutral, skeptical, aggressive)
- Adjustable objection intensity
- Industry-specific roleplay templates

### 11.2 Evaluation and scoring
- Automated SDR scorecards (discovery depth, clarity, objection handling)
- Coaching feedback after each session
- Trend reporting over repeated practice runs

### 11.3 Enterprise admin and governance
- Team-level configuration for allowed personas and scenarios
- Audit dashboards for usage, performance, and quality
- Fine-grained access controls for business-unit deployments

### 11.4 Scale and integrations
- CRM sync for account-based practice scenarios
- Programmatic scenario generation from pipeline data
- Batch campaign orchestration for enablement teams

## 12. Closing
I chose this project because it reflects how Tavus creates practical enterprise value: a seamless human-AI interaction layer embedded directly into existing business workflows.

Instead of building an isolated demo, I focused on a realistic integration that shows product thinking, technical execution, and a clear path to scale.
