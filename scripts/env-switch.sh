#!/bin/bash
# HealthScore — Environment Switch Script
# Usage: ./scripts/env-switch.sh [mock|test|prod]

set -e

ENV=${1:-mock}

case "$ENV" in
  mock)
    echo "Switching to MOCK environment..."
    cp .env.mock .env.local
    echo "Done. NEXT_PUBLIC_MOCK_DATA=true — mock data enabled."
    ;;
  test)
    echo "Switching to TEST environment..."
    cp .env.test .env.local
    echo "Done. NEXT_PUBLIC_MOCK_DATA=false — test keys required."
    ;;
  prod)
    echo "Switching to PRODUCTION environment..."
    if [ -f .env.production.local ]; then
      cp .env.production.local .env.local
      echo "Done. Production keys loaded."
    else
      echo "Error: .env.production.local not found. Create it with real keys first."
      exit 1
    fi
    ;;
  *)
    echo "Usage: ./scripts/env-switch.sh [mock|test|prod]"
    echo ""
    echo "  mock  — Use mock data (no external services needed)"
    echo "  test  — Use test keys (requires Supabase + Stripe test keys)"
    echo "  prod  — Use production keys (requires .env.production.local)"
    exit 1
    ;;
esac

echo ""
echo "Restart dev server: npm run dev"
