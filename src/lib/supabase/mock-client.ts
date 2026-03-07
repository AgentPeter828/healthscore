/* eslint-disable @typescript-eslint/no-explicit-any */
// Mock Supabase client for local E2E testing
// Simulates Supabase query builder pattern with seed data

import {
  MOCK_USER,
  MOCK_PROFILE,
  MOCK_ORG,
  MOCK_ACCOUNTS,
  MOCK_ALERTS,
  MOCK_RENEWALS,
  MOCK_INTEGRATIONS,
  MOCK_PLAYBOOKS,
  MOCK_FORMULA,
  MOCK_HEALTH_SCORES,
  MOCK_HEALTH_SCORE_HISTORY,
  MOCK_CONTACTS,
  MOCK_NOTES,
  MOCK_SUBSCRIPTION,
} from "./mock-data";

type Row = Record<string, any>;

const TABLE_DATA: Record<string, Row[]> = {
  profiles: [MOCK_PROFILE],
  hs_organizations: [MOCK_ORG],
  hs_accounts: MOCK_ACCOUNTS,
  hs_alerts: MOCK_ALERTS,
  hs_renewals: MOCK_RENEWALS,
  hs_integrations: MOCK_INTEGRATIONS,
  hs_playbooks: MOCK_PLAYBOOKS,
  hs_health_score_formulas: [MOCK_FORMULA],
  hs_health_scores: MOCK_HEALTH_SCORES,
  hs_health_score_history: MOCK_HEALTH_SCORE_HISTORY,
  hs_contacts: MOCK_CONTACTS,
  hs_notes: MOCK_NOTES,
  subscriptions: [MOCK_SUBSCRIPTION],
};

class MockQueryBuilder {
  private rows: Row[];
  private _isSingle = false;
  private _limitCount: number | null = null;
  private _ascending = true;
  private _orderField: string | null = null;

  constructor(table: string) {
    this.rows = [...(TABLE_DATA[table] || [])];
  }

  select(_columns?: string): this { return this; }

  eq(field: string, value: any): this {
    this.rows = this.rows.filter((r) => r[field] === value);
    return this;
  }

  neq(field: string, value: any): this {
    this.rows = this.rows.filter((r) => r[field] !== value);
    return this;
  }

  gt(field: string, value: any): this {
    this.rows = this.rows.filter((r) => r[field] > value);
    return this;
  }

  gte(field: string, value: any): this {
    this.rows = this.rows.filter((r) => r[field] >= value);
    return this;
  }

  lt(field: string, value: any): this {
    this.rows = this.rows.filter((r) => r[field] < value);
    return this;
  }

  lte(field: string, value: any): this {
    this.rows = this.rows.filter((r) => r[field] <= value);
    return this;
  }

  in(field: string, values: any[]): this {
    this.rows = this.rows.filter((r) => values.includes(r[field]));
    return this;
  }

  is(field: string, value: any): this {
    this.rows = this.rows.filter((r) => r[field] === value);
    return this;
  }

  not(field: string, operator: string, value: any): this {
    if (operator === "eq") {
      this.rows = this.rows.filter((r) => r[field] !== value);
    }
    return this;
  }

  order(field: string, opts?: { ascending?: boolean }): this {
    this._orderField = field;
    this._ascending = opts?.ascending ?? true;
    return this;
  }

  limit(count: number): this {
    this._limitCount = count;
    return this;
  }

  single(): PromiseLike<{ data: any; error: any }> {
    this._isSingle = true;
    return this._resolve();
  }

  maybeSingle(): PromiseLike<{ data: any; error: any }> {
    this._isSingle = true;
    return this._resolve();
  }

  insert(data: any) {
    return {
      select: () => ({
        single: () => Promise.resolve({ data, error: null }),
      }),
      then: (resolve: any) => resolve({ data, error: null }),
    };
  }

  update(data: any) {
    return {
      eq: () => Promise.resolve({ data, error: null }),
      then: (resolve: any) => resolve({ data, error: null }),
    };
  }

  delete() {
    return {
      eq: () => Promise.resolve({ data: null, error: null }),
      then: (resolve: any) => resolve({ data: null, error: null }),
    };
  }

  upsert(data: any) {
    return {
      select: () => ({
        single: () => Promise.resolve({ data, error: null }),
      }),
      then: (resolve: any) => resolve({ data, error: null }),
    };
  }

  private _getResult(): { data: any; error: any } {
    let result = [...this.rows];

    if (this._orderField) {
      const field = this._orderField;
      const asc = this._ascending;
      result.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        if (aVal < bVal) return asc ? -1 : 1;
        if (aVal > bVal) return asc ? 1 : -1;
        return 0;
      });
    }

    if (this._limitCount !== null) {
      result = result.slice(0, this._limitCount);
    }

    if (this._isSingle) {
      return { data: result[0] || null, error: null };
    }
    return { data: result, error: null };
  }

  private _resolve(): PromiseLike<{ data: any; error: any }> {
    const result = this._getResult();
    return {
      then: (resolve: any, reject?: any) => {
        try {
          return Promise.resolve(resolve(result));
        } catch (e) {
          if (reject) return Promise.resolve(reject(e));
          throw e;
        }
      },
    };
  }

  // Make the query builder itself thenable (for await support)
  then(resolve: (result: { data: any; error: any }) => any, reject?: any): Promise<any> {
    try {
      const result = this._getResult();
      return Promise.resolve(resolve(result));
    } catch (e) {
      if (reject) return Promise.resolve(reject(e));
      return Promise.reject(e);
    }
  }
}

export function createMockClient() {
  return {
    auth: {
      getUser: async () => ({
        data: { user: MOCK_USER },
        error: null,
      }),
      getSession: async () => ({
        data: { session: { user: MOCK_USER, access_token: "mock_token" } },
        error: null,
      }),
      signUp: async () => ({ data: { user: MOCK_USER }, error: null }),
      signInWithPassword: async () => ({
        data: { user: MOCK_USER, session: { access_token: "mock_token" } },
        error: null,
      }),
      signInWithOAuth: async () => ({ data: { url: "/dashboard" }, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: (table: string) => new MockQueryBuilder(table),
  };
}
