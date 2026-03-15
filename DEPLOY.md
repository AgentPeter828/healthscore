# HealthScore — Deployment Guide

## Prerequisites
1. Supabase project created
2. Stripe account with products/prices for 4 tiers
3. OpenAI or Anthropic API key
4. Resend account (email)
5. Domain pointed to Vercel
6. GitHub repo connected to Vercel

## Step 1: Supabase Setup
1. Create new Supabase project (or use existing: `moxmjxjwviklewfdzdcf`)
2. Run migration: `supabase/migrations/001_initial_schema.sql`
3. Copy: Project URL, anon key, service role key

## Step 2: Stripe Setup
1. Create 3 products in Stripe Dashboard:
   - Starter ($49/mo) → copy Price ID
   - Growth ($99/mo) → copy Price ID
   - Scale ($199/mo) → copy Price ID
2. Create webhook endpoint: `https://yourdomain.com/api/billing/webhook`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.paid`
4. Copy: Secret key, publishable key, webhook signing secret, 3 price IDs

## Step 3: Vercel Deployment
1. Connect GitHub repo: `AgentPeter828/healthscore`
2. Set all environment variables from `.env.example`
3. Set `NEXT_PUBLIC_MOCK_DATA=false`
4. Deploy

## Step 4: Post-Deploy Verification
1. Visit homepage — marketing pages load
2. Sign up for free account
3. Add a test customer account
4. Check health score calculation
5. Run churn prediction on a customer
6. Create a playbook
7. Upgrade to Starter via Stripe checkout
8. Verify webhook fires and plan updates

## Environment Variables (Vercel)
See `.env.example` for the full list.

## Vercel Cron
`vercel.json` configures daily renewal checks at 9:00 AM UTC.
Set `CRON_SECRET` in Vercel env.
