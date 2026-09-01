# Component documentation checklist

Use this checklist for every public Nagi UI component page. Button is the reference implementation.

## Shared page contract

- Keep one public route per component at `/components/<kebab-case-name>`.
- Keep component-specific documentation outside the dynamic route component.
- Compose the page through `ComponentDocumentation` named slots: `basic`, `basic-meta`, `api`, `source`, and the default slot for component-specific sections.
- Write Vue component tags in kebab-case. `vue/component-name-in-template-casing` enforces this for registered and auto-imported components.
- Use Nagi UI components for documentation UI when an appropriate component exists.
- Keep all custom CSS as plain CSS that passes the Nagi CSS contract.

## Basic

- Show a useful, interactive baseline rather than a single token instance.
- Include the component's meaningful sizes, variants, disabled/read-only/loading/empty/error states where supported.
- Do not invent unsupported props or states.
- Keep the preview and its displayed source example behaviorally equivalent.
- Hide the example source initially behind `CodeDisclosure` with the label `View code`.
- Highlight Vue source with Shiki.

## API

- Use `NTable`, not a parallel raw-table implementation.
- Include `Property`, `Value type`, `Kind`, and `Requirement` where applicable.
- Derive component props from the shipped Blueprint rather than duplicating them in documentation data.
- Distinguish component props, native attributes, and global attributes.
- Document the real native attribute destination for each component.
- Add model, event, and slot tables when the component exposes them.
- Preserve native table caption and row-header semantics.

## Source ownership

- Show the exact `vp exec nagi-ui own <slug>` command with `InlineCode`.
- Load source from the shipped Blueprint; never maintain a documentation-only copy.
- Hide owned source initially behind `CodeDisclosure`.
- Highlight the Vue SFC with Shiki.

## Component-specific behavior

- Add a section only for a real distinguishing feature.
- Place low-level composable documentation after the owned source, so the reader sees its usage context first.
- When a public composable exists, show its exported input and return types—not only prose.
- Do not add a composable section to components without a public behavior API.

## Code presentation

- Use `InlineCode` for commands and identifiers embedded in prose.
- Use `CodeDisclosure` for collapsible code blocks.
- Code disclosures must be full width and retain background, padding, overflow, syntax color, and readable font sizing.
- Do not use inline `style` attributes to repair documentation layout.

## Verification

- Run `vp run site:lint`.
- Run `vp run site:typecheck`.
- Run `vp run site:generate`.
- Open representative pages in a browser, including an expanded code disclosure.
- Verify that Basic and the displayed source agree.
- Verify API rows against the actual Blueprint.
- Verify that the ownership command uses the correct slug.
- Verify that no component-specific condition was added back to the dynamic route unnecessarily.
