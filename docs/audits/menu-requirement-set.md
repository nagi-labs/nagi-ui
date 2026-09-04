# `nagi/menu@1` — DropdownMenu adoption audit

`DropdownMenu` adopts `nagi/menu@1` with `dropdown` / `nested` choices. The
set is deliberately small: it contains only menu semantics that can be shared
by a dropdown menu and a future menubar. Submenu timing, action close policy,
dynamic collection repair, and DOM-focus ownership remain component policies.

## Sources fixed for this revision

| Local source id     | Authority                                                                                                   | Revision recorded               | Reviewed   |
| ------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------- | ---------- |
| `wai-aria-1.2-menu` | [WAI-ARIA 1.2 menu role](https://www.w3.org/TR/wai-aria-1.2/#menu)                                          | 1.2 Recommendation (2023-06-06) | 2026-09-01 |
| `apg-menu-button`   | [APG Menu Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)                            | Rolling guidance snapshot       | 2026-09-01 |
| `apg-menu`          | [APG Menu and Menubar Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/)                           | Rolling guidance snapshot       | 2026-09-01 |
| `html-popover-ls`   | [HTML Living Standard — popover](https://html.spec.whatwg.org/multipage/popover.html#the-popover-attribute) | Living Standard snapshot        | 2026-09-01 |

The HTML Popover source is inherited through `nagi/popup@1`; it is not copied
into the menu set's ARIA requirements.

## Adopted and local requirements

| Resolved ID                     | Origin                         | What is checked                                                    |
| ------------------------------- | ------------------------------ | ------------------------------------------------------------------ |
| `MNU-MENU-SEM-01`               | `nagi/menu@1`                  | Named menu button and `aria-haspopup` / `aria-expanded`            |
| `MNU-MENU-SEM-02`               | `nagi/menu@1`                  | Named `menu` containing the standard menu item roles               |
| `MNU-MENU-STATE-01`             | `nagi/menu@1`                  | Disabled and checked item state attributes                         |
| `MNU-POP-SEM-01`                | `nagi/popup@1`                 | Native popover surface                                             |
| `MNU-POP-STATE-01`              | `nagi/popup@1`                 | Native toggle state and open model stay synchronized               |
| `MNU-POP-INT-01`                | `nagi/popup@1`                 | Native Escape and light dismissal                                  |
| `MNU-SEM-03`                    | APG + Nagi implementation      | Each submenu trigger has one labelled child-menu relationship      |
| `MNU-SEM-04`                    | Nagi implementation constraint | The DropdownMenu invoker remains a native `button`                 |
| `MNU-STATE-01`                  | Nagi policy                    | Dynamic collection leaves a local focus owner                      |
| `MNU-STATE-02`                  | Nagi policy                    | Rejected controlled close repairs focus in the still-visible child |
| `MNU-INT-01` — `MNU-INT-03`     | APG + Nagi policy              | Opening, navigation, submenu direction, and RTL                    |
| `MNU-INT-04`                    | Nagi policy                    | Action closes the tree; checkbox/radio remain open by default      |
| `MNU-FOCUS-01` — `MNU-FOCUS-02` | APG + Nagi policy              | Managed item focus and restoration through the menu tree           |
| `MNU-STYLE-01`                  | Nagi policy                    | Functional visual states remain distinguishable                    |

Every resolved requirement has browser or unit-test evidence containing its
stable ID. This is traceability and mutation-test input; the Definition audit
does not claim that reading prose alone proves interaction behavior.
