import { hashText } from "@/lib/hash";

export interface CustodyStep {
  id: string;
  label: string;
  payload: string;
}

export const defaultChain: CustodyStep[] = [
  { id: "farm", label: "Farm", payload: "Batch 0425 · Tomatoes · Harvested 06:10" },
  { id: "lab", label: "Lab", payload: "Residue test · Pass · 0.02 ppm" },
  { id: "carrier", label: "Carrier", payload: "Cold chain · 4 °C · 11 h" },
  { id: "distributor", label: "Distributor", payload: "Received · Seal intact" },
];

export const tamperedPayloads: Record<string, string> = {
  farm: "Batch 0425 · Tomatoes · Harvested 14:40",
  lab: "Residue test · Pass · 0.20 ppm",
  carrier: "Cold chain · 9 °C · 11 h",
  distributor: "Received · Seal broken",
};

export type HashFn = (input: string) => Promise<string>;

/** Each step's hash covers its own record and the previous hash, so a change breaks every later link. */
export async function chainHashes(steps: readonly CustodyStep[], hash: HashFn = hashText): Promise<string[]> {
  const hashes: string[] = [];
  let previous = "genesis";
  for (const step of steps) {
    previous = await hash(`${previous}|${step.id}|${step.payload}`);
    hashes.push(previous);
  }
  return hashes;
}

/** true where the current hash still matches the one signed at creation. */
export function verify(signed: readonly string[], current: readonly string[]): boolean[] {
  return signed.map((hash, i) => current[i] === hash);
}
