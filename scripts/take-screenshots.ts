import { chromium, type Page } from "playwright";
import path from "path";
import fs from "fs";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const EMAIL = process.env.TEST_EMAIL || "";
const PASSWORD = process.env.TEST_PASSWORD || "";
const VERSION = process.env.VERSION || "";
const OUTPUT_DIR = VERSION
  ? path.resolve(__dirname, `../screenshots/${VERSION}`)
  : path.resolve(__dirname, "../screenshots");

// Public pages (no auth needed)
const PUBLIC_ROUTES = [
  { name: "landing", path: "/" },
  { name: "login", path: "/login" },
  { name: "signup", path: "/signup" },
];

// Auth-protected pages
const PROTECTED_ROUTES = [
  { name: "dashboard", path: "/dashboard" },
  { name: "profile", path: "/profile" },
  { name: "journal", path: "/journal" },
  { name: "journal-new", path: "/journal/new" },
  { name: "vault", path: "/vault" },
  { name: "finances", path: "/finances" },
  { name: "timeline", path: "/timeline" },
  { name: "brief", path: "/brief" },
  { name: "onboarding", path: "/onboarding" },
];

// Viewports to capture
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

async function screenshot(page: Page, name: string, routePath: string, viewport: typeof VIEWPORTS[number]) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });

  const url = `${BASE_URL}${routePath}`;
  console.log(`${viewport.name} — ${name} (${url})`);

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
    // Small delay to let animations settle
    await page.waitForTimeout(500);
  } catch {
    console.log(`Timeout or error loading ${url}, capturing anyway...`);
  }

  const filename = `${name}--${viewport.name}.png`;
  await page.screenshot({
    path: path.join(OUTPUT_DIR, filename),
    fullPage: true,
  });
}

async function login(page: Page): Promise<boolean> {
  if (!EMAIL || !PASSWORD) {
    console.log("\n No TEST_EMAIL/TEST_PASSWORD set — skipping protected routes.");
    console.log("   Run with: TEST_EMAIL=you@email.com TEST_PASSWORD=pass npx tsx scripts/take-screenshots.ts\n");
    return false;
  }

  console.log(`\n🔐 Logging in as ${EMAIL}...`);
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });

  // Fill using input IDs (derived from label prop: "Email" -> "email", "Password" -> "password")
  await page.locator("#email").fill(EMAIL);
  await page.locator("#password").fill(PASSWORD);
  await page.locator('button[type="submit"]').click();

  try {
    // Wait for navigation away from /login (could redirect to /dashboard or /onboarding)
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
    console.log(`Logged in successfully. Redirected to: ${page.url()}\n`);
    return true;
  } catch {
    // Capture what's on screen for debugging
    const currentUrl = page.url();
    const errorText = await page.locator(".bg-red-50, .bg-red-900\\/20").textContent().catch(() => "none");
    console.log(`Login failed. Still at: ${currentUrl}`);
    console.log(`   Error shown: ${errorText}`);
    console.log("   Skipping protected routes.\n");
    return false;
  }
}

async function main() {
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`\nTaking screenshots of Companion`);
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Output:   ${OUTPUT_DIR}\n`);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Public pages
  console.log("── Public Pages ──");
  for (const route of PUBLIC_ROUTES) {
    for (const vp of VIEWPORTS) {
      await screenshot(page, route.name, route.path, vp);
    }
  }

  // 2. Protected pages (requires login)
  const loggedIn = await login(page);
  if (loggedIn) {
    console.log("── Protected Pages ──");
    for (const route of PROTECTED_ROUTES) {
      for (const vp of VIEWPORTS) {
        await screenshot(page, route.name, route.path, vp);
      }
    }
  }

  await browser.close();

  // Summary
  const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith(".png"));
  console.log(`\nDone! ${files.length} screenshots saved to ./screenshots/`);
  files.forEach((f) => console.log(`   ${f}`));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
