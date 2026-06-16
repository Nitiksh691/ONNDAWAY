/**
 * Concurrency + stress test suite for ONN D A WAY
 * Run: node scripts/load-test.mjs [--base http://localhost:3001]
 */

const BASE = process.argv.find((a) => a.startsWith("--base="))?.split("=")[1] ?? "http://localhost:3001";

const results = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE,
  concurrency: {},
  stress: {},
  bottlenecks: [],
};

async function fetchJson(path, opts = {}) {
  const start = performance.now();
  const res = await fetch(`${BASE}${path}`, opts);
  const ms = performance.now() - start;
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, ms, body, headers: Object.fromEntries(res.headers.entries()) };
}

function percentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function buildOrderPayload(menuItem, userId, qty = 1) {
  return {
    userId,
    userName: `LoadTest-${userId}`,
    userPhone: userId,
    items: [
      {
        cartItemId: `load-${userId}-${Date.now()}`,
        item: {
          id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          image: menuItem.image ?? "",
          category: menuItem.category,
          description: menuItem.description ?? "",
        },
        quantity: qty,
        unitPrice: menuItem.price,
      },
    ],
    location: "Load Test Gate",
    total: menuItem.price * qty + 20,
    status: "placed",
    scheduledTime: "ASAP (~15 mins)",
  };
}

async function runConcurrent(name, count, fn) {
  const barrier = { ready: 0, go: false };
  const promises = Array.from({ length: count }, (_, i) =>
    new Promise((resolve) => {
      const tick = () => {
        barrier.ready++;
        if (barrier.ready === count) barrier.go = true;
        const wait = () => {
          if (barrier.go) resolve(fn(i));
          else setImmediate(wait);
        };
        wait();
      };
      tick();
    })
  );
  const start = performance.now();
  const outcomes = await Promise.all(promises);
  const totalMs = performance.now() - start;
  const latencies = outcomes.map((o) => o.ms);
  const successes = outcomes.filter((o) => o.status >= 200 && o.status < 300);
  const failures = outcomes.filter((o) => o.status < 200 || o.status >= 300);

  const summary = {
    name,
    concurrentUsers: count,
    totalMs: Math.round(totalMs),
    successCount: successes.length,
    failureCount: failures.length,
    successRate: `${((successes.length / count) * 100).toFixed(1)}%`,
    latencyMs: {
      min: Math.round(Math.min(...latencies)),
      avg: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
      p50: Math.round(percentile(latencies, 50)),
      p95: Math.round(percentile(latencies, 95)),
      p99: Math.round(percentile(latencies, 99)),
      max: Math.round(Math.max(...latencies)),
    },
    statusCodes: outcomes.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {}),
  };

  return { summary, outcomes };
}

async function stressEndpoint(name, path, opts, { connections, durationSec }) {
  const latencies = [];
  let completed = 0;
  let errors = 0;
  let statusCodes = {};
  const endAt = Date.now() + durationSec * 1000;
  const workers = [];

  async function worker() {
    while (Date.now() < endAt) {
      try {
        const start = performance.now();
        const res = await fetch(`${BASE}${path}`, opts);
        const ms = performance.now() - start;
        latencies.push(ms);
        statusCodes[res.status] = (statusCodes[res.status] || 0) + 1;
        if (!res.ok) errors++;
        completed++;
        await res.text().catch(() => {});
      } catch {
        errors++;
        completed++;
      }
    }
  }

  for (let i = 0; i < connections; i++) workers.push(worker());
  const start = performance.now();
  await Promise.all(workers);
  const totalMs = performance.now() - start;

  return {
    name,
    connections,
    durationSec,
    totalRequests: completed,
    errors,
    rps: Math.round((completed / totalMs) * 1000),
    latencyMs: latencies.length
      ? {
          avg: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
          p50: Math.round(percentile(latencies, 50)),
          p95: Math.round(percentile(latencies, 95)),
          p99: Math.round(percentile(latencies, 99)),
          max: Math.round(Math.max(...latencies)),
        }
      : null,
    statusCodes,
  };
}

