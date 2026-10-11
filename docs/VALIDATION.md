# Validation and deployment status

Validated in the cloud workspace on October 11, 2026, with Node.js 24.19.0 and Chromium 154.

- Frozen installation: `npm ci --cache /workspace/.npm-cache` passed.
- Type checking and production build: passed. The build generates an offline precache for all emitted assets.
- Domain suite: **19 passed**.
- Browser suite: **10 passed**, covering purchases, subscriptions, linked savings and goal completion, calendar events, search, backups, preferences, narrow layouts, and offline reload after the first online visit.
- Automated accessibility: no violations in the tested dark core views/entry dialog and light overview under the WCAG A/AA rule selection. This is an automated check, not a claim of comprehensive accessibility certification.
- Dependency audit: **0 reported vulnerabilities**, including development dependencies.
- Source formatting check: passed.
- Development server: started successfully; its app HTML and module entry were verified.
- Production preview: functional browser tests ran against the actual compiled assets.

## Current external blockers

- The connected GitHub account is `MainMMV`. Both GraphQL and REST repository-creation operations were denied with `Resource not accessible by integration` (HTTP 403 for REST). `MainMMV/mmv-purchases` has **not** been created remotely.
- Vercel is reachable, but no `VERCEL_TOKEN` is configured. No Vercel project or production deployment has been created.
- Reusable `install_script` and `start_skill`, required network destinations, and a Vercel secret requirement were saved in the cloud environment draft. Saving the draft does not publish the environment or deploy the application. Fresh-task restoration has not been verified.

## To finish publication

1. Create an empty `MainMMV/mmv-purchases` repository and grant the connected GitHub integration access to it, or authorize repository creation for an appropriate GitHub connection.
2. Supply `VERCEL_TOKEN` securely in environment settings. Do not put it in source or chat. Alternatively, import the new GitHub repository through Vercel's own dashboard.
3. Resume with this prepared local checkout: add the verified remote, push `main`, create a new Vercel project, deploy, and verify the production site. Update the environment's repository membership after the remote exists and all checkouts have been inventoried.
4. Review/save the environment draft and publish it through the product when ready. Local processes must be started again in future tasks using the saved instructions.

The existing `/workspace/MMVpurchase` checkout has been left unchanged. The new project is at `/workspace/mmv-purchases`.
