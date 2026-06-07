// Curated package taxonomy for the stack analysis. Maps a dependency to its function, whether
// it's a self-hosted library or a managed-service SDK (build-vs-buy), and whether the product is
// itself a YC company (dogfooding). Hand-maintained — covers the high-signal packages across the
// TS/JS, Python, Go and Rust ecosystems; unknown deps are simply ignored by the analysis.

export type Host = 'self' | 'managed';
export interface DepInfo { cat: string; label: string; host?: Host; yc?: boolean }

// category -> display label + order
export const CATEGORIES: [string, string][] = [
  ['ai', 'AI / LLM'], ['auth', 'Auth'], ['database', 'Database / ORM'], ['queue', 'Queue / jobs'],
  ['cron', 'Scheduling'], ['api', 'API / framework'], ['ui', 'UI components'], ['styling', 'Styling'],
  ['validation', 'Validation'], ['payments', 'Payments'], ['email', 'Email'],
  ['observability', 'Observability'], ['analytics', 'Analytics'], ['hosting', 'Hosting / infra SDK'],
  ['testing', 'Testing'], ['build', 'Build / tooling'],
];

// exact-name matches
const EXACT: Record<string, DepInfo> = {
  // auth — self
  'next-auth': { cat: 'auth', label: 'NextAuth', host: 'self' }, '@auth/core': { cat: 'auth', label: 'NextAuth', host: 'self' },
  'lucia': { cat: 'auth', label: 'Lucia', host: 'self' }, 'better-auth': { cat: 'auth', label: 'Better Auth', host: 'self' },
  'passport': { cat: 'auth', label: 'Passport', host: 'self' }, 'jsonwebtoken': { cat: 'auth', label: 'JWT', host: 'self' },
  'bcrypt': { cat: 'auth', label: 'bcrypt', host: 'self' }, 'argon2': { cat: 'auth', label: 'argon2', host: 'self' },
  'authlib': { cat: 'auth', label: 'Authlib', host: 'self' }, 'pyjwt': { cat: 'auth', label: 'PyJWT', host: 'self' },
  'python-jose': { cat: 'auth', label: 'python-jose', host: 'self' }, 'django-allauth': { cat: 'auth', label: 'django-allauth', host: 'self' },
  'supertokens-node': { cat: 'auth', label: 'SuperTokens', host: 'self' },
  // auth — managed
  'auth0': { cat: 'auth', label: 'Auth0', host: 'managed' }, 'firebase-admin': { cat: 'auth', label: 'Firebase', host: 'managed' },
  // database / ORM — self
  'prisma': { cat: 'database', label: 'Prisma', host: 'self' }, '@prisma/client': { cat: 'database', label: 'Prisma', host: 'self' },
  'drizzle-orm': { cat: 'database', label: 'Drizzle', host: 'self' }, 'kysely': { cat: 'database', label: 'Kysely', host: 'self' },
  'typeorm': { cat: 'database', label: 'TypeORM', host: 'self' }, 'sequelize': { cat: 'database', label: 'Sequelize', host: 'self' },
  'mongoose': { cat: 'database', label: 'Mongoose', host: 'self' }, 'pg': { cat: 'database', label: 'node-postgres', host: 'self' },
  'postgres': { cat: 'database', label: 'postgres.js', host: 'self' }, 'mysql2': { cat: 'database', label: 'mysql2', host: 'self' },
  'redis': { cat: 'database', label: 'Redis', host: 'self' }, 'ioredis': { cat: 'database', label: 'Redis', host: 'self' },
  'sqlalchemy': { cat: 'database', label: 'SQLAlchemy', host: 'self' }, 'psycopg2': { cat: 'database', label: 'psycopg', host: 'self' },
  'psycopg2-binary': { cat: 'database', label: 'psycopg', host: 'self' }, 'asyncpg': { cat: 'database', label: 'asyncpg', host: 'self' },
  'sqlmodel': { cat: 'database', label: 'SQLModel', host: 'self' }, 'gorm.io/gorm': { cat: 'database', label: 'GORM', host: 'self' },
  'diesel': { cat: 'database', label: 'Diesel', host: 'self' }, 'sqlx': { cat: 'database', label: 'sqlx', host: 'self' },
  'sea-orm': { cat: 'database', label: 'SeaORM', host: 'self' }, 'mongodb': { cat: 'database', label: 'MongoDB', host: 'self' },
  // database — managed (YC where applicable)
  '@supabase/supabase-js': { cat: 'database', label: 'Supabase', host: 'managed', yc: true },
  '@neondatabase/serverless': { cat: 'database', label: 'Neon', host: 'managed' },
  '@planetscale/database': { cat: 'database', label: 'PlanetScale', host: 'managed' },
  '@upstash/redis': { cat: 'database', label: 'Upstash', host: 'managed' }, '@libsql/client': { cat: 'database', label: 'Turso', host: 'managed' },
  // queue / jobs
  'bullmq': { cat: 'queue', label: 'BullMQ', host: 'self' }, 'bull': { cat: 'queue', label: 'Bull', host: 'self' },
  'bee-queue': { cat: 'queue', label: 'Bee-Queue', host: 'self' }, 'graphile-worker': { cat: 'queue', label: 'Graphile Worker', host: 'self' },
  'celery': { cat: 'queue', label: 'Celery', host: 'self' }, 'rq': { cat: 'queue', label: 'RQ', host: 'self' },
  'sidekiq': { cat: 'queue', label: 'Sidekiq', host: 'self' }, 'github.com/hibiken/asynq': { cat: 'queue', label: 'Asynq', host: 'self' },
  'inngest': { cat: 'queue', label: 'Inngest', host: 'managed', yc: true },
  // cron / scheduling
  'node-cron': { cat: 'cron', label: 'node-cron', host: 'self' }, 'croner': { cat: 'cron', label: 'Croner', host: 'self' },
  'cron': { cat: 'cron', label: 'cron', host: 'self' }, 'agenda': { cat: 'cron', label: 'Agenda', host: 'self' },
  'apscheduler': { cat: 'cron', label: 'APScheduler', host: 'self' }, 'node-schedule': { cat: 'cron', label: 'node-schedule', host: 'self' },
  // api / framework
  'express': { cat: 'api', label: 'Express', host: 'self' }, 'fastify': { cat: 'api', label: 'Fastify', host: 'self' },
  'hono': { cat: 'api', label: 'Hono', host: 'self' }, 'koa': { cat: 'api', label: 'Koa', host: 'self' },
  'next': { cat: 'api', label: 'Next.js', host: 'self' }, 'nuxt': { cat: 'api', label: 'Nuxt', host: 'self' },
  'fastapi': { cat: 'api', label: 'FastAPI', host: 'self' }, 'flask': { cat: 'api', label: 'Flask', host: 'self' },
  'django': { cat: 'api', label: 'Django', host: 'self' }, 'uvicorn': { cat: 'api', label: 'Uvicorn', host: 'self' },
  'github.com/gin-gonic/gin': { cat: 'api', label: 'Gin', host: 'self' }, 'github.com/labstack/echo/v4': { cat: 'api', label: 'Echo', host: 'self' },
  'github.com/gofiber/fiber/v2': { cat: 'api', label: 'Fiber', host: 'self' }, 'axum': { cat: 'api', label: 'Axum', host: 'self' },
  'actix-web': { cat: 'api', label: 'Actix', host: 'self' }, 'graphql': { cat: 'api', label: 'GraphQL', host: 'self' },
  // ui
  'react': { cat: 'ui', label: 'React', host: 'self' }, 'vue': { cat: 'ui', label: 'Vue', host: 'self' },
  'svelte': { cat: 'ui', label: 'Svelte', host: 'self' }, 'solid-js': { cat: 'ui', label: 'Solid', host: 'self' },
  '@mui/material': { cat: 'ui', label: 'MUI', host: 'self' }, '@chakra-ui/react': { cat: 'ui', label: 'Chakra', host: 'self' },
  '@mantine/core': { cat: 'ui', label: 'Mantine', host: 'self' }, 'antd': { cat: 'ui', label: 'Ant Design', host: 'self' },
  'lucide-react': { cat: 'ui', label: 'Lucide', host: 'self' }, 'framer-motion': { cat: 'ui', label: 'Framer Motion', host: 'self' },
  // styling
  'tailwindcss': { cat: 'styling', label: 'Tailwind', host: 'self' }, 'styled-components': { cat: 'styling', label: 'styled-components', host: 'self' },
  '@emotion/react': { cat: 'styling', label: 'Emotion', host: 'self' }, 'sass': { cat: 'styling', label: 'Sass', host: 'self' },
  'unocss': { cat: 'styling', label: 'UnoCSS', host: 'self' }, 'tailwind-variants': { cat: 'styling', label: 'Tailwind', host: 'self' },
  // validation
  'zod': { cat: 'validation', label: 'Zod', host: 'self' }, 'yup': { cat: 'validation', label: 'Yup', host: 'self' },
  'valibot': { cat: 'validation', label: 'Valibot', host: 'self' }, 'joi': { cat: 'validation', label: 'Joi', host: 'self' },
  'pydantic': { cat: 'validation', label: 'Pydantic', host: 'self' }, 'class-validator': { cat: 'validation', label: 'class-validator', host: 'self' },
  'ajv': { cat: 'validation', label: 'Ajv', host: 'self' }, 'serde': { cat: 'validation', label: 'serde', host: 'self' },
  // payments
  'stripe': { cat: 'payments', label: 'Stripe', host: 'managed' }, '@stripe/stripe-js': { cat: 'payments', label: 'Stripe', host: 'managed' },
  '@paddle/paddle-js': { cat: 'payments', label: 'Paddle', host: 'managed' }, 'lemonsqueezy.ts': { cat: 'payments', label: 'Lemon Squeezy', host: 'managed' },
  // email
  'resend': { cat: 'email', label: 'Resend', host: 'managed', yc: true }, '@sendgrid/mail': { cat: 'email', label: 'SendGrid', host: 'managed' },
  'nodemailer': { cat: 'email', label: 'Nodemailer', host: 'self' }, 'postmark': { cat: 'email', label: 'Postmark', host: 'managed' },
  'react-email': { cat: 'email', label: 'React Email', host: 'self', yc: true }, '@react-email/components': { cat: 'email', label: 'React Email', host: 'self', yc: true },
  // observability
  '@sentry/node': { cat: 'observability', label: 'Sentry', host: 'managed' }, '@sentry/react': { cat: 'observability', label: 'Sentry', host: 'managed' },
  '@sentry/nextjs': { cat: 'observability', label: 'Sentry', host: 'managed' }, 'sentry-sdk': { cat: 'observability', label: 'Sentry', host: 'managed' },
  'pino': { cat: 'observability', label: 'Pino', host: 'self' }, 'winston': { cat: 'observability', label: 'Winston', host: 'self' },
  // analytics
  'posthog-js': { cat: 'analytics', label: 'PostHog', host: 'managed', yc: true }, 'posthog-node': { cat: 'analytics', label: 'PostHog', host: 'managed', yc: true },
  'posthog': { cat: 'analytics', label: 'PostHog', host: 'managed', yc: true }, '@vercel/analytics': { cat: 'analytics', label: 'Vercel Analytics', host: 'managed' },
  'mixpanel': { cat: 'analytics', label: 'Mixpanel', host: 'managed' },
  // hosting / infra SDK
  'wrangler': { cat: 'hosting', label: 'Cloudflare', host: 'managed' }, '@vercel/node': { cat: 'hosting', label: 'Vercel', host: 'managed' },
  // testing
  'vitest': { cat: 'testing', label: 'Vitest', host: 'self' }, 'jest': { cat: 'testing', label: 'Jest', host: 'self' },
  '@playwright/test': { cat: 'testing', label: 'Playwright', host: 'self' }, 'playwright': { cat: 'testing', label: 'Playwright', host: 'self' },
  'cypress': { cat: 'testing', label: 'Cypress', host: 'self' }, 'pytest': { cat: 'testing', label: 'pytest', host: 'self' },
  '@testing-library/react': { cat: 'testing', label: 'Testing Library', host: 'self' },
  // build / tooling
  'turbo': { cat: 'build', label: 'Turborepo', host: 'self' }, 'nx': { cat: 'build', label: 'Nx', host: 'self' },
  'vite': { cat: 'build', label: 'Vite', host: 'self' }, 'esbuild': { cat: 'build', label: 'esbuild', host: 'self' },
  'tsup': { cat: 'build', label: 'tsup', host: 'self' }, 'webpack': { cat: 'build', label: 'webpack', host: 'self' },
  '@biomejs/biome': { cat: 'build', label: 'Biome', host: 'self' }, 'eslint': { cat: 'build', label: 'ESLint', host: 'self' },
  'prettier': { cat: 'build', label: 'Prettier', host: 'self' }, 'typescript': { cat: 'build', label: 'TypeScript', host: 'self' },
  'ruff': { cat: 'build', label: 'Ruff', host: 'self' }, 'tsx': { cat: 'build', label: 'tsx', host: 'self' },
};

