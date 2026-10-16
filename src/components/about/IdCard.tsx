import Image from "next/image";
import { Barcode } from "./Barcode";
import { profile } from "@/content/profile";

/** Face of the lanyard badge. 260 × 392. */
export function IdCard() {
  const { idCard } = profile;
  return (
    <div className="flex h-full w-full flex-col rounded-[20px] bg-paper p-5 shadow-card ring-1 ring-line">
      <div aria-hidden className="mx-auto h-2 w-12 rounded-full bg-cream ring-1 ring-line" />
      <div className="mt-3 flex items-center justify-between">
        <span className="label text-ink">{idCard.heading}</span>
        <span className="font-mono text-[10px] text-stone">{profile.monogram}</span>
      </div>
      <div className="relative mt-3 aspect-square w-full overflow-hidden rounded-xl bg-cream">
        <Image src="/images/id-photo.webp" alt="" fill sizes="220px" className="object-cover" draggable={false} />
      </div>
      <p className="mt-4 text-[15px] font-bold leading-tight tracking-tight">{profile.fullName}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {idCard.roles.map((role) => (
          <span
            key={role}
            className="rounded-full border border-line px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-stone"
          >
            {role}
          </span>
        ))}
      </div>
      <div className="mt-auto flex items-end justify-between gap-3 pt-3 text-ink">
        <Barcode seed={idCard.barcodeSeed} width={118} height={30} />
        <span className="font-mono text-[10px] text-stone">{idCard.number}</span>
      </div>
    </div>
  );
}
