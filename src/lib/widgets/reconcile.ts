export type RunMode = "naive" | "tandem";
export type Tone = "info" | "warn" | "ok" | "error";

export interface LogLine {
  text: string;
  tone: Tone;
}

export interface RunResult {
  lines: LogLine[];
  transfers: number;
}

/**
 * A transfer whose confirmation times out after the bank has already executed it.
 * A naive retry posts it twice; Tandem reconciles against the ledger and skips the retry.
 */
export function runTransfer(mode: RunMode): RunResult {
  const statement: string[] = [];
  const lines: LogLine[] = [];
  const submit = () => statement.push("TX-7731");

  if (mode === "tandem") lines.push({ text: "precheck · payee ACC-2048 exists", tone: "ok" });
  lines.push({ text: "submit · transfer ₹12,000 → ACC-2048", tone: "info" });
  submit();
  lines.push({ text: "response · timed out after 30 s", tone: "warn" });

  if (mode === "naive") {
    lines.push({ text: "retry · submitting the same transfer again", tone: "info" });
    submit();
    lines.push({ text: `result · ${statement.length} transfers posted — duplicate`, tone: "error" });
  } else {
    lines.push({ text: "ledger · outcome ambiguous, recorded as pending", tone: "warn" });
    const found = statement.includes("TX-7731");
    lines.push({
      text: found ? "reconcile · TX-7731 found on the statement" : "reconcile · not found, safe to retry",
      tone: "ok",
    });
    lines.push({ text: "result · executed once — retry skipped", tone: "ok" });
  }
  return { lines, transfers: statement.length };
}
