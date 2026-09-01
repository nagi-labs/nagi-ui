# Native Popup Requirement-set audit

Audit date: 2026-09-01. Initial adopters: Popover and Combobox. Planned
adopters after their component-specific contracts are complete: DropdownMenu
and DatePicker.

## Shared boundary

`nagi/popup` revision 1 fixes three observable guarantees shared by components
backed by HTML Popover:

| Requirement | Shared guarantee |
| --- | --- |
| `SEM-01` | The surface is a real element with the native `popover` attribute, not a teleported or ARIA-only imitation. |
| `STATE-01` | Native toggle state mirrors into the open model and accepted model writes reach the locally registered surface. This is the shared Nagi `native-popup-model-sync@1` policy, not an HTML requirement. |
| `INT-01` | Escape and light dismissal remain native auto-popover behavior and propagate the closed state through `toggle`. |

The adoption profile records how a component invokes the surface and who owns
focus. It does not turn those choices into conditional prose. `SEM-01` and
`INT-01` remain source-backed HTML guarantees; `STATE-01` resolves with a Nagi
policy origin so documentation cannot misattribute Vue model synchronization
to the platform specification.

| Adopter | Invocation | Focus policy |
| --- | --- | --- |
| Popover | `native-target` | `unmanaged` |
| Combobox | `behavior-imperative` | `input-retained` |
| DropdownMenu | `native-target` | `menu-managed` |
| DatePicker | `native-target` | `calendar-managed` |

## Deliberately not shared

Focus entry and restoration remain component Requirements. Combobox leaves DOM
focus on its input, Menu moves DOM focus through actual menuitems, DatePicker
moves focus into its calendar and conditionally restores the invoker, and a
plain Popover imposes no focus policy. Dialog is not an adopter because it uses
the separate native `<dialog>` platform mechanism.

## Evidence

Popover, Combobox, DropdownMenu, and DatePicker adopt the set in verified
Definitions. Their Node and browser evidence covers local surface registration,
native visibility, model synchronization, Escape, light dismissal, anatomy,
and the distinct invocation profiles. ShadowRoot and nested-popup focus remain
component-specific evidence; they do not expand the shared popup guarantee.
