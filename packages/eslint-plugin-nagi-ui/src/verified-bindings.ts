import type { Rule } from "eslint"

interface ExpressionNode {
  type: string
  name?: string
  computed?: boolean
  callee?: ExpressionNode
  arguments?: ExpressionNode[]
  expression?: ExpressionNode
  object?: ExpressionNode
  property?: ExpressionNode
}

interface VIdentifier {
  type: "VIdentifier"
  name: string
}

interface VExpressionContainer {
  type: "VExpressionContainer"
  expression: ExpressionNode | null
}

interface VDirectiveKey {
  name: VIdentifier
  argument: VIdentifier | VExpressionContainer | null
}

interface VStaticAttribute {
  type: "VAttribute"
  directive: false
  key: VIdentifier
  value: { value: string } | null
}

interface VDirective {
  type: "VAttribute"
  directive: true
  key: VDirectiveKey
  value: VExpressionContainer | null
}

type VAttribute = VStaticAttribute | VDirective

interface VStartTag {
  type: "VStartTag"
  attributes: VAttribute[]
}

interface VDocumentFragment {
  type: "VDocumentFragment"
}

interface VElement {
  type: "VElement"
  name: string
  rawName: string
  startTag: VStartTag
  parent: VElement | VDocumentFragment
}

interface BindingContract {
  tags?: readonly string[]
  requireButtonType?: boolean
  requireAnchorHref?: boolean
  requirePopover?: boolean
  protectedAttributes: ReadonlySet<string>
}

const set = (...values: string[]) => new Set(values)

