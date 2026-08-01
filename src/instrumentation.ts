// Starts hourly polling for new books from BookLore
// Runs server-side only, fires every 60 minutes

const POLL_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const AUTH_SECRET = process.env.AUTH_SECRET || "";
const PORT = process.env.PORT || 3000;

let pollTimer: NodeJS.Timeout | null = null;

async function triggerPoll() {
  try {
    const http = await import("http");
    const options = {
      hostname: "localhost",
      port: PORT,
      path: "/api/internal/poll",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ARTest-Service-Token": AUTH_SECRET,
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          console.log("[ARTest] Hourly poll triggered successfully");
        } else {
          console.error(`[ARTest] Hourly poll failed: ${res.statusCode} ${body}`);
        }
      });
    });

    req.on("error", (e) => {
      console.error("[ARTest] Hourly poll request error:", e.message);
    });

    req.write(JSON.stringify({}));
    req.end();
  } catch (e) {
    console.error("[ARTest] Hourly poll error:", e);
  }
}

export async function register() {
  // Only run on the server, not during build
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (!AUTH_SECRET) {
      console.warn("[ARTest] AUTH_SECRET not set — hourly polling disabled");
      return;
    }

    // Start polling 5 minutes after boot (let the app settle)
    setTimeout(() => {
      console.log("[ARTest] Starting hourly book polling...");
      triggerPoll();
      pollTimer = setInterval(triggerPoll, POLL_INTERVAL_MS);
    }, 5 * 60 * 1000);

    console.log("[ARTest] Hourly polling scheduled (starts in 5 minutes)");
  }
}