import { profile } from "@/content/profile";

export function QuickFacts() {
  return (
    <dl className="mt-4 divide-y divide-line border-y border-line">
      {profile.facts.map((fact) => (
        <div key={fact.label} className="grid grid-cols-[104px_1fr] gap-4 py-3 text-sm">
          <dt className="label pt-0.5">{fact.label}</dt>
          <dd className="font-medium">
            {fact.live && <span aria-hidden className="live-dot" />}
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
