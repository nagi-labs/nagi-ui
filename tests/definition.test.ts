import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  adoptRequirementSet,
  assertDefinition,
  validateDefinition,
  verifyAnatomy,
  type ComponentDefinition,
} from "../packages/core/src/definition.ts";
import { nagiButtonRequirementsV1 } from "../packages/core/src/standards/nagi-button.ts";
import { buttonDefinition } from "../packages/core/blueprints/button/button.definition.ts";
import { carouselDefinition } from "../packages/core/blueprints/carousel/carousel.definition.ts";
import { comboboxDefinition } from "../packages/core/blueprints/combobox/combobox.definition.ts";
import { dialogDefinition } from "../packages/core/blueprints/dialog/dialog.definition.ts";
import { toastDefinition } from "../packages/core/blueprints/toast/toast.definition.ts";
import { components } from "../packages/core/cli/ownership.mjs";
import {
  assertContractRequirements,
  definitionRequirementIds,
} from "../packages/core/src/test/definition-contract.ts";
import { assertDefinitionEvidence } from "../scripts/audits/definition-evidence.ts";

/**
 * `verifyAnatomy` uses a narrow Element surface: attributes, descendants,
 * direct children, and parent links.
 * The repository has no DOM implementation, so these tests build that surface
 * directly. Real rendered DOM is covered by `tests/browser/anatomy.spec.ts`,
 * which runs the same definitions against the shipped components.
 */
interface FakeSpec {
  tag: string;
  attrs?: Record<string, string>;
  children?: FakeSpec[];
  text?: string;
}

function build(spec: FakeSpec, parent: Element | null = null): Element {
  const attrs = spec.attrs ?? {};
  const children: Element[] = [];
  const element = {
    tagName: spec.tag.toUpperCase(),
    parentElement: parent,
    getAttribute: (name: string) => attrs[name] ?? null,
    hasAttribute: (name: string) => name in attrs,
    get textContent() {
      return [spec.text ?? "", ...children.map((child) => child.textContent ?? "")].join("");
    },
    querySelectorAll: (selector: string) => {
      assert.equal(selector, "*", "the verifier only walks descendants");
      const walk = (node: Element): Element[] =>
        (node as unknown as { children: Element[] }).children.flatMap((child) => [
          child,
          ...walk(child),
        ]);
      return walk(element as unknown as Element);
    },
    children,
  } as unknown as Element;

  for (const child of spec.children ?? []) {
    children.push(build(child, element));
  }
  return element;
}

function slide(label: string, position: number): FakeSpec {
  const labelId = `slide-${position}-label`;
  return {
    tag: "article",
    attrs: {
      "data-scope": "carousel",
      "data-part": "slide",
      role: "group",
      "aria-roledescription": "slide",
      "aria-labelledby": labelId,
    },
    children: [{ tag: "h2", attrs: { id: labelId }, text: label }],
  };
}

function carousel(
  options: {
    wrapSlides?: boolean;
    omitViewport?: boolean;
    omitViewportLabel?: boolean;
    omitViewportPart?: boolean;
  } = {},
): Element {
  const slides = [slide("First, 1 / 2", 1), slide("Second, 2 / 2", 2)];
  const viewportChildren = options.wrapSlides ? [{ tag: "div", children: slides }] : slides;
  return build({
    tag: "section",
    attrs: {
      "data-scope": "carousel",
      "data-part": "root",
      role: "region",
      "aria-roledescription": "carousel",
      "aria-label": "Release highlights",
    },
    children: [
      {
        tag: "div",
        children: [
          { tag: "button", attrs: { type: "button", "aria-label": "Previous slide" } },
          { tag: "button", attrs: { type: "button", "aria-label": "Next slide" } },
        ],
      },
      ...(options.omitViewport
        ? slides
        : [
            {
              tag: "div",
              attrs: {
                "data-scope": "carousel",
                ...(options.omitViewportPart ? {} : { "data-part": "viewport" }),
                role: "group",
                "aria-roledescription": "slides",
                ...(options.omitViewportLabel ? {} : { "aria-label": "Release highlights" }),
              },
              children: viewportChildren,
            },
          ]),
    ],
  });
}

test("[CAR-SEM-06] canonical carousel structure satisfies its declared anatomy", () => {
  assert.deepEqual(verifyAnatomy(carouselDefinition, carousel()), []);
});

