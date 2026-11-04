# Little - React todo app

A calm, responsive todo workspace built with React, TypeScript, and Vite.

## Run locally

Use Node.js 22.18+ (or a newer supported LTS) and npm.

```powershell
npm install
npm run dev
```

Open the localhost URL printed by Vite. Add, edit, complete, reopen, and delete
tasks. Use lists, status filters, search, priority sorting, and due dates.
Six editable example tasks appear on the first visit. Clearing the list does
not bring them back.

Tasks are stored in this browser's localStorage, not a server. They survive
refreshes but do not sync across browsers/devices or between localhost and an
Azure URL. Clearing browser data removes tasks. Do not store sensitive data.
Unreadable saved data is not overwritten; the app shows an explicit error.
Google Fonts are optional; system fonts work when offline.

```powershell
npm test
npm run lint
npm run build
npm run preview
```

## Practice: deploy to Azure Static Web Apps

This is a frontend-only deployment. No Azure resource has been created for you.

1. Create your own GitHub repository and push the project. If this folder is
   not a repository yet, initialize Git first. Do not commit `node_modules`
   or `dist` (already ignored).
2. In [Azure Portal](https://portal.azure.com), create a **Static Web App**.
   Select your subscription, create a practice resource group, and choose a
   supported region and appropriate plan. Review current pricing first.
3. Choose GitHub as the deployment source, authorize access, and select your
   repository and branch.
4. Choose the **React** build preset:
   - App location: `/`
   - API location: leave empty
   - Output location: `dist`
5. Let Azure generate the GitHub Actions deployment workflow. Check that the
   workflow uses Node 22.18+ or a newer supported LTS. In GitHub, watch the
   **Actions** tab for build and deployment results.
6. Open the Azure-provided URL. Create a task and refresh to verify persistence.
   The deployed app has its own browser storage; localhost tasks will not appear.

The configuration in [public/staticwebapp.config.json](./public/staticwebapp.config.json)
is copied to the build output and supplies SPA navigation fallback and basic
response headers.

Official walkthrough:
[Deploy a Static Web App](https://learn.microsoft.com/azure/static-web-apps/get-started-portal).

### Next Azure exercises

- Inspect the generated GitHub Actions workflow and deployment logs.
- Open a pull request and explore Static Web Apps preview environments.
- Add an Azure Functions API for task CRUD, then connect a database such as
  Azure Cosmos DB. Keep database credentials on the server, never in React.
- Add authentication and enforce per-user authorization in the API before
  storing private tasks. These features are exercises, not implemented here.
- Practice a custom domain and HTTPS.

**Cleanup:** delete the practice resources/resource group when finished, after
checking it contains nothing you need. Remove any associated GitHub deployment
secrets/workflows you no longer use. Free tiers have limits; review billing
and configure a budget rather than assuming resources cannot incur charges.
