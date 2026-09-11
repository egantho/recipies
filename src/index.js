// Cloudflare Worker with static assets.
// Requests to /proxy?url=... are handled here (server-side fetch,
// avoiding unreliable public CORS proxies). Everything else is
// served from the ./public folder via the ASSETS binding.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/proxy") {
      return handleProxy(url);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleProxy(url) {
  const target = url.searchParams.get("url");

  if (!target) {
    return new Response("Saknar url-parameter", { status: 400 });
  }

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch (e) {
    return new Response("Ogiltig url", { status: 400 });
  }
  if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
    return new Response("Ogiltigt protokoll", { status: 400 });
  }

  try {
    const upstream = await fetch(targetUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/*,*/*;q=0.8",
        "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8"
      },
      redirect: "follow"
    });

    const body = await upstream.arrayBuffer();

    return new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store"
      }
    });
  } catch (err) {
    return new Response("Kunde inte hämta sidan: " + err.message, { status: 502 });
  }
}
