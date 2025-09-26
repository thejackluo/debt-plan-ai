import app from "./app.js";

const port = Number.parseInt(process.env.PORT ?? "4000", 10);

if (process.env.VERCEL) {
  // Vercel injects this variable when running serverless functions; avoid double-listening.
  console.warn("Server mode skipped: running inside Vercel.");
} else {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`CollectWise backend listening on http://localhost:${port}`);
  });
}
