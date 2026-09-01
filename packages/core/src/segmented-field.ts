export interface SegmentDigitConstraints {
  minimum: number;
  maximum: number;
  width: number;
}

/** Resolves one keyboard character through the locale's decimal digit glyphs. */
export function localeDigit(locale: string, key: string): string | null {
  if (/^[0-9]$/u.test(key)) return key;
  const formatter = new Intl.NumberFormat(locale, { useGrouping: false });
  for (let digit = 0; digit <= 9; digit += 1) {
    if (formatter.format(digit) === key) return String(digit);
  }
  return null;
}

/**
 * Owns only the shared timed digit buffer used by segmented date/time fields.
 * Segment ranges and the resulting model transition remain component policy.
 */
export function createSegmentDigitBuffer<Type>(timeout = 1000) {
  let text = "";
  let activeType: Type | null = null;
  let task: ReturnType<typeof setTimeout> | undefined;

  function clear() {
    text = "";
    activeType = null;
    if (task !== undefined) clearTimeout(task);
    task = undefined;
  }

  function resetLater() {
    if (task !== undefined) clearTimeout(task);
    task = setTimeout(clear, timeout);
  }

  function consume(
    type: Type,
    digit: string,
    constraints: SegmentDigitConstraints,
  ): { value: number; complete: boolean } | null {
    if (activeType !== type) text = "";
    activeType = type;
    let candidate = `${text}${digit}`;
    if (Number(candidate) > constraints.maximum || candidate.length > constraints.width) {
      candidate = digit;
    }
    const value = Number(candidate);
    if (value < constraints.minimum || value > constraints.maximum) return null;
    text = candidate;
    resetLater();
    const complete = text.length >= constraints.width
      || Number(`${text}0`) > constraints.maximum;
    if (complete) clear();
    return { value, complete };
  }

  return { consume, clear };
}
