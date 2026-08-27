# Nagi UI architecture

This document is the architecture contract for Nagi UI. Changes to public
behavior or component structure must preserve these principles or update this
document with the reason the boundary changed.

## Native platform first

Use HTML elements and platform behavior before implementing a JavaScript state
machine. Popover, dialog, disclosure, form controls, links, and native
validation remain native unless a concrete product requirement cannot be met.

Native state stays native: use element state, ARIA, and `data-*` attributes
instead of duplicating it in state classes.

## Visible DOM ownership

Nagi UI does not expose compound `Root` / `Trigger` / `Popup` component
families, `asChild`, render props, Teleport, or portals as its normal
composition model. Vue attribute injection and composables attach behavior to
the elements visible in the template.

Avoid custom focus traps and custom top-layer stacks when the browser already
owns those mechanisms.

## Asymmetric JavaScript

Keep behavior thin where the platform is strong, including Popover, Dialog,
Tooltip, Disclosure, and ordinary form controls.

Invest JavaScript where the platform has no complete equivalent, including
Menu, Listbox, Combobox, Tabs, Tree, advanced date/time interaction, and
coordinated composite widgets.

## Package first, own on demand

The normal path is a themeable package component. Each component's canonical
SFC is also the source copied by `nagi-ui own`; package and ownership versions
must never be separate implementations.

Customization follows this order:

1. semantic theme tokens;
2. small props or stable item schemas;
3. a few content-only slots;
4. source ownership for DOM, behavior, or product-specific integration.

Package and owned components may coexist. Owned source is maintained through
source metadata, `nagi-ui diff`, Nagi CSS, and consumer integration tests.

## API boundaries

- Prefer named props for common stable settings.
- Keep item schemas finite and tied to one component's product boundary.
- Do not grow a general rendering DSL to avoid ownership.
- Slots may replace content but must not obscure fixed behavior wiring.
- Fixed browser and Vue synchronization mechanisms may live in narrow helpers.
- DOM branches and policies an owner is expected to change stay in the SFC.

## Styling

Blueprints follow the Nagi CSS contract:

- component roots use the `n-` namespace derived from their filenames;
- owned selectors mirror DOM ownership;
- runtime state is attribute-based;
- colors and shared design scales use semantic tokens;
- component-specific dimensions may remain local values.

Package consumers style through tokens and public component APIs. Reaching into
package-owned internals is not a supported customization boundary; own the
source instead.

## Explicit non-goals

Nagi UI is not:

- a CSS or animation runtime;
- a portal-based overlay framework;
- a schema-driven form system;
- a virtualized data grid;
- a replacement for gesture-heavy sheets or fully custom select widgets;
- a promise of feature parity with every component library.

Use another focused library when a product requires arbitrary overlay stacking,
fine-grained dismiss policy, gesture physics, virtualization, spreadsheet
interaction, or identical custom rendering across browsers.
