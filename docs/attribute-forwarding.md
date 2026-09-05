# Attribute forwarding policy

Nagi UI Blueprints make the destination of consumer-supplied attributes
explicit. When there is exactly one meaningful native destination, the
Blueprint reads `useAttrs()` and binds it to that element. A composite must not
forward an undifferentiated attrs object to an arbitrary internal control.

This is intentional even though support for a newly requested native attribute
may need to be added later. A visible omission is easier to correct than an
attribute, listener, or ARIA relationship attached to the wrong DOM node.

## Ownership rules

- Keep `inheritAttrs: false` in every Blueprint so the destination never depends
  on Vue's implicit fallthrough.
- Use `useAttrs()` only when all consumer attributes have one unambiguous native
  destination. Bind attrs directly when there is nothing to compose.
- Use `mergeElementProps()` when consumer attrs and behavior- or
  component-owned props target the same native element. Do not use the helper
  merely to wrap one object.
- Declare supported consumer events with `defineEmits` and forward them from the
  intended native element.
- Keep behavior-owned IDs, roles, state attributes, relationships, and event
  handlers under behavior ownership. Consumer props must not override them.
- Combine additive ARIA IDREF values, such as `aria-describedby`, without
  dropping either the behavior-owned or consumer-supplied relationship.
- Treat `class`, `style`, `id`, `title`, `data-*`, and test hooks as native
  element attributes when the destination is singular. Composite components
  continue to expose only attributes whose destination is explicit.
- Use a props merge only at a genuine composition boundary. Static attributes
  controlled by the Blueprint should be written directly in the template.
- Do not introduce unused rest-destructuring bindings merely to exclude visual,
  content, or behavior props. In a mixed or composite Blueprint, explicit
  bindings are easier for an owner to audit.

For a single native control, keep component state in `defineProps` and ordinary
element attributes in `useAttrs()`:

```ts
const props = withDefaults(defineProps<ButtonProps>(), {
  type: "button",
  disabled: false,
  focusableWhenDisabled: false,
})

const button = useButton(props, useAttrs())
```

The template then has one native destination:

```vue
<button
  v-bind="button.buttonProps"
  data-scope="button"
  data-part="root"
  class="n-button"
>
  <slot />
</button>
```

The helper's public contract is:

```ts
interface ButtonControlProps {
  readonly type?: "button" | "submit" | "reset"
  readonly disabled: boolean
  readonly focusableWhenDisabled: boolean
}

interface ButtonBindingProps {
  readonly type: "button" | "submit" | "reset"
  readonly disabled: boolean
  readonly "aria-disabled": "true" | undefined
  readonly onClickCapture: (event: MouseEvent) => void
}

interface ButtonControl {
  readonly buttonProps: ButtonBindingProps
}

function useButton(
  props: ButtonControlProps,
  attrs?: Readonly<Record<string, unknown>>,
): ButtonControl
```

Reading the returned `button.buttonProps` yields the current `props` and `attrs`
as one complete native-root binding. `useButton` also removes a repeated `n-button`
token from consumer classes because the Blueprint declares that static root
identity itself; consumer variants and unrelated classes remain intact. Bind
the object to the native button. Visual ownership can still alter the slot,
CSS style axes, surrounding markup, and scoped CSS independently. Visual axes
are ordinary consumer CSS and do not pass through Vue props or DOM data
attributes.

The scoped part attributes are Blueprint-owned structural wiring rather than
consumer attributes or Behavior state. They make the binding destination
explicit to the Button Definition without coupling Anatomy to the Nagi CSS
class or to a localized accessible name.

Consumers then use ordinary HTML spelling such as `aria-label`, `data-state`,
`form`, and `autofocus`; the Blueprint does not maintain a camelCase conversion
table.

For a composite component, keep separate objects such as `lowerInputProps` and
`upperInputProps`, or use explicit bindings when that makes ownership clearer.
If root, trigger, input, popup, or form proxy are all plausible destinations,
do not manufacture one broad pass-through object for the whole component.

## Blueprint review checklist

Apply every row before adding or changing an owned Blueprint.

- [ ] The semantic public element and any wrapper elements are identified.
- [ ] `inheritAttrs` is disabled and attrs have one documented destination, or remain unsupported.
- [ ] `class` and `style` have a documented destination or are deliberately unsupported.
- [ ] `id`, `title`, language, direction, focus, and test-hook requirements were considered.
- [ ] Relevant native form attributes are declared and bound to the intended element.
- [ ] Relevant input hints and constraints are declared and bound to the intended element.
- [ ] Supported keyboard, focus, input, composition, clipboard, pointer, and form events are declared.
- [ ] Accessible name, description, error, details, and invalid-state attributes were considered.
- [ ] Behavior-owned ARIA attributes cannot be replaced by consumer values.
- [ ] Additive ARIA IDREF token lists preserve all relationships.
- [ ] Disabled, read-only, required, and invalid state have one owner each.
- [ ] SSR tests assert attributes on the exact intended native element.
- [ ] Tests assert that attrs reach the exact intended element and do not appear on another element.
- [ ] Browser tests cover behavior and consumer handlers when both are supported.
- [ ] Native form submission and reset behavior remain intact.
- [ ] The owned source remains understandable without knowing an attribute-forwarding helper.

## Audit matrix

Use these groups when auditing the catalog. Each component still needs an
individual review because elements with the same native tag do not necessarily
have the same public contract.

| Group | Components | Primary review target |
| --- | --- | --- |
| Text entry | Input, Textarea, FileInput | Native attributes, constraints, input and focus events |
| Choice controls | Checkbox, Radio, Switch, Select | Form ownership, checked/selected state, accessible descriptions |
| Numeric controls | NumberField, Slider | Min/max/step, value events, generated controls |
| Native indicators | Meter, Progress | Native range attributes and labeling |
| Composite text entry | Autocomplete, Combobox, MultiSelect, TagsInput, OTPField | Root versus internal input, behavior-owned combobox wiring |
| Segmented fields | DateField, TimeField | Group focus, descriptions, generated error relationships |
| Trigger composition | PreviewCard, DatePicker, DateRangePicker | Trigger events, popover relationships, root attributes |
| Calendar surfaces | Calendar, RangeCalendar | Root labeling and native form proxy ownership |
| Structural primitives | Separator, Skeleton, Spinner | Conditional root semantics and labeling |

## Required verification

After an attribute API change, run lint, type checking, unit and integration
tests, browser tests, Nagi CSS validation, and the ownership workflow tests. The
audit is incomplete while any Blueprint still contains an unexplained `$attrs`
binding or while a behavior merge only combines library-controlled static
attributes.
