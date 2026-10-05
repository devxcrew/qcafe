# Plan

## Current package migration

Use @devxcrew/framework 0.1.8 and @devxcrew/ui 0.2.0 through public exports.
Verify each existing consumer and fresh generated apps before release acceptance.
Keep browser, real SMTP and production deployment gates separate.


1. Completed: npm-only runtime and maintenance, isolated verification, and documented setup.
2. Run the revised GitHub workflow after the next authorized commit and push.
3. Connect real identity, RBAC, and tenancy through Platform Core when available.
4. Add module-owned business capabilities only when requested.