const contracts: Record<string, BindingContract> = {
  triggerProps: {
    tags: ["button", "a"],
    requireButtonType: true,
    requireAnchorHref: true,
    protectedAttributes: set(
      "id",
      "popovertarget",
      "aria-controls",
      "aria-haspopup",
      "command",
      "commandfor",
    ),
  },
  submenuTriggerProps: {
    tags: ["button"],
    requireButtonType: true,
    protectedAttributes: set(
      "id",
      "role",
      "tabindex",
      "popovertarget",
      "aria-controls",
      "aria-haspopup",
      "aria-expanded",
      "aria-disabled",
    ),
  },
  itemProps: {
    tags: ["button", "a"],
    requireButtonType: true,
    requireAnchorHref: true,
    protectedAttributes: set("id", "role", "tabindex", "aria-disabled"),
  },
  checkboxItemProps: {
    tags: ["button"],
    requireButtonType: true,
    protectedAttributes: set(
      "id",
      "role",
      "tabindex",
      "aria-disabled",
      "aria-checked",
    ),
  },
  radioItemProps: {
    tags: ["button"],
    requireButtonType: true,
    protectedAttributes: set(
      "id",
      "role",
      "tabindex",
      "aria-disabled",
      "aria-checked",
    ),
  },
  menuProps: {
    tags: ["ul"],
    requirePopover: true,
    protectedAttributes: set(
      "id",
      "role",
      "tabindex",
      "dir",
      "aria-labelledby",
    ),
  },
  listboxProps: {
    tags: ["ul"],
    protectedAttributes: set(
      "id",
      "role",
      "tabindex",
      "aria-activedescendant",
      "aria-multiselectable",
      "aria-orientation",
    ),
  },
  optionProps: {
    tags: ["li"],
    protectedAttributes: set(
      "id",
      "role",
      "tabindex",
      "aria-selected",
      "aria-disabled",
      "data-active",
    ),
  },
  tablistProps: {
    tags: ["div"],
    protectedAttributes: set(
      "id",
      "role",
      "dir",
      "aria-label",
      "aria-labelledby",
      "aria-orientation",
    ),
  },
  tabProps: {
    tags: ["button"],
    protectedAttributes: set(
      "id",
      "role",
      "type",
      "disabled",
      "tabindex",
      "aria-selected",
      "aria-controls",
    ),
  },
  panelProps: {
    protectedAttributes: set(
      "id",
      "role",
      "tabindex",
      "hidden",
      "aria-labelledby",
    ),
  },
  inputProps: {
    tags: ["input"],
    protectedAttributes: set(
      "id",
      "role",
      "value",
      "aria-autocomplete",
      "aria-controls",
      "aria-expanded",
      "aria-activedescendant",
      "aria-required",
      "aria-label",
      "aria-invalid",
      "disabled",
      "readonly",
    ),
  },
  popoverProps: {
    requirePopover: true,
    protectedAttributes: set("id"),
  },
  popupProps: {
    requirePopover: true,
    protectedAttributes: set("id"),
  },
  tooltipProps: {
    requirePopover: true,
    protectedAttributes: set("id", "role"),
  },
  dialogProps: {
    tags: ["dialog"],
    protectedAttributes: set("id", "closedby"),
  },
  detailsProps: {
    tags: ["details"],
    protectedAttributes: set("id", "open", "name"),
  },
  summaryProps: {
    tags: ["summary"],
    protectedAttributes: set("aria-disabled"),
  },
  regionProps: {
    protectedAttributes: set("id", "popover", "aria-live"),
  },
  gridProps: {
    tags: ["table"],
    protectedAttributes: set(
      "id",
      "role",
      "aria-label",
      "aria-disabled",
      "aria-readonly",
      "aria-required",
      "aria-invalid",
    ),
  },
  gridCellProps: {
    tags: ["td"],
    protectedAttributes: set("role", "aria-selected", "aria-disabled"),
  },
  cellButtonProps: {
    tags: ["button"],
    protectedAttributes: set(
      "id",
      "type",
      "tabindex",
      "disabled",
      "aria-label",
      "aria-current",
    ),
  },
  previousButtonProps: {
    tags: ["button"],
    protectedAttributes: set("type", "disabled", "aria-label"),
  },
  nextButtonProps: {
    tags: ["button"],
    protectedAttributes: set("type", "disabled", "aria-label"),
  },
  fieldProps: {
    tags: ["div"],
    protectedAttributes: set(
      "id",
      "role",
      "dir",
      "aria-label",
      "aria-disabled",
      "aria-readonly",
      "aria-required",
      "aria-invalid",
    ),
  },
  segmentProps: {
    tags: ["span"],
    protectedAttributes: set(
      "id",
      "role",
      "tabindex",
      "aria-hidden",
      "aria-label",
      "aria-valuemin",
      "aria-valuemax",
      "aria-valuenow",
      "aria-valuetext",
      "aria-disabled",
      "aria-readonly",
      "contenteditable",
      "inputmode",
      "spellcheck",
    ),
  },
  formValueProps: {
    tags: ["input"],
    protectedAttributes: set(
      "type",
      "tabindex",
      "aria-hidden",
      "name",
      "form",
      "value",
      "min",
      "max",
      "step",
      "disabled",
      "readonly",
      "required",
    ),
  },
  startFormValueProps: {
    tags: ["input"],
    protectedAttributes: set(
      "type",
      "tabindex",
      "aria-hidden",
      "name",
      "form",
      "value",
      "min",
      "max",
      "disabled",
      "required",
    ),
  },
  endFormValueProps: {
    tags: ["input"],
    protectedAttributes: set(
      "type",
      "tabindex",
      "aria-hidden",
      "name",
      "form",
      "value",
      "min",
      "max",
      "disabled",
      "required",
    ),
  },
  contextTriggerProps: {
    tags: ["div"],
    protectedAttributes: set(),
  },
  toolbarProps: {
    tags: ["div"],
    protectedAttributes: set("id", "role", "aria-label", "aria-orientation"),
  },
  separatorProps: {
    tags: ["div"],
    protectedAttributes: set(
      "id",
      "role",
      "tabindex",
      "aria-label",
      "aria-controls",
      "aria-orientation",
      "aria-valuemin",
      "aria-valuemax",
      "aria-valuenow",
      "aria-disabled",
    ),
  },
  primaryPanelProps: {
    tags: ["section"],
    protectedAttributes: set("id"),
  },
  rootProps: {
    tags: ["section"],
    protectedAttributes: set("id", "role", "aria-label", "aria-disabled"),
  },
  viewportProps: {
    tags: ["div"],
    protectedAttributes: set("role", "tabindex", "aria-label", "aria-roledescription"),
  },
  slideProps: {
    tags: ["article"],
    protectedAttributes: set("id", "role", "aria-label"),
  },
  formProps: {
    tags: ["select"],
    protectedAttributes: set("multiple", "name", "form", "disabled", "required", "tabindex", "aria-hidden"),
  },
  menubarProps: {
    tags: ["div"],
    protectedAttributes: set("id", "role", "aria-orientation", "aria-label", "dir"),
  },
  actionProps: {
    tags: ["button", "a"],
    requireButtonType: true,
    requireAnchorHref: true,
    protectedAttributes: set("id", "role", "tabindex", "aria-disabled"),
  },
  menubarTriggerProps: {
    tags: ["button"],
    requireButtonType: true,
    protectedAttributes: set(
      "id",
      "role",
      "tabindex",
      "popovertarget",
      "popovertargetaction",
      "aria-haspopup",
      "aria-controls",
      "aria-expanded",
      "aria-disabled",
    ),
  },
  navProps: {
    tags: ["nav"],
    protectedAttributes: set("id", "aria-label"),
  },
  navigationTriggerProps: {
    tags: ["button"],
    protectedAttributes: set(
      "id",
      "type",
      "popovertarget",
      "popovertargetaction",
      "aria-controls",
      "aria-expanded",
    ),
  },
  otpInputProps: {
    tags: ["input"],
    protectedAttributes: set(
      "id",
      "type",
      "value",
      "name",
      "form",
      "inputmode",
      "autocomplete",
      "minlength",
      "maxlength",
      "pattern",
      "aria-label",
      "aria-invalid",
      "disabled",
      "readonly",
      "required",
    ),
  },
  treeProps: {
    tags: ["ul"],
    protectedAttributes: set("id", "role", "tabindex", "aria-label", "aria-activedescendant"),
  },
  groupProps: {
    tags: ["ul"],
    protectedAttributes: set("role"),
  },
  treeItemProps: {
    tags: ["li"],
    protectedAttributes: set(
      "id",
      "role",
      "aria-level",
      "aria-posinset",
      "aria-setsize",
      "aria-selected",
      "aria-expanded",
      "aria-disabled",
      "aria-busy",
      "aria-label",
      "data-active",
    ),
  },
}

