import assert from "node:assert/strict";
import test from "node:test";

import { datePickerDefinition } from "../packages/core/blueprints/date-picker/date-picker.definition.ts";
import { validateDefinition } from "../packages/core/src/definition.ts";
import {
  nagiCalendarRequirementsV1,
  nagiCalendarRequirementsV2,
} from "../packages/core/src/standards/nagi-calendar.ts";

test("nagi/calendar contains only the source-backed grid boundary", () => {
  assert.deepEqual(
    nagiCalendarRequirementsV1.requirements.map((requirement) => requirement.id),
    ["SEM-01", "SEM-02", "INT-01", "FOCUS-01"],
  );
  assert.equal(
    nagiCalendarRequirementsV1.requirements.find(({ id }) => id === "SEM-02")?.text,
    "Each selectable calendar date is represented by a native `button` with an accessible date name.",
  );
  assert.equal(
    nagiCalendarRequirementsV2.requirements.find(({ id }) => id === "SEM-02")?.text,
    "Each selectable calendar date exposes button semantics with an accessible date name.",
  );
  assert.equal(
    nagiCalendarRequirementsV1.requirements.every(
      (requirement) => requirement.policy === undefined,
    ),
    true,
  );
});

test("DatePicker compatibility manifest composes calendar and native-popup foundations", () => {
  assert.deepEqual(validateDefinition(datePickerDefinition), []);
  assert.equal(datePickerDefinition.status, "draft");
  assert.equal(datePickerDefinition.version, "4.0");
  assert.equal(datePickerDefinition.contract?.id, "nagi/date-picker");
  assert.equal(datePickerDefinition.contract?.revision, "2");
  assert.equal(
    datePickerDefinition.implementation?.id,
    "nagi/blueprint/date-picker-native-popover",
  );
  assert.deepEqual(
    datePickerDefinition.adoptions?.map(({ requirementSet }) => requirementSet),
    ["nagi/calendar", "nagi/popup"],
  );
  assert.deepEqual(
    datePickerDefinition.adoptions?.find(({ requirementSet }) => requirementSet === "nagi/calendar")
      ?.profile,
    { context: "date-picker", selection: "single" },
  );
  assert.equal(
    datePickerDefinition.adoptions?.find(({ requirementSet }) => requirementSet === "nagi/calendar")
      ?.requirementSetVersion,
    "2",
  );
  assert.deepEqual(
    datePickerDefinition.adoptions?.find(({ requirementSet }) => requirementSet === "nagi/popup")
      ?.profile,
    { invocation: "native-target", focus: "calendar-managed", dismissal: "auto" },
  );
});

test("DatePicker records its deliberate non-modal difference from the APG example", () => {
  const nonModal = datePickerDefinition.semantics.find(
    (entry) => typeof entry !== "string" && entry.id === "DTP-SEM-02",
  );
  assert.ok(nonModal && typeof nonModal !== "string");
  assert.equal(nonModal.origin?.kind, "nagi");
  assert.match(nonModal.text, /non-modal native Popover/u);
  assert.doesNotMatch(nonModal.text, /aria-modal="true"/u);

  const popupState = datePickerDefinition.state.find(
    (entry) => typeof entry !== "string" && entry.id === "DTP-POP-STATE-01",
  );
  assert.ok(popupState && typeof popupState !== "string");
  assert.deepEqual(popupState.origin, {
    kind: "nagi",
    policy: "native-popup-model-sync",
    policyVersion: "1",
  });
});
