// Vercel function that renders the Angular app on the server for every page
// request; vercel.json rewrites all non-file paths here. Static files are
// served by Vercel's CDN from dist/milloin-web-app/browser.
export default async function handler(req, res) {
  const { reqHandler } = await import('../dist/milloin-web-app/server/server.mjs');
  return reqHandler(req, res);
}
