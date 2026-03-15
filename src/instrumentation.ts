export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.SENTRY_DSN) {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge" && process.env.SENTRY_DSN) {
    await import("../sentry.edge.config");
  }
}

export async function onRequestError(
  ...args: unknown[]
) {
  if (process.env.SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs");
    // @ts-expect-error - dynamic import typing
    Sentry.captureRequestError(...args);
  }
}
