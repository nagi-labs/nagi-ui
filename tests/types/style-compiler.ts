import {
  expandNagiStyleDeclaration,
  nagiStyleAxes,
  nagiStyleCompiler,
  type ExpandedStyleDeclaration,
  type NagiStyleCompilerPlugin,
} from "@nagi-labs/nagi-ui/style-compiler";

const expansion: ExpandedStyleDeclaration[] | null = expandNagiStyleDeclaration(
  "--button-tone",
  "danger",
);
const plugin: NagiStyleCompilerPlugin = nagiStyleCompiler();
const defaultTone: string = nagiStyleAxes.button.tone.default;

void expansion;
void plugin;
void defaultTone;
