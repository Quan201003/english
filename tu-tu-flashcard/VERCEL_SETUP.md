# Deploy on Vercel

Import this folder as a Vercel project. The included `vercel.json` serves `anki-static/index.html` at the deployment root, so no local server is needed after deployment.

After the first deployment, copy the deployment hostname (for example, `your-project.vercel.app`) into Firebase Console → Authentication → Settings → Authorized domains. If using a custom domain, add that domain too. This is a one-time Firebase security setting required for Google OAuth.