test("[CAR-ANAT-01] layout wrappers between viewport and slides are accepted", () => {
  const issues = verifyAnatomy(carouselDefinition, carousel({ wrapSlides: true }));
  assert.deepEqual(issues, []);
});

test("removing the behavior-bearing viewport prevents slide scoping", () => {
  const issues = verifyAnatomy(carouselDefinition, carousel({ omitViewport: true }));

  assert.deepEqual(
    issues.map((issue) => [issue.code, issue.part]),
    [
      ["missing-part", "viewport"],
      ["missing-parent", "slide"],
    ],
  );
});

test("[CAR-ANAT-01] removing the viewport part marker breaks the anatomy contract", () => {
  const issues = verifyAnatomy(carouselDefinition, carousel({ omitViewportPart: true }));

  assert.deepEqual(
    issues.map((issue) => [issue.code, issue.part]),
    [
      ["missing-part", "viewport"],
      ["missing-parent", "slide"],
    ],
  );
});

test("the viewport accessible name remains a semantics concern rather than an anatomy locator", () => {
  assert.deepEqual(verifyAnatomy(carouselDefinition, carousel({ omitViewportLabel: true })), []);
});

test("nested groups inside slide content are not confused with carousel parts", () => {
  const rendered = carousel();
  const firstSlide = Array.from(rendered.querySelectorAll("*")).find(
    (element) => element.getAttribute("aria-labelledby") === "slide-1-label",
  );
  assert.ok(firstSlide);
  (firstSlide as unknown as { children: Element[] }).children.push(
    build(
      {
        tag: "div",
        attrs: {
          role: "group",
          "aria-roledescription": "slide",
          "aria-label": "Nested slide",
        },
      },
      firstSlide,
    ),
  );

  const issues = verifyAnatomy(carouselDefinition, rendered);
  assert.deepEqual(issues, []);
});

test("slide naming remains a semantics concern rather than an anatomy locator", () => {
  const rendered = carousel();
  const slides = Array.from(rendered.querySelectorAll("*")).filter(
    (element) => element.getAttribute("aria-roledescription") === "slide",
  );
  assert.equal(slides.length, 2);
  for (const slide of slides) {
    const getAttribute = slide.getAttribute.bind(slide);
    (slide as unknown as { getAttribute: (name: string) => string | null }).getAttribute = (
      name,
    ) => (name === "aria-labelledby" ? null : getAttribute(name));
  }

  const issues = verifyAnatomy(carouselDefinition, rendered);
  assert.deepEqual(issues, []);
});

test("non-slide layout descendants do not become Carousel slides", () => {
  const rendered = carousel();
  const firstSlide = Array.from(rendered.querySelectorAll("*")).find(
    (element) => element.getAttribute("aria-labelledby") === "slide-1-label",
  );
  const viewport = firstSlide?.parentElement;
  assert.ok(viewport);
  (viewport as unknown as { children: Element[] }).children.push(
    build({ tag: "aside", text: "Not a slide" }, viewport),
  );

  const issues = verifyAnatomy(carouselDefinition, rendered);
  assert.deepEqual(issues, []);
});

test("[BTN-ANAT-01] button anatomy resolves against its scoped root part", () => {
  const root: FakeSpec = {
    tag: "button",
    attrs: { "data-scope": "button", "data-part": "root" },
  };
  const withinWrapper = build({ tag: "div", children: [root] });
  const bare = build(root);

  assert.deepEqual(verifyAnatomy(buttonDefinition, withinWrapper), []);
  assert.deepEqual(verifyAnatomy(buttonDefinition, bare), []);
});

test("a component rendered without its only part is reported", () => {
  const issues = verifyAnatomy(buttonDefinition, build({ tag: "div", children: [{ tag: "a" }] }));

  assert.deepEqual(
    issues.map((issue) => [issue.code, issue.part]),
    [["missing-part", "root"]],
  );
});

test("an optional part may be absent", () => {
  const definition: ComponentDefinition = {
    ...buttonDefinition,
    anatomy: [
      ...buttonDefinition.anatomy,
      {
        name: "icon",
        description: "Optional leading icon.",
        match: { by: "marker", attribute: "data-icon" },
        within: "root",
        required: false,
      },
    ],
  };

  assert.deepEqual(
    verifyAnatomy(
      definition,
      build({
        tag: "button",
        attrs: { "data-scope": "button", "data-part": "root" },
      }),
    ),
    [],
  );
});

