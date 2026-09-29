# Finishline Rubric Audit

Audit scope: active files under `src/` after the image, routing, cleanup, branding, and README commits.

| Rubric | Result | Reason |
| --- | --- | --- |
| B1 Authentication and roles | PASS | `src/data.js` contains administrator and client accounts; invalid credentials set a visible error; `App.jsx` and `Navbar.jsx` use the role to protect routes and render menus; `logout` clears the auth state. |
| B2 Routing and access control | PASS | The app uses `HashRouter`, `Link`/`NavLink`/`useNavigate`, keeps the catch-all route, redirects logged-out users to `/login`, and blocks clients from `/add-shoe`. |
| B3 Dashboard data and states | PASS | Inventory, wishlist, orders, and messages are rendered from arrays with `.map()` and stable product/order IDs; role-specific dashboards and empty states are conditionally rendered. |
| B4 Form page / Place Order | FAIL | Inputs are controlled and submission uses `preventDefault`, but checkout relies mainly on browser `required` validation and does not render a clear application-level error message for invalid or incomplete data. |
| B5 Submitted data persistence | PASS | Checkout creates an order in `StoreContext`, updates inventory, clears the cart, and displays recent orders; context state is shared across route changes and persisted to `localStorage`. |
| C1 Reusable components and state placement | PASS | Shared auth/store state lives in context, and the active dashboard composes reusable modal, image, empty-state, chat, cart, checkout, and confirmation components. `App.jsx` is small. |
| C2 Semantic HTML and responsive CSS | FAIL | Active forms use labels without `htmlFor`/matching IDs, and unused legacy page files contain extensive inline styles. The active CSS has responsive rules, but the legacy files weaken the rubric result. |
| C3 Single data source | FAIL | The app reads shared arrays from `src/data.js`, but the rubric requires the data modules under `src/data/*.js`. |

## Planned Fixes

1. Add explicit checkout validation and a visible error message.
2. Add `htmlFor` and matching IDs to active form controls; remove unused legacy dashboard pages with inline-style implementations.
3. Move the shared data module into `src/data/data.js` and update imports.
4. Run `npm run lint` and `npm run build` after the fixes.
