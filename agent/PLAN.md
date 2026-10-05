# Plan

## Current package migration

Use @devxcrew/framework 0.1.11 and @devxcrew/ui 0.2.0 through public exports.
Verify each existing consumer and fresh generated apps before release acceptance.
Keep browser, real SMTP and production deployment gates separate.


1. Completed: npm-only runtime and maintenance, isolated verification, and documented setup.
2. Run the revised GitHub workflow after the next authorized commit and push.
3. Verify configured bootstrap accounts and complete browser acceptance for Platform identity.
4. Add module-owned business capabilities only when requested.


## Current foundation alignment

The app now matches Cxsun’s foundation with its own name, port, SQLite path and release version.
Next: finish browser acceptance, existing-database upgrade evidence and production acceptance.
Do not add business modules as part of foundation alignment.