test("definitions travel with the source they describe", () => {
  for (const [key, file] of [
    ["alert-dialog", "alert-dialog.definition.ts"],
    ["button", "button.definition.ts"],
    ["carousel", "carousel.definition.ts"],
    ["combobox", "combobox.definition.ts"],
    ["date-picker", "date-picker.definition.ts"],
    ["dialog", "dialog.definition.ts"],
    ["dropdown-menu", "dropdown-menu.definition.ts"],
    ["listbox", "listbox.definition.ts"],
    ["popover", "popover.definition.ts"],
  ] as const) {
    const entry = components[key];
    assert.ok(entry, `${key} is registered for ownership`);
    assert.ok(
      entry.files.includes(file),
      `${key} ownership bundle includes ${file} so an owner receives the guarantees with the source`,
    );
    assert.ok(path.isAbsolute(path.resolve(entry.dir)), "ownership dir resolves");
  }
});

test("[CAR-ANAT-01] the viewport binding owns element registration", () => {
  const blueprintSource = readFileSync(
    path.join(import.meta.dirname, "../packages/core/blueprints/carousel/Carousel.vue"),
    "utf8",
  );
  const behaviorSource = readFileSync(
    path.join(import.meta.dirname, "../packages/core/src/carousel.ts"),
    "utf8",
  );

  assert.match(blueprintSource, /v-bind="carousel\.viewportProps"/u);
  assert.match(blueprintSource, /data-scope="carousel"[\s\S]*data-part="viewport"/u);
  assert.doesNotMatch(blueprintSource, /:ref=|setTrack|setViewport|as HTMLElement|as Element/u);
  assert.match(behaviorSource, /\[data-scope="carousel"\]\[data-part="slide"\]/u);
  assert.match(behaviorSource, /\[data-scope="carousel"\]\[data-part="root"\]/u);
  assert.doesNotMatch(
    behaviorSource,
    /const slideSelector = .*aria-roledescription|closest<HTMLElement>\(.*aria-roledescription/u,
  );
});

test("[ALD-ANAT-01][CMB-ANAT-01][DLG-ANAT-01] complete binding bundles own local element registration", () => {
  for (const [file, binding, forbidden] of [
    [
      "alert-dialog/AlertDialog.vue",
      "dialog.dialogProps",
      /document\.getElementById|:ref=|setDialog/u,
    ],
    [
      "combobox/Combobox.vue",
      "combobox.listboxProps",
      /document\.getElementById|:ref=|setListbox/u,
    ],
    ["dialog/Dialog.vue", "dialog.dialogProps", /document\.getElementById|:ref=|setDialog/u],
  ] as const) {
    const source = readFileSync(
      path.join(import.meta.dirname, `../packages/core/blueprints/${file}`),
      "utf8",
    );
    assert.match(source, new RegExp(`v-bind="${binding.replace(".", "\\.")}"`, "u"));
    assert.doesNotMatch(source, forbidden);
  }
});

function assertAuditMapping(
  definition: ComponentDefinition,
  auditFile: string,
  prefix: "BTN" | "CAR" | "CMB" | "DLG",
  traceEvidence = true,
) {
  const audit = readFileSync(path.resolve(auditFile), "utf8");
  const auditIds = new Set(
    audit.match(
      new RegExp(`${prefix}-(?:[A-Z]+-)*(?:SEM|STATE|INT|FOCUS|ANAT|STYLE)-\\d+`, "gu"),
    ) ?? [],
  );
  const entries = [
    ...definition.semantics,
    ...definition.state,
    ...definition.interaction,
    ...definition.focus,
    ...definition.style,
  ];
  assert.ok(entries.every((entry) => typeof entry !== "string"));
  const statements = entries.filter((entry) => typeof entry !== "string");
  const definitionIds = new Set([
    ...statements.map((entry) => entry.id),
    ...definition.anatomy.flatMap((part) => (part.id ? [part.id] : [])),
  ]);

  assert.deepEqual(definitionIds, auditIds);
  for (const statement of statements) {
    assert.ok(statement.source.length > 0, `${statement.id} names its authority`);
    assert.ok(statement.evidence.length > 0, `${statement.id} names executable evidence`);
    if (!traceEvidence) continue;
    for (const evidence of statement.evidence) {
      const testSource = readFileSync(path.resolve(evidence), "utf8");
      assert.match(testSource, new RegExp(statement.id), `${evidence} maps ${statement.id}`);
    }
  }
}

test("Button compatibility Definition still covers every audit row during catalog migration", () => {
  assertAuditMapping(buttonDefinition, "docs/audits/button-specification.md", "BTN", false);
});

test("Button separates its Component Contract from the native implementation", () => {
  assert.equal(buttonDefinition.version, "3.0");
  assert.equal(buttonDefinition.contract?.id, "nagi/button");
  assert.equal(buttonDefinition.contract?.revision, "2");
  assert.equal(buttonDefinition.implementation?.id, "nagi/blueprint/button");
  assert.equal(buttonDefinition.implementation?.strategy, "platform-first");
  assert.deepEqual(
    buttonDefinition.parts.map((part) => part.name),
    ["control"],
  );
  assert.equal(buttonDefinition.anatomy[0]?.contractPart, "control");
  assert.deepEqual(
    buttonDefinition.implementation?.references?.map(({ id, revision, reviewedAt }) => ({
      id,
      revision,
      reviewedAt,
    })),
    [
      {
        id: "html-button-ls",
        revision: "Living Standard snapshot",
        reviewedAt: "2026-09-02",
      },
    ],
  );
  assert.deepEqual(
    buttonDefinition.implementation?.decisions.map(({ name, value }) => ({ name, value })),
    [
      { name: "element", value: "button" },
      { name: "activation", value: "browser" },
      { name: "disabled", value: "native-by-default" },
      { name: "presence", value: "persistent" },
    ],
  );
  assert.equal(buttonDefinition.adoptions?.length, 1);
  const adoption = buttonDefinition.adoptions?.[0];
  assert.ok(adoption);
  assert.equal(adoption.requirementSet, "nagi/button");
  assert.equal(adoption.requirementSetVersion, "2");
  assert.deepEqual(adoption.profile, {
    semantics: "button",
    naming: "accessible-name",
    disabled: "perceivable-inoperable",
    activation: "click-enter-space",
  });
  assert.deepEqual(
    adoption.references.map(({ id, revision, reviewedAt }) => ({ id, revision, reviewedAt })),
    [
      {
        id: "accname-1.1",
        revision: "1.1 Recommendation (2018-12-18)",
        reviewedAt: "2026-09-02",
      },
      {
        id: "apg-button",
        revision: "Rolling guidance snapshot",
        reviewedAt: "2026-09-02",
      },
    ],
  );

  const statements = [
    ...buttonDefinition.semantics,
    ...buttonDefinition.state,
    ...buttonDefinition.interaction,
    ...buttonDefinition.focus,
    ...buttonDefinition.style,
  ].filter((entry) => typeof entry !== "string");
  const standard = statements.filter((statement) => statement.origin?.kind === "standard");
  assert.deepEqual(
    standard.map((statement) => statement.id),
    ["BTN-SEM-01", "BTN-STATE-01", "BTN-INT-01"],
  );
  assert.ok(
    statements
      .filter((statement) => !standard.includes(statement))
      .every((statement) => statement.origin?.kind === "nagi"),
    "every Button-specific statement names its Nagi policy",
  );
});

test("adopting a standard Requirement without component evidence fails immediately", () => {
  assert.throws(
    () =>
      adoptRequirementSet(nagiButtonRequirementsV1, {
        prefix: "BROKEN",
        profile: {
          element: "button",
          naming: "native-accessible-name",
          disabled: "native",
          activation: "browser",
        },
        evidence: {},
      }),
    /SEM-01.*needs component evidence/u,
  );
});

test("a Requirement set rejects an unsupported adoption profile", () => {
  assert.throws(
    () =>
      adoptRequirementSet(nagiButtonRequirementsV1, {
        prefix: "BROKEN",
        profile: {
          element: "div",
          naming: "native-accessible-name",
          disabled: "native",
          activation: "browser",
        },
        evidence: {
          "SEM-01": ["tests/definition.test.ts"],
          "STATE-01": ["tests/definition.test.ts"],
          "INT-01": ["tests/definition.test.ts"],
        },
      }),
    /profile "element" does not accept "div"/u,
  );
});

test("a Requirement set rejects evidence for an unknown Requirement", () => {
  assert.throws(
    () =>
      adoptRequirementSet(nagiButtonRequirementsV1, {
        prefix: "BROKEN",
        profile: {
          element: "button",
          naming: "native-accessible-name",
          disabled: "native",
          activation: "browser",
        },
        evidence: {
          "SEM-01": ["tests/definition.test.ts"],
          "STATE-01": ["tests/definition.test.ts"],
          "INT-01": ["tests/definition.test.ts"],
          "SEM-99": ["tests/definition.test.ts"],
        },
      }),
    /evidence names unknown requirement "SEM-99"/u,
  );
});

test("Carousel compatibility Definition still covers every audit row during catalog migration", () => {
  assertAuditMapping(carouselDefinition, "docs/audits/carousel-specification.md", "CAR", false);
});

test("Carousel separates its Component Contract from the native-scroll implementation", () => {
  assert.equal(carouselDefinition.version, "3.0");
  assert.equal(carouselDefinition.status, "draft");
  assert.equal(carouselDefinition.contract?.id, "nagi/carousel");
  assert.equal(carouselDefinition.contract?.revision, "1");
  assert.equal(carouselDefinition.implementation?.id, "nagi/blueprint/carousel-native-scroll");
  assert.equal(carouselDefinition.implementation?.strategy, "platform-first");
  assert.equal(
    carouselDefinition.anatomy.find((part) => part.name === "viewport")?.contractPart,
    undefined,
  );
  assert.equal(
    carouselDefinition.anatomy.find((part) => part.name === "slide")?.contractPart,
    "slide",
  );
  assert.deepEqual(
    carouselDefinition.implementation?.decisions.map(({ name, value }) => ({ name, value })),
    [
      { name: "layout", value: "native-scroll" },
      { name: "positioning", value: "css-scroll-snap" },
      { name: "reconciliation", value: "nearest-owned-slide" },
      { name: "presence", value: "persistent" },
      { name: "viewport-semantics", value: "named-slides-group" },
    ],
  );
  assert.deepEqual(carouselDefinition.adoptions, []);
  assert.deepEqual(
    carouselDefinition.references?.map(({ id, revision, reviewedAt }) => ({
      id,
      revision,
      reviewedAt,
    })),
    [
      {
        id: "apg-carousel",
        revision: "Rolling guidance snapshot",
        reviewedAt: "2026-09-01",
      },
      {
        id: "wai-aria-1.2-role-description",
        revision: "1.2 Recommendation (2023-06-06)",
        reviewedAt: "2026-09-01",
      },
    ],
  );

  const statements = [
    ...carouselDefinition.semantics,
    ...carouselDefinition.state,
    ...carouselDefinition.interaction,
    ...carouselDefinition.focus,
    ...carouselDefinition.style,
  ].filter((entry) => typeof entry !== "string");
  assert.ok(statements.some((statement) => statement.origin?.kind === "reference"));
  assert.ok(statements.some((statement) => statement.origin?.kind === "nagi"));
  assert.ok(
    statements.every(
      (statement) => statement.origin?.kind === "reference" || statement.origin?.kind === "nagi",
    ),
  );
});

test("Combobox Definition maps every audited requirement to executable evidence", () => {
  assertAuditMapping(comboboxDefinition, "docs/audits/combobox-dialog-definition.md", "CMB", false);
});

test("Dialog Definition maps every audited requirement to executable evidence", () => {
  assertAuditMapping(dialogDefinition, "docs/audits/combobox-dialog-definition.md", "DLG", false);
});

test("Toast separates portable notification guarantees from immediate native presence", () => {
  assert.deepEqual(validateDefinition(toastDefinition), []);
  assert.equal(toastDefinition.contract?.id, "nagi/toast");
  assert.equal(toastDefinition.implementation?.id, "nagi/blueprint/toast-manual-popover");
  assert.deepEqual(
    toastDefinition.implementation?.decisions.map(({ name, value }) => ({ name, value })),
    [
      { name: "layer", value: "manual-popover" },
      { name: "presence", value: "vue-list-immediate" },
      { name: "announcement", value: "separate-live-region" },
      { name: "focus-repair", value: "scoped-item-marker" },
    ],
  );
  assert.doesNotThrow(() =>
    assertDefinitionEvidence(toastDefinition, path.join(import.meta.dirname, "..")),
  );
});

test("every anatomy dependency is declared before the part that references it", () => {
  for (const definition of [
    buttonDefinition,
    carouselDefinition,
    comboboxDefinition,
    dialogDefinition,
    toastDefinition,
  ]) {
    const seen = new Set<string>();
    for (const part of definition.anatomy) {
      const dependencies = [part.directChildOf, part.within].filter(
        (dependency): dependency is string => dependency !== undefined,
      );
      for (const dependency of dependencies) {
        assert.ok(
          seen.has(dependency),
          `${definition.name}: "${part.name}" references "${dependency}" before it is declared`,
        );
      }
      seen.add(part.name);
    }
  }
});

test("pilot Definitions are unambiguous maintenance manifests", () => {
  for (const definition of [
    buttonDefinition,
    carouselDefinition,
    comboboxDefinition,
    dialogDefinition,
    toastDefinition,
  ]) {
    assert.deepEqual(validateDefinition(definition), []);
    assert.doesNotThrow(() => assertDefinition(definition));
  }
});

test("verified Definitions reject legacy entries, missing origins, and anatomy without evidence", () => {
  const invalid: ComponentDefinition = {
    ...buttonDefinition,
    status: "verified",
    semantics: [
      "Legacy prose cannot be verified.",
      {
        id: "BTN-SEM-99",
        classification: "intentional-extension",
        source: "Unversioned policy",
        text: "A statement without provenance cannot be verified.",
        evidence: ["tests/definition.test.ts"],
      },
    ],
    anatomy: buttonDefinition.anatomy.map((part) => ({ ...part, evidence: undefined })),
  };

  assert.deepEqual(
    validateDefinition(invalid).map((issue) => issue.code),
    ["verified-legacy-entry", "verified-missing-origin", "verified-missing-evidence"],
  );
});

test("repository evidence verification rejects drafts and paths outside the repository", () => {
  assert.throws(
    () =>
      assertDefinitionEvidence(
        { ...buttonDefinition, status: "draft" },
        path.join(import.meta.dirname, ".."),
      ),
    /is not declared verified/u,
  );
  assert.throws(
    () =>
      assertDefinitionEvidence(
        {
          ...buttonDefinition,
          status: "verified",
          semantics: buttonDefinition.semantics.map((entry, index) =>
            index === 0 && typeof entry !== "string"
              ? { ...entry, evidence: ["../outside.test.ts"] }
              : entry,
          ),
        },
        path.join(import.meta.dirname, ".."),
      ),
    /escapes the repository/u,
  );
});

test("contract labels can only name requirement IDs declared by their Definition", () => {
  assert.deepEqual(definitionRequirementIds(buttonDefinition), [
    "BTN-SEM-01",
    "BTN-SEM-02",
    "BTN-STATE-01",
    "BTN-STATE-02",
    "BTN-INT-01",
    "BTN-INT-02",
    "BTN-INT-03",
    "BTN-FOCUS-01",
    "BTN-ANAT-01",
    "BTN-STYLE-01",
    "BTN-STYLE-03",
    "BTN-STYLE-04",
    "BTN-STYLE-02",
  ]);
  assert.doesNotThrow(() =>
    assertContractRequirements(carouselDefinition, ["CAR-SEM-01", "CAR-ANAT-01", "CAR-STYLE-01"]),
  );
  assert.throws(
    () => assertContractRequirements(carouselDefinition, ["CAR-STATE-99"]),
    /undeclared requirement/u,
  );
});

test("Definition validation rejects duplicate or section-mismatched requirement IDs", () => {
  const invalid: ComponentDefinition = {
    ...buttonDefinition,
    focus: [
      {
        id: "BTN-INT-01",
        classification: "conformant",
        source: "Test authority",
        text: "A different statement must not reuse an interaction ID in focus.",
        evidence: ["tests/definition.test.ts"],
        origin: { kind: "nagi", policy: "invalid-test-fixture", policyVersion: "1" },
      },
    ],
  };

  assert.deepEqual(
    validateDefinition(invalid).map((issue) => issue.code),
    ["duplicate-requirement-id", "misclassified-requirement-id"],
  );
  assert.throws(() => assertDefinition(invalid), AggregateError);
});

test("Definition validation rejects anatomy relationships that cannot be resolved", () => {
  const invalid: ComponentDefinition = {
    ...buttonDefinition,
    anatomy: [
      {
        name: "control",
        description: "A control whose parent has not been declared.",
        match: { by: "element", element: "button" },
        within: "root",
      },
      {
        name: "control",
        description: "A duplicate part name.",
        match: { by: "element", element: "button" },
      },
    ],
  };

  assert.deepEqual(
    validateDefinition(invalid).map((issue) => issue.code),
    ["unknown-part-parent", "duplicate-part-name"],
  );
});
