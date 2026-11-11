import { useLayoutEffect, useRef } from "react";
import { formatMoneyInput, parseMoneyInput, moneyValidation } from "../utils/moneyInput";

/** Display es-AR amounts while keeping canonical decimal strings in form state. */
export default function MoneyInput({ value, onValueChange, min, max, step, ...props }) {
  const inputRef = useRef(null);
  const caretRef = useRef(null);
  const display = formatMoneyInput(value);

  useLayoutEffect(() => {
    const input = inputRef.current;
    input.setCustomValidity(moneyValidation(value, min, max, step));
    if (caretRef.current !== null && document.activeElement === input) {
      let remaining = caretRef.current;
      let position = 0;
      while (position < display.length && remaining > 0) {
        if (display[position] !== ".") remaining--;
        position++;
      }
      input.setSelectionRange(position, position);
    }
    caretRef.current = null;
  });

  function change(event) {
    const input = event.target;
    const next = parseMoneyInput(input.value);
    if (next === null) return;
    const position = input.selectionStart ?? input.value.length;
    caretRef.current = input.value.slice(0, position).replace(/\./g, "").length;
    onValueChange(next);
  }

  function keyDown(event) {
    props.onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const input = event.currentTarget;
    const start = input.selectionStart;
    if (start !== input.selectionEnd) return;
    // Deleting next to a grouping dot must remove a digit, not recreate the dot forever.
    let from;
    let to;
    if (event.key === "Backspace" && display[start - 1] === ".") {
      from = start - 2;
      to = start;
    } else if (event.key === "Delete" && display[start] === ".") {
      from = start;
      to = start + 2;
    } else return;
    event.preventDefault();
    const next = parseMoneyInput(display.slice(0, from) + display.slice(to));
    caretRef.current = display.slice(0, from).replace(/\./g, "").length;
    onValueChange(next);
  }

  return <input {...props} ref={inputRef} type="text" inputMode="decimal"
    value={display} onChange={change} onKeyDown={keyDown} />;
}
