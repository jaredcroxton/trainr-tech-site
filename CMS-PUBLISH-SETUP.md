# Publishing the home page from the CMS to trainrtech.com.au

How Callum's edits reach the live home page WITHOUT touching the blog or assets.

## Architecture (proxy model, no domain move)

```
trainrtech.com.au
  /                              -> proxied to trainr-home.vercel.app   (CMS home, Callum-editable)
  /blog, /assets, /request, ...  -> served by THIS git project          (unchanged)
```

- This git project keeps serving the apex: blog, assets, request, everything.
- The CMS publishes ONLY the home page to its own Vercel project `trainr-home`.
- One rewrite in vercel.json sends apex `/` to that published home.
- Callum edits in the CMS, clicks Publish, apex `/` updates. Blog + assets never overwritten.

## Already done

- CMS home ingested (cinematic, animations kept), live in the PerformOS Console.
- CMS publish target pre-set: site "TrainrTech" -> Vercel project "trainr-home".
- Config-persistence + boot-crash bugs fixed (token + key now survive redeploys).

## To finish (needs Callum's Vercel token)

1. Get Callum's Vercel token: vercel.com/account/tokens -> Create.
2. PerformOS Console (password PerformOS2@) -> TrainrTech card -> "Vercel publishing":
   - Project: trainr-home (already set)
   - Vercel token: paste Callum's token (per-site, NOT the global "Vercel hosting" panel)
   - Save token. It deploys to HIS account, billed to him. Each future client = their own
     token on their own card.
3. Open the TrainrTech editor, make any edit, click Publish (or the card's "Save & deploy").
   The first publish CREATES the `trainr-home` project on Callum's Vercel and deploys the home page.
4. Find the production URL of `trainr-home` in Callum's Vercel (e.g. https://trainr-home.vercel.app).
5. Set this repo's vercel.json to the version below (fill the real URL), commit + push.
   Git redeploys; apex `/` now serves the CMS home.
6. Test: trainrtech.com.au -> home is the CMS version; /blog and images still load.

## vercel.json after step 5

```json
{
  "cleanUrls": false,
  "rewrites": [
    { "source": "/", "destination": "https://trainr-home.vercel.app/" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

## Notes

- Keep this git project deployed. It hosts /blog, /assets, /request and the home's images + video.
- The CMS home references assets at www.trainrtech.com.au/assets, which this project serves. Do not remove /assets.
- The publish is a fast static deploy (not the Render CMS), so the proxied apex home stays fast.
- If you ever move the apex domain off this project, re-point the home's asset URLs first
  (re-ingest the CMS home in the console from a stable asset URL).
