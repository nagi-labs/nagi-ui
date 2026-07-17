import {
  assertNagiDom,
  observeNagiDom,
  verifyNagiDom,
  type NagiDomIssue,
  type NagiDomIssueCode,
} from "@nagi-labs/nagi-ui"

const issues: readonly NagiDomIssue[] = verifyNagiDom(document)
const code: NagiDomIssueCode | undefined = issues[0]?.code
assertNagiDom(document)
const stop = observeNagiDom(document, {
  onIssues(next) {
    const first: NagiDomIssue | undefined = next[0]
    void first
  },
})
stop()

void code