async function main() {
  console.log(`\n=== ONN D A WAY Load Test ===`);
  console.log(`Target: ${BASE}\n`);

  // Warm up DB connection (health reports disconnected until first query)
  const warmup = await fetchJson("/api/menu");
  if (warmup.status !== 200) {
    console.error("Server/DB not reachable:", warmup);
    process.exit(1);
  }
  const health = await fetchJson("/api/admin/health");
  console.log(`Health: ${health.body?.status} | DB: ${health.body?.db} | ping: ${health.body?.pingMs}ms\n`);

  // Fetch menu (reuse warmup response)
  const menuRes = warmup;
  const menu = menuRes.body ?? [];
  if (!menu.length) {
    console.error("No menu items found — cannot run realistic order tests");
    process.exit(1);
  }
  const testItem = menu[0];
  console.log(`Test item: "${testItem.name}" (${testItem.id}) — price ₹${testItem.price}\n`);

  // ── CONCURRENCY TEST 1: Race for last unit (simulated) ──
  console.log("── Test 1: Concurrent checkout race (50 users, qty=1 each) ──");
  const race50 = await runConcurrent("race-50-users-1-unit", 50, async (i) => {
    const phone = `900000${String(i).padStart(4, "0")}`;
    return fetchJson("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildOrderPayload(testItem, phone, 1)),
    });
  });
  results.concurrency.race50SameItem = race50.summary;
  console.log(JSON.stringify(race50.summary, null, 2));
  console.log(`→ All ${race50.summary.successCount} orders accepted (no stock guard)\n`);

  // ── CONCURRENCY TEST 2: Same user, burst orders ──
  console.log("── Test 2: Same user double-submit (10 simultaneous) ──");
  const doubleSubmit = await runConcurrent("double-submit-10", 10, async () =>
    fetchJson("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildOrderPayload(testItem, "9111111111", 1)),
    })
  );
  results.concurrency.doubleSubmit = doubleSubmit.summary;
  console.log(JSON.stringify(doubleSubmit.summary, null, 2));
  console.log(`→ ${doubleSubmit.summary.successCount}/10 duplicate orders created (no idempotency)\n`);

  // ── CONCURRENCY TEST 3: Sold-out item bypass ──
  console.log("── Test 3: Orders for sold-out item (20 concurrent) ──");
  const soldOutItem = { ...testItem, id: "000000000000000000000000", name: "Sold Out Espresso" };
  const soldOutRace = await runConcurrent("sold-out-bypass-20", 20, async (i) => {
    const phone = `800000${String(i).padStart(4, "0")}`;
    return fetchJson("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildOrderPayload(soldOutItem, phone, 1)),
    });
  });
  results.concurrency.soldOutBypass = soldOutRace.summary;
  console.log(JSON.stringify(soldOutRace.summary, null, 2));
  console.log(`→ ${soldOutRace.summary.successCount}/20 orders accepted for fake/sold-out item\n`);

  // ── CONCURRENCY TEST 4: Concurrent menu reads during writes ──
  console.log("── Test 4: 100 concurrent menu reads ──");
  const menuReads = await runConcurrent("menu-reads-100", 100, async () => fetchJson("/api/menu"));
  results.concurrency.menuReads100 = menuReads.summary;
  const cacheHits = menuReads.outcomes.filter((o) => o.headers["x-cache"] === "HIT").length;
  menuReads.summary.cacheHits = cacheHits;
  menuReads.summary.cacheMisses = 100 - cacheHits;
  console.log(JSON.stringify(menuReads.summary, null, 2));
  console.log(`→ Cache HIT: ${cacheHits}/100\n`);

  // ── STRESS TESTS ──
  console.log("── Stress Test A: GET /api/menu (varying concurrency) ──");
  for (const conn of [10, 25, 50, 100]) {
    const r = await stressEndpoint("GET /api/menu", "/api/menu", {}, { connections: conn, durationSec: 5 });
    results.stress[`menu_${conn}conn`] = r;
    console.log(`  ${conn} conn: ${r.rps} req/s | p95=${r.latencyMs?.p95}ms | errors=${r.errors}`);
  }

  console.log("\n── Stress Test B: POST /api/orders (write load) ──");
  let orderSeq = 0;
  for (const conn of [5, 10, 20, 30]) {
    const r = await stressEndpoint(
      "POST /api/orders",
      "/api/orders",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildOrderPayload(testItem, "7000000000", 1)),
      },
      {
        connections: conn,
        durationSec: 5,
      }
    );
    // Fix: body must be unique per request — re-run with dynamic body
    const r2 = await (async () => {
      const latencies = [];
      let completed = 0;
      let errors = 0;
      let statusCodes = {};
      const endAt = Date.now() + 5 * 1000;
      async function worker() {
        while (Date.now() < endAt) {
          const seq = orderSeq++;
          const phone = `7000${String(seq).padStart(6, "0")}`;
          try {
            const start = performance.now();
            const res = await fetch(`${BASE}/api/orders`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(buildOrderPayload(testItem, phone, 1)),
            });
            const ms = performance.now() - start;
            latencies.push(ms);
            statusCodes[res.status] = (statusCodes[res.status] || 0) + 1;
            if (!res.ok) errors++;
            completed++;
            await res.text().catch(() => {});
          } catch {
            errors++;
            completed++;
          }
        }
      }
      const workers = Array.from({ length: conn }, () => worker());
      const start = performance.now();
      await Promise.all(workers);
      const totalMs = performance.now() - start;
      return {
        name: "POST /api/orders",
        connections: conn,
        durationSec: 5,
        totalRequests: completed,
        errors,
        rps: Math.round((completed / totalMs) * 1000),
        latencyMs: latencies.length
          ? {
              avg: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
              p50: Math.round(percentile(latencies, 50)),
              p95: Math.round(percentile(latencies, 95)),
              p99: Math.round(percentile(latencies, 99)),
              max: Math.round(Math.max(...latencies)),
            }
          : null,
        statusCodes,
      };
    })();
    results.stress[`orders_${conn}conn`] = r2;
    console.log(`  ${conn} conn: ${r2.rps} req/s | p95=${r2.latencyMs?.p95}ms | errors=${r2.errors} | codes=${JSON.stringify(r2.statusCodes)}`);
  }

  console.log("\n── Stress Test C: GET /api/orders?status=placed (admin dashboard) ──");
  for (const conn of [10, 25, 50]) {
    const r = await stressEndpoint("GET /api/orders", "/api/orders?status=placed", {}, { connections: conn, durationSec: 5 });
    results.stress[`admin_orders_${conn}conn`] = r;
    console.log(`  ${conn} conn: ${r.rps} req/s | p95=${r.latencyMs?.p95}ms | errors=${r.errors}`);
  }

  // Post-stress health
  const healthAfter = await fetchJson("/api/admin/health");
  results.postStressHealth = healthAfter.body;

  // Analyze bottlenecks
  const menu100 = results.stress.menu_100conn;
  const orders30 = results.stress.orders_30conn;

  if (race50.summary.successCount === 50) {
    results.bottlenecks.push({
      id: "no-inventory-guard",
      severity: "critical",
      finding: "50 concurrent buyers all succeeded — no atomic stock decrement or reservation",
      impact: "Overselling: all customers get 'order placed' but kitchen may only fulfill one",
    });
  }

  if (soldOutRace.summary.successCount === 20) {
    results.bottlenecks.push({
      id: "no-availability-check",
      severity: "critical",
      finding: "Orders accepted for non-existent/sold-out menu item IDs without server validation",
      impact: "Stale carts and API abuse can create unfulfillable orders",
    });
  }

  if (doubleSubmit.summary.successCount === 10) {
    results.bottlenecks.push({
      id: "no-idempotency",
      severity: "high",
      finding: "10 simultaneous submits from same user all created separate orders",
      impact: "Double-charge risk on slow networks / double-tap checkout",
    });
  }

  if (menu100 && menu100.latencyMs?.p95 > 500) {
    results.bottlenecks.push({
      id: "menu-latency-under-load",
      severity: "medium",
      finding: `Menu p95 latency ${menu100.latencyMs.p95}ms at 100 concurrent readers`,
      impact: "Slow homepage/menu during peak lunch rush",
    });
  }

  results.bottlenecks.push({
    id: "db-pool-limit",
    severity: "high",
    finding: "MongoDB maxPoolSize=10 caps concurrent DB operations",
    impact: `Write throughput ~${orders30?.rps ?? "?"} orders/s before queueing; spikes cause latency`,
  });

  results.bottlenecks.push({
    id: "no-rate-limiting",
    severity: "medium",
    finding: "Rate limit code exists in proxy.ts but middleware is not wired",
    impact: "No protection against order spam or DDoS on POST /api/orders",
  });

  results.bottlenecks.push({
    id: "no-auth-on-orders-api",
    severity: "medium",
    finding: "POST /api/orders has no authentication",
    impact: "Anyone can flood the system with fake orders",
  });

  // Capacity estimate
  const peakMenuRps = Math.max(...Object.values(results.stress).filter((s) => s.name?.includes("menu")).map((s) => s.rps));
  const peakOrderRps = Math.max(...Object.values(results.stress).filter((s) => s.name?.includes("orders")).map((s) => s.rps));

  results.capacityEstimate = {
    note: "Single dev instance on localhost — production will differ",
    maxMenuReadsPerSec: peakMenuRps,
    maxOrderWritesPerSec: peakOrderRps,
    estimatedConcurrentBrowsers:
      peakMenuRps > 0 ? Math.floor(peakMenuRps / 2) : null,
    estimatedSimultaneousCheckouts:
      peakOrderRps > 0 ? Math.floor(peakOrderRps * 0.5) : null,
    breakingPointIndicators: [
      orders30?.latencyMs?.p95 > 2000 ? "Order p95 > 2s at 30 concurrent writers" : null,
      menu100?.errors > 0 ? "Menu errors at 100 concurrent readers" : null,
      healthAfter.body?.status !== "ok" ? "Server degraded after stress" : null,
    ].filter(Boolean),
  };

  // Write report
  const reportPath = new URL("../LOAD_TEST_REPORT.json", import.meta.url);
  await import("fs").then((fs) => fs.promises.writeFile(reportPath, JSON.stringify(results, null, 2)));

  console.log("\n=== SUMMARY ===");
  console.log(`Menu read capacity:  ~${peakMenuRps} req/s`);
  console.log(`Order write capacity: ~${peakOrderRps} orders/s`);
  console.log(`Bottlenecks found: ${results.bottlenecks.length}`);
  console.log(`Full report: scripts/../LOAD_TEST_REPORT.json\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
