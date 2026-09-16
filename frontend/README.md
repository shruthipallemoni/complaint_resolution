<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Complaint Resolution Frontend

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/7f5e78f8-0ae5-4835-aeb9-9af6c107954e

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

The frontend uses the deployed backend by default. To use a local backend,
create `frontend/.env.local` with:

```text
VITE_API_URL=http://127.0.0.1:8000
```