function directiveName(attribute: VDirective): string {
  return attribute.key.name.name
}

function directiveArgument(attribute: VDirective): string | null {
  const argument = attribute.key.argument
  return argument?.type === "VIdentifier" ? argument.name : null
}

function expressionPath(expression: ExpressionNode | null): string | null {
  if (!expression) return null
  if (expression.type === "Identifier") return expression.name ?? null
  if (expression.type === "CallExpression") {
    return expressionPath(expression.callee ?? null)
  }
  if (expression.type === "ChainExpression") {
    return expressionPath(expression.expression ?? null)
  }
  if (
    expression.type === "MemberExpression" &&
    !expression.computed &&
    expression.property?.type === "Identifier"
  ) {
    const object = expressionPath(expression.object ?? null)
    const property = expression.property.name
    if (!property) return object
    return object ? `${object}.${property}` : property
  }
  return null
}

function objectBindingPath(attribute: VAttribute): string | null {
  if (
    !attribute.directive ||
    directiveName(attribute) !== "bind" ||
    attribute.key.argument !== null
  ) {
    return null
  }
  return expressionPath(attribute.value?.expression ?? null)
}

function behaviorBindingPaths(attribute: VAttribute): string[] {
  if (
    !attribute.directive ||
    directiveName(attribute) !== "bind" ||
    attribute.key.argument !== null
  ) {
    return []
  }
  const expression = attribute.value?.expression ?? null
  if (
    expression?.type === "CallExpression" &&
    expressionPath(expression.callee ?? null)?.split(".").at(-1) === "mergeElementProps"
  ) {
    return (expression.arguments ?? [])
      .map((argument) => expressionPath(argument))
      .filter((path): path is string => path !== null)
  }
  const path = expressionPath(expression)
  return path === null ? [] : [path]
}

function contractName(path: string | null): string | null {
  const name = path?.split(".").at(-1)
  return name && name in contracts ? name : null
}

function directAttributeName(attribute: VAttribute): string | null {
  if (!attribute.directive) return attribute.key.name
  if (directiveName(attribute) !== "bind" || attribute.key.argument === null) return null
  return directiveArgument(attribute)
}

function hasAttribute(element: VElement, name: string): boolean {
  return element.startTag.attributes.some((attribute) => directAttributeName(attribute) === name)
}

function hasStaticButtonType(element: VElement): boolean {
  return element.startTag.attributes.some(
    (attribute) =>
      !attribute.directive &&
      attribute.key.name === "type" &&
      attribute.value?.value === "button",
  )
}

function hasDirective(element: VElement, name: string): boolean {
  return element.startTag.attributes.some(
    (attribute) => attribute.directive && directiveName(attribute) === name,
  )
}

function nearestForOwner(element: VElement): VElement | null {
  let current: VElement | VDocumentFragment = element
  while (current.type === "VElement") {
    if (hasDirective(current, "for")) return current
    current = current.parent
  }
  return null
}

export const verifiedBindingsRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "verify Nagi behavior prop bindings in Vue templates",
    },
    schema: [],
    messages: {
      wrongElement: "{{binding}} must be applied to {{expected}}, not <{{actual}}>.",
      missingButtonType: "A button using {{binding}} must declare type=\"button\".",
      missingAnchorHref: "An anchor using {{binding}} must declare href.",
      missingPopover: "An element using {{binding}} must declare the native popover attribute.",
      protectedOverride:
        "{{attribute}} is owned by {{binding}}. Remove the direct attribute instead of overriding behavior wiring.",
      multipleObjectBindings:
        "Merge object bindings with mergeElementProps() before applying {{binding}}.",
      missingKey: "The v-for owning {{binding}} must declare :key.",
    },
  },
  create(context) {
    const services = context.sourceCode.parserServices as {
      defineTemplateBodyVisitor?: (
        templateVisitor: Record<string, (node: VElement) => void>,
      ) => Rule.RuleListener
    }
    if (!services.defineTemplateBodyVisitor) return {}

    return services.defineTemplateBodyVisitor({
      VElement(element) {
        const objectBindings = element.startTag.attributes
          .map((attribute) => ({ attribute, path: objectBindingPath(attribute) }))
          .filter((entry) => entry.path !== null)
        const behaviorBindings = element.startTag.attributes
          .flatMap((attribute) => behaviorBindingPaths(attribute)
            .map((path) => ({ attribute, path, name: contractName(path) })))
          .filter((entry): entry is typeof entry & { name: string } => entry.name !== null)

        for (const binding of behaviorBindings) {
          const contract = contracts[binding.name]
          if (!contract) continue

          if (contract.tags && !contract.tags.includes(element.name)) {
            context.report({
              node: binding.attribute,
              messageId: "wrongElement",
              data: {
                binding: binding.name,
                expected: contract.tags.map((tag) => `<${tag}>`).join(" or "),
                actual: element.rawName,
              },
            })
          }

          if (
            contract.requireButtonType &&
            element.name === "button" &&
            !hasStaticButtonType(element)
          ) {
            context.report({
              node: element.startTag,
              messageId: "missingButtonType",
              data: { binding: binding.name },
            })
          }

          if (
            contract.requireAnchorHref &&
            element.name === "a" &&
            !hasAttribute(element, "href")
          ) {
            context.report({
              node: element.startTag,
              messageId: "missingAnchorHref",
              data: { binding: binding.name },
            })
          }

          if (contract.requirePopover && !hasAttribute(element, "popover")) {
            context.report({
              node: element.startTag,
              messageId: "missingPopover",
              data: { binding: binding.name },
            })
          }

          for (const attribute of element.startTag.attributes) {
            const name = directAttributeName(attribute)
            if (name && contract.protectedAttributes.has(name)) {
              context.report({
                node: attribute,
                messageId: "protectedOverride",
                data: { attribute: name, binding: binding.name },
              })
            }
          }

          if (objectBindings.length > 1) {
            context.report({
              node: binding.attribute,
              messageId: "multipleObjectBindings",
              data: { binding: binding.name },
            })
          }

          const forOwner = nearestForOwner(element)
          if (forOwner && !hasAttribute(forOwner, "key")) {
            context.report({
              node: forOwner.startTag,
              messageId: "missingKey",
              data: { binding: binding.name },
            })
          }
        }
      },
    })
  },
}
