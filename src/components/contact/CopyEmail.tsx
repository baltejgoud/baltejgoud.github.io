"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Pill } from "@/components/ui/Pill";
import { useToast } from "@/components/ui/Toast";

/** Selection-based copy for browsers that deny the Clipboard API (some in-app browsers do). */
function copyBySelection(text: string): boolean {
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  field.remove();
  return copied;
}

export function CopyEmail({ email }: { email: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const done = (ok: boolean) => {
    if (!ok) {
      toast("Couldn’t copy. Select the address instead.");
      return;
    }
    setCopied(true);
    toast("Email copied");
    window.setTimeout(() => setCopied(false), 2000);
  };

  const copy = () => {
    if (!navigator.clipboard) {
      done(copyBySelection(email));
      return;
    }
    navigator.clipboard.writeText(email).then(
      () => done(true),
      () => done(copyBySelection(email)),
    );
  };

  return (
    <Pill variant="outline" onClick={copy} aria-label={`Copy ${email}`}>
      {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
      {copied ? "Copied" : "Copy"}
    </Pill>
  );
}
