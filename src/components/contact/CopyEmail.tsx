"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Pill } from "@/components/ui/Pill";
import { useToast } from "@/components/ui/Toast";

export function CopyEmail({ email }: { email: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!navigator.clipboard) {
      toast("Couldn’t copy. Select the address instead.");
      return;
    }
    navigator.clipboard.writeText(email).then(
      () => {
        setCopied(true);
        toast("Email copied");
        window.setTimeout(() => setCopied(false), 2000);
      },
      () => toast("Couldn’t copy. Select the address instead."),
    );
  };

  return (
    <Pill variant="outline" onClick={copy} aria-label={`Copy ${email}`}>
      {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
      {copied ? "Copied" : "Copy"}
    </Pill>
  );
}
