export interface NagiStyleAxis {
  readonly property: string;
  readonly default: string;
  readonly inherits: false;
  readonly values: Readonly<Record<string, Readonly<Record<string, string>>>>;
}

export interface NagiStylePropertyRegistration {
  readonly property: string;
  readonly syntax: string;
  readonly inherits: false;
  readonly initialValue?: string;
  readonly visibility: "public" | "private";
}

export interface ExpandedStyleDeclaration {
  readonly property: string;
  readonly value: string;
}

export const nagiStyleAxes: Readonly<{
  button: Readonly<{
    tone: NagiStyleAxis;
    appearance: NagiStyleAxis;
    shape: NagiStyleAxis;
    size: NagiStyleAxis;
  }>;
}>;

export const nagiStylePropertyRegistrations: readonly NagiStylePropertyRegistration[];

export function expandNagiStyleDeclaration(
  property: string,
  value: string,
): ExpandedStyleDeclaration[] | null;

export interface PostCssDeclarationLike {
  readonly prop: string;
  readonly value: string;
  readonly parent?: { readonly type: string; readonly selector?: string };
  cloneBefore(overrides: { prop: string; value: string }): unknown;
  error(message: string, options: { plugin: string }): Error;
}

export interface NagiStyleCompilerPlugin {
  readonly postcssPlugin: "nagi-style-compiler";
  Declaration(declaration: PostCssDeclarationLike): void;
}

export function nagiStyleCompiler(): NagiStyleCompilerPlugin;
export default nagiStyleCompiler;
