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

## Publication status

- GitHub target: the user selected the existing `MainMMV/MMVpurchase` repository and authorized pushing the app to `main`. Repository creation is no longer required.
- Vercel project `mmvpurchase` is linked to `MainMMV/MMVpurchase`, with `main` as its production branch.
- Production deployment `dpl_BkqGJKMpLrvggdkF9qsP9AKAvXpv` completed successfully from commit `fa88b274ab1164e154fababb0a7b13fe2364a17e`.
- [https://mmvpurchase.vercel.app](https://mmvpurchase.vercel.app) returned the MMV Purchases production shell and the configured content-security-policy, content-type, frame, and referrer headers.
- Reusable `install_script` and `start_skill` instructions are saved in the cloud environment draft. Fresh-task restoration has not been verified.

## Ongoing publication

Pushes to `main` trigger Vercel deployments. Keep `VERCEL_TOKEN` in secure environment settings and out of source, logs, and chat. Review/save the environment draft and publish it through the product when ready; local processes must be started again in future tasks using the saved instructions.

The existing `/workspace/MMVpurchase` checkout has been left unchanged. The new project is at `/workspace/mmv-purchases`.
