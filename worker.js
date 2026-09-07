const htmlPaths = new Set([
  "/",
  "/index.html",
  "/projects",
  "/projects/",
  "/projects.html",
  "/privacy",
  "/privacy/",
  "/privacy.html",
  "/404.html",
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const response = await env.ASSETS.fetch(request);

    if (request.method !== "GET" || !htmlPaths.has(url.pathname)) {
      return response;
    }

    // Keep the normal U.S. experience clean. Everywhere else gets an explicit
    // analytics choice before Google Analytics is loaded.
    const requiresAnalyticsConsent = request.cf?.country !== "US";
    const headers = new Headers(response.headers);

    // The document contains a visitor-region-specific setting. Avoid serving a
    // cached U.S. document to a visitor who needs the choice flow (or vice versa).
    headers.set("Cache-Control", "private, no-store");

    return new HTMLRewriter()
      .on("head", {
        element(element) {
          element.append(
            `<script>window.__portfolioAnalyticsConsentRequired=${JSON.stringify(requiresAnalyticsConsent)};</script>`,
            { html: true },
          );
        },
      })
      .transform(new Response(response.body, { status: response.status, headers }));
  },
};
