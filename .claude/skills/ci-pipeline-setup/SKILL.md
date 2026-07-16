---
description: Sets up a GitHub Actions workflow that runs lint/typecheck/test on every PR. Use when establishing or modifying CI for this repo.
disable-model-invocation: true
---

## Instructions

1. Gate merges on lint, typecheck, and `trpc-procedure-test`/`rls-isolation-test` suites passing — don't add steps that aren't actually enforced (a non-blocking CI check gives false confidence).
2. Run against the Turborepo workspace (`monorepo-scaffold`) using Turborepo's caching so CI stays fast as the codebase grows.
3. Keep secrets (Suno key, Stripe test key, Supabase service role) in GitHub Actions secrets, never hardcoded in the workflow file — coordinate with `secrets-env-audit`.
4. Netlify's own Deploy Preview handles the deploy step (`netlify-deploy-config`); this workflow is for checks, not deployment.

## References

- `research/tech-stack.md` Section 4 (CI/CD approach)
- [GitHub Actions](https://docs.github.com/en/actions)