// prefix rules for scoped/family packages (checked after exact)
const PREFIX: [string, DepInfo][] = [
  ['@clerk/', { cat: 'auth', label: 'Clerk', host: 'managed', yc: true }],
  ['@workos-inc/', { cat: 'auth', label: 'WorkOS', host: 'managed' }],
  ['@stytch/', { cat: 'auth', label: 'Stytch', host: 'managed' }],
  ['@auth0/', { cat: 'auth', label: 'Auth0', host: 'managed' }],
  ['@descope/', { cat: 'auth', label: 'Descope', host: 'managed' }],
  ['@kinde-oss/', { cat: 'auth', label: 'Kinde', host: 'managed' }],
  ['@propelauth/', { cat: 'auth', label: 'PropelAuth', host: 'managed' }],
  ['@supabase/', { cat: 'database', label: 'Supabase', host: 'managed', yc: true }],
  ['@trigger.dev/', { cat: 'queue', label: 'Trigger.dev', host: 'managed', yc: true }],
  ['@inngest/', { cat: 'queue', label: 'Inngest', host: 'managed', yc: true }],
  ['@aws-sdk/', { cat: 'hosting', label: 'AWS', host: 'managed' }],
  ['@google-cloud/', { cat: 'hosting', label: 'Google Cloud', host: 'managed' }],
  ['@azure/', { cat: 'hosting', label: 'Azure', host: 'managed' }],
  ['@cloudflare/', { cat: 'hosting', label: 'Cloudflare', host: 'managed' }],
  ['@vercel/', { cat: 'hosting', label: 'Vercel', host: 'managed' }],
  ['@radix-ui/', { cat: 'ui', label: 'Radix UI', host: 'self' }],
  ['@headlessui/', { cat: 'ui', label: 'Headless UI', host: 'self' }],
  ['@tanstack/', { cat: 'ui', label: 'TanStack', host: 'self' }],
  ['@trpc/', { cat: 'api', label: 'tRPC', host: 'self' }],
  ['@apollo/', { cat: 'api', label: 'Apollo', host: 'self' }],
  ['@sentry/', { cat: 'observability', label: 'Sentry', host: 'managed' }],
  ['@opentelemetry/', { cat: 'observability', label: 'OpenTelemetry', host: 'self' }],
  ['@ai-sdk/', { cat: 'ai', label: 'Vercel AI SDK', host: 'self' }],
  ['@anthropic-ai/', { cat: 'ai', label: 'Anthropic', host: 'managed' }],
  ['@langchain/', { cat: 'ai', label: 'LangChain', host: 'self' }],
  ['@react-email/', { cat: 'email', label: 'React Email', host: 'self', yc: true }],
];

