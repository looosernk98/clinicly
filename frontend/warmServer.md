<!-- index.html / app head -->

<link
  rel="preconnect"
  href="https://your-api.onrender.com"
/>

<script>
  (() => {
    const ACTIVITY_KEY =
      "lastBackendActivity";

    const INACTIVITY_THRESHOLD =
      10 * 60 * 1000; // 10 mins

    const lastActivity =
      localStorage.getItem(
        ACTIVITY_KEY
      );

    const shouldWake =
      !lastActivity ||
      Date.now() -
        Number(lastActivity) >
        INACTIVITY_THRESHOLD;

    // Initial warmup during HTML parsing
    if (shouldWake) {
      fetch(
        "https://your-api.onrender.com/health"
      )
        .then(() => {
          localStorage.setItem(
            ACTIVITY_KEY,
            Date.now()
          );
        })
        .catch(() => {});
    }
  })();
</script>

<script>
// utils/backend.js

const BACKEND_URL =
  "https://your-api.onrender.com";

const ACTIVITY_KEY =
  "lastBackendActivity";

const INACTIVITY_THRESHOLD =
  10 * 60 * 1000;

// ------------------------------------
// Track backend activity
// ------------------------------------

export const markBackendActivity =
  () => {
    localStorage.setItem(
      ACTIVITY_KEY,
      Date.now()
    );
  };

// ------------------------------------
// Check if backend may be sleeping
// ------------------------------------

export const shouldWakeBackend =
  () => {
    const lastActivity =
      localStorage.getItem(
        ACTIVITY_KEY
      );

    return (
      !lastActivity ||
      Date.now() -
        Number(lastActivity) >
        INACTIVITY_THRESHOLD
    );
  };

// ------------------------------------
// Wake backend silently
// ------------------------------------

export const wakeBackend =
  async () => {
    if (!shouldWakeBackend())
      return;

    try {
      await fetch(
        `${BACKEND_URL}/health`
      );

      markBackendActivity();
    } catch {}
  };

// ------------------------------------
// Wrapped fetch
// Use this for ALL backend APIs
// ------------------------------------

export const apiFetch = async (
  endpoint,
  options = {}
) => {
  const response = await fetch(
    `${BACKEND_URL}${endpoint}`,
    options
  );

  if (response.ok) {
    markBackendActivity();
  }

  return response;
};

</script>

<script>
    "use client";

import { useEffect } from "react";

import {
  wakeBackend,
} from "@/utils/backend";

export default function App() {
  useEffect(() => {
    const handleVisibility =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          wakeBackend();
        }
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, []);

  return <div>Your App</div>;
}
</script>

Final Behavior
Initial cold load
HTML parsing starts
↓
preconnect starts
↓
health request fires immediately
↓
backend wakes in parallel
↓
React loads meanwhile
User active continuously
real APIs keep updating activity timestamp
↓
no unnecessary warmups
User leaves tab for long time
backend may sleep
↓
user returns to tab
↓
visibilitychange fires
↓
warmup happens only if inactive long enough
Why This Architecture Is Good

✅ Parallel backend wakeup
✅ No blocking rendering
✅ Avoid unnecessary refresh calls
✅ Avoid periodic polling
✅ Smart rewake after idle
✅ Real APIs naturally maintain activity
✅ Efficient for Render free tier


✅ Scenarios Your Architecture Handles Well
1. First-Time Visitor + Sleeping Backend
Scenario
New user opens app
Backend sleeping
What happens
HTML parsing starts
↓
Early <script> fires /health
↓
Backend starts waking
↓
React loads meanwhile
Result

✅ Cold start partially hidden
✅ Parallelization achieved
✅ Faster perceived loading

2. User Refreshes Quickly
Scenario
User refreshes after 1–2 mins
Backend already awake
What happens
localStorage activity timestamp exists
↓
shouldWake() false
↓
No unnecessary /health call
Result

✅ Avoids redundant wakeups

3. User Active For Long Time
Scenario
User continuously uses app
Real APIs firing
What happens
apiFetch updates activity timestamp
↓
Backend naturally stays awake
↓
Warmup skipped
Result

✅ No unnecessary health pings
✅ Real traffic acts as keepalive

4. User Leaves Tab For Long Time
Scenario
User inactive 30+ mins
Backend sleeps
What happens
User returns to tab
↓
visibilitychange fires
↓
shouldWake() true
↓
backend rewarmed
Result

✅ Handles long idle revisits

5. Multiple Route Navigations
Scenario
SPA route changes
What happens
No full refresh
↓
No repeated HTML warmup
↓
Real APIs maintain activity
Result

✅ Efficient in React/Next SPA apps

6. Multiple Tabs Open
Scenario
User opens another tab of same app
What happens
localStorage shared across tabs
↓
Second tab sees recent activity
↓
Skips unnecessary wakeup
Result

✅ Good multi-tab behavior

7. Backend Already Awake
Scenario
Backend active from other users
What happens
/health returns instantly
Result

✅ Minimal overhead

8. Slow React Hydration
Scenario
Large JS bundle
Slow hydration
What happens
Backend wakeup starts BEFORE hydration
Result

✅ Great for hiding cold starts

❌ Scenarios NOT Fully Handled
1. Backend Sleeps While User Stays On Same Visible Tab
Scenario
User opens app
↓
Leaves tab visible
↓
No API calls for 20 mins
↓
Backend sleeps
Problem

visibilitychange does NOT fire because:

tab never became hidden
Result

Next API may still hit cold start.

Possible Solution

Optional idle timer:

user inactivity tracking

But usually unnecessary.

2. User Performs Important Action Immediately After Returning
Scenario
User returns to tab
↓
Immediately clicks button
Problem
warmup + real API start almost simultaneously

So warmup gives little benefit.

Why?

Because backend cannot fully wake instantly.

3. Backend Takes Extremely Long To Cold Start
Scenario
heavy server startup
DB reconnections
large app boot
Problem

Warmup helps only partially.

User may still wait.

4. First Important API Happens Too Early
Scenario
React app instantly calls critical API
before warmup finishes
Result

Cold start still affects request.

Why?

Warmup only buys:

a few seconds head start

not magical instant boot.

5. localStorage Cleared
Scenario
incognito
manual storage clear
strict browser settings
Result

App loses activity memory.

May send extra wakeup requests.

Usually harmless.

6. User Has JavaScript Disabled
Scenario
JS disabled
Result

No warmup logic works.

Rarely relevant for React apps.

7. Network Offline / Bad Connection
Scenario
health request fails
Result

Warmup ineffective.

But app still functions normally later.

8. Multiple Simultaneous Users
Scenario
many users hit sleeping backend together
Result

Some users may still experience cold start.

Because:

Render boots only once
early requests queue
Most Important Truth

Your architecture:

✅ REDUCES perceived cold start
❌ does NOT eliminate cold start completely

Only:

paid always-on servers
serverless edge architectures
prewarmed infrastructure

can truly eliminate it.