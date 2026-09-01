/**
 * Finite, build-time style axes for Nagi components.
 *
 * Public axis properties remain in the emitted CSS as the author-facing
 * contract. The compiler adds private, concrete variables beside them so
 * browsers do not need same-element CSS style queries to render the result.
 */
export const nagiStyleAxes = Object.freeze({
  button: Object.freeze({
    tone: Object.freeze({
      property: "--button-tone",
      default: "neutral",
      inherits: false,
      values: Object.freeze({
        neutral: Object.freeze({
          "--_button-tone-color": "var(--nagi-color-text)",
          "--_button-tone-border": "var(--nagi-color-border)",
          "--_button-tone-surface": "var(--nagi-color-surface-active)",
          "--_button-tone-contrast": "var(--nagi-color-surface)",
        }),
        accent: Object.freeze({
          "--_button-tone-color": "var(--nagi-color-accent)",
          "--_button-tone-border": "var(--nagi-color-accent)",
          "--_button-tone-surface": "var(--nagi-color-surface-accent)",
          "--_button-tone-contrast": "var(--nagi-color-surface)",
        }),
        danger: Object.freeze({
          "--_button-tone-color": "var(--nagi-color-danger)",
          "--_button-tone-border": "var(--nagi-color-danger)",
          "--_button-tone-surface": "var(--nagi-color-surface-danger)",
          "--_button-tone-contrast": "var(--nagi-color-surface)",
        }),
      }),
    }),
    appearance: Object.freeze({
      property: "--button-appearance",
      default: "outlined",
      inherits: false,
      values: Object.freeze({
        outlined: Object.freeze({
          "--_button-background": "var(--nagi-color-surface)",
          "--_button-border-color": "var(--_button-tone-border, var(--nagi-color-border))",
          "--_button-color": "var(--_button-tone-color, var(--nagi-color-text))",
          "--_button-hover-background":
            "var(--_button-tone-surface, var(--nagi-color-surface-active))",
        }),
        solid: Object.freeze({
          "--_button-background": "var(--_button-tone-color, var(--nagi-color-text))",
          "--_button-border-color": "var(--_button-tone-color, var(--nagi-color-text))",
          "--_button-color": "var(--_button-tone-contrast, var(--nagi-color-surface))",
          "--_button-hover-background": "var(--_button-tone-color, var(--nagi-color-text))",
        }),
        ghost: Object.freeze({
          "--_button-background": "transparent",
          "--_button-border-color": "transparent",
          "--_button-color": "var(--_button-tone-color, var(--nagi-color-text))",
          "--_button-hover-background":
            "var(--_button-tone-surface, var(--nagi-color-surface-active))",
        }),
      }),
    }),
    shape: Object.freeze({
      property: "--button-shape",
      default: "rounded",
      inherits: false,
      values: Object.freeze({
        square: Object.freeze({ "--_button-radius": "0" }),
        rounded: Object.freeze({ "--_button-radius": "var(--nagi-radius-control)" }),
        pill: Object.freeze({ "--_button-radius": "9999px" }),
      }),
    }),
    size: Object.freeze({
      property: "--button-size",
      default: "medium",
      inherits: false,
      values: Object.freeze({
        small: Object.freeze({
          "--_button-min-block-size": "1.75rem",
          "--_button-padding": "var(--n-space-3) var(--nagi-space-item-gap)",
          "--_button-font-size": "var(--n-font-size-3)",
        }),
        medium: Object.freeze({
          "--_button-min-block-size": "var(--nagi-size-control)",
          "--_button-padding": "var(--nagi-space-control)",
          "--_button-font-size": "1em",
        }),
        large: Object.freeze({
          "--_button-min-block-size": "2.5rem",
          "--_button-padding": "var(--n-space-6) var(--n-space-8)",
          "--_button-font-size": "var(--n-font-size-5)",
        }),
      }),
    }),
  }),
});

const axesByProperty = new Map(
  Object.entries(nagiStyleAxes).flatMap(([component, axes]) =>
    Object.entries(axes).map(([name, axis]) => [axis.property, { component, name, ...axis }]),
  ),
);

const componentBoundaryPatterns = Object.freeze({
  button: Object.freeze([
    /(?:^|[^a-zA-Z0-9_-])\.n-button(?![a-zA-Z0-9_-])/u,
    /\[data-scope=["']?button["']?\][^,{]*\[data-part=["']?root["']?\]/u,
  ]),
});

function splitSelectorList(selector) {
  const selectors = [];
  let start = 0;
  let depth = 0;
  let quote = "";

  for (let index = 0; index < selector.length; index += 1) {
    const character = selector[index];
    if (quote) {
      if (character === quote && selector[index - 1] !== "\\") quote = "";
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === "(" || character === "[") depth += 1;
    else if (character === ")" || character === "]") depth -= 1;
    else if (character === "," && depth === 0) {
      selectors.push(selector.slice(start, index).trim());
      start = index + 1;
    }
  }
  selectors.push(selector.slice(start).trim());
  return selectors;
}

function selectorTargetsComponent(selector, component) {
  const patterns = componentBoundaryPatterns[component] ?? [];
  return splitSelectorList(selector).every((item) =>
    patterns.some((pattern) => pattern.test(item)),
  );
}

function ruleTargetsComponent(rule, component) {
  if (selectorTargetsComponent(rule.selector, component)) return true;
  const selectors = splitSelectorList(rule.selector);
  const refinesParentBoundary = selectors.every(
    (selector) => selector.startsWith("&") && !/[\s>+~]/u.test(selector),
  );
  return (
    refinesParentBoundary &&
    rule.parent?.type === "rule" &&
    ruleTargetsComponent(rule.parent, component)
  );
}

const privateProperties = new Set(
  [...axesByProperty.values()].flatMap((axis) =>
    Object.values(axis.values).flatMap((declarations) => Object.keys(declarations)),
  ),
);

/** Registrations consumed by theme/style-axes.css and checked for parity. */
export const nagiStylePropertyRegistrations = Object.freeze([
  ...[...axesByProperty.values()].map((axis) =>
    Object.freeze({
      property: axis.property,
      syntax: Object.keys(axis.values).join(" | "),
      inherits: axis.inherits,
      initialValue: axis.default,
      visibility: "public",
    }),
  ),
  ...[...privateProperties].map((property) =>
    Object.freeze({
      property,
      syntax: "*",
      inherits: false,
      visibility: "private",
    }),
  ),
]);

/** Resolve one public style-axis declaration into concrete private variables. */
export function expandNagiStyleDeclaration(property, value) {
  const axis = axesByProperty.get(property);
  if (!axis) return null;

  const keyword = value.trim();
  const declarations = axis.values[keyword];
  if (!declarations) {
    const accepted = Object.keys(axis.values).join(", ");
    throw new Error(
      `Unknown ${axis.component} ${axis.name} value "${keyword}" for ${property}. Expected one of: ${accepted}.`,
    );
  }

  return Object.entries(declarations).map(([generatedProperty, generatedValue]) => ({
    property: generatedProperty,
    value: generatedValue,
  }));
}

/**
 * PostCSS-compatible compiler. Add `nagiStyleCompiler()` to a Vite, Nuxt, or
 * PostCSS pipeline that processes the application's authored CSS.
 */
export function nagiStyleCompiler() {
  return {
    postcssPlugin: "nagi-style-compiler",
    Declaration(declaration) {
      let expansion;
      try {
        expansion = expandNagiStyleDeclaration(declaration.prop, declaration.value);
      } catch (error) {
        throw declaration.error(error instanceof Error ? error.message : String(error), {
          plugin: "nagi-style-compiler",
        });
      }
      if (!expansion) return;

      const axis = axesByProperty.get(declaration.prop);
      const rule = declaration.parent;
      if (!axis || rule?.type !== "rule" || !ruleTargetsComponent(rule, axis.component)) {
        throw declaration.error(
          `${declaration.prop} is a component-local ${axis?.component ?? "Nagi"} axis. Declare it on .n-${axis?.component ?? "component"} or an owned [data-scope="${axis?.component ?? "component"}"][data-part="root"] boundary, not on an ancestor.`,
          { plugin: "nagi-style-compiler" },
        );
      }

      for (const generated of expansion) {
        declaration.cloneBefore({
          prop: generated.property,
          value: generated.value,
        });
      }
    },
  };
}

nagiStyleCompiler.postcss = true;

export default nagiStyleCompiler;
