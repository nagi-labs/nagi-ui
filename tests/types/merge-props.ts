import { mergeNagiProps, type MergedNagiProps } from "@nagi-labs/nagi-ui"

const merged = mergeNagiProps(
  { id: "actions", role: "menu" as const, onClick: (_event: MouseEvent) => undefined },
  { class: "menu", "aria-labelledby": "actions-label" },
)

const id: string = merged.id
const role: "menu" = merged.role
const className: string = merged.class
const labelledBy: string = merged["aria-labelledby"]
merged.onClick(new MouseEvent("click"))

type Explicit = MergedNagiProps<[
  { popovertarget: string },
  { class: string },
]>

const explicit: Explicit = { popovertarget: "actions", class: "trigger" }

void id
void role
void className
void labelledBy
void explicit