const EXACT_AI: Record<string, DepInfo> = {
  openai: { cat: 'ai', label: 'OpenAI', host: 'managed' }, anthropic: { cat: 'ai', label: 'Anthropic', host: 'managed' },
  ai: { cat: 'ai', label: 'Vercel AI SDK', host: 'self' }, langchain: { cat: 'ai', label: 'LangChain', host: 'self' },
  'langchain-core': { cat: 'ai', label: 'LangChain', host: 'self' }, llamaindex: { cat: 'ai', label: 'LlamaIndex', host: 'self' },
  'llama-index': { cat: 'ai', label: 'LlamaIndex', host: 'self' }, ollama: { cat: 'ai', label: 'Ollama', host: 'self', yc: true },
  litellm: { cat: 'ai', label: 'LiteLLM', host: 'self', yc: true }, instructor: { cat: 'ai', label: 'Instructor', host: 'self' },
  transformers: { cat: 'ai', label: 'Transformers', host: 'self' }, 'pgvector': { cat: 'database', label: 'pgvector', host: 'self' },
};

export function classify(pkg: string): DepInfo | null {
  const p = pkg.toLowerCase();
  if (EXACT[pkg]) return EXACT[pkg];
  if (EXACT[p]) return EXACT[p];
  if (EXACT_AI[p]) return EXACT_AI[p];
  for (const [pre, info] of PREFIX) if (pkg.startsWith(pre)) return info;
  return null;
}
