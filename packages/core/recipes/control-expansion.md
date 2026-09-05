# Customizing component behavior

Nagi's public `useX` composables have two explicit forms:

```ts
// Package component defaults.
useTooltip(props, open);

// Own the complete mapping.
useTooltip({ open, openDelay: 0 /* ... */ });
```

Common, stable changes belong on named component props. The component overload
contains the package's schema and native integration contract. Replace it with
the one-argument form only when the schema or interaction algorithm itself must
change after ownership. There is no generic `options` prop and no third
override argument: both would create a second path that can disagree with the
rendered DOM, model, form, or accessibility state.

## Flat collection components

### Listbox

Stable package customization uses named props:

```vue
<Listbox
  v-model:selected="selected"
  :items="items"
  label="Release channel"
  orientation="horizontal"
  dir="rtl"
  :loop="false"
/>
```

Complete ownership:

```ts
const listbox = useListbox<ListboxOption>({
  items: () => props.items,
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
  isDisabled: (item) => item.disabled ?? false,
  mode: props.mode,
  orientation: props.orientation,
  dir: props.dir,
  loop: props.loop,
  selected,
});
```

The component overload intentionally has no third argument. The full form is
appropriate when the item schema, selection source, or rendered collection
itself changes.

### Tabs

`activationMode`, `orientation`, `dir`, and `loop` are named component props.

Complete ownership passes the Vue model through the same Behavior call:

```ts
const tabs = useTabs<TabsItem>({
  items: () => props.items,
  getKey: (item) => item.key,
  isDisabled: (item) => item.disabled ?? false,
  model: selectedModel,
  label: props.label,
  activationMode: props.activationMode,
  orientation: props.orientation,
  dir: props.dir,
  loop: props.loop,
});
```

### Combobox

The package component fixes its flat item schema and filtering contract. Own
the complete mapping for a custom filter, remote-result policy, or navigation
algorithm.

Complete ownership keeps native form/reset/validity/focus mechanics in the
same Behavior call:

```ts
const combobox = useCombobox<ComboboxOption>({
  items: () => (props.loading ? [] : props.items),
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
  isDisabled: (item) => item.disabled ?? false,
  inputValue,
  selected,
  disabled: () => props.disabled,
  readOnly: () => props.readOnly,
  required: () => props.required,
  validationMessage: () => props.validationMessage,
  openWhenEmpty: true,
});
```

The clear button consumes `v-bind="combobox.clearButtonProps"`; programmatic
clearing remains available as `combobox.clear()` without moving focus.

## Thin components

The same function name covers package defaults and complete ownership:

| Component  | Package mapping              | Complete form                                                |
| ---------- | ---------------------------- | ------------------------------------------------------------ |
| Popover    | `usePopover(props, open)`    | `usePopover({ open, anchor: { area: "block-end" } })`        |
| Tooltip    | `useTooltip(props, open)`    | `useTooltip({ open, openDelay: 0 })`                         |
| Dialog     | `useDialog(props, open)`     | `useDialog({ open, modal: true, closedby: "closerequest" })` |
| Disclosure | `useDisclosure(props, open)` | `useDisclosure({ open, name: "faq" })`                       |
| Toggle     | `useToggle(props, pressed)`  | `useToggle({ pressed, disabled: false })`                    |

Prefer the component's named props before replacing its mapping.
Fixed mechanisms such as AlertDialog identity, native form reset, focus repair,
Avatar image-race handling, Toast lifecycle, and Button activation suppression
do not gain override bags. Menu union branches and public event transforms stay
beside owned renderer code instead of moving into a configurable composable.

## Update consequence

The props/model overload continues to receive package mapping improvements after
the SFC is owned. The one-argument full form opts out from future changes to that
mapping; fixes inside the shared state machine and fixed native helper still
arrive normally.

`nagi-ui diff` compares owned source files, not the implementation of imported
composables. Commit immediately after `own`, review composable changes in
release notes, and run the shipped real-browser consumer recipe after package
updates or behavior customization.
