import {
  useButton,
  type ButtonBindingProps,
  type ButtonControl,
  type ButtonControlProps,
} from "@nagi-labs/nagi-ui/component-controls";

const props: ButtonControlProps = {
  disabled: false,
  focusableWhenDisabled: false,
};
const control: ButtonControl = useButton(props);
const binding: ButtonBindingProps = control.buttonProps;

const disabled: boolean = binding.disabled;
const ariaDisabled: "true" | undefined = binding["aria-disabled"];
binding.onClickCapture(new MouseEvent("click"));

void disabled;
void ariaDisabled;
