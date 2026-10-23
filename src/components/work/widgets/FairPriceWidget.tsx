"use client";

import { useState } from "react";
import { WidgetFrame } from "./WidgetFrame";
import { cn } from "@/lib/cn";
import { evaluateListing, FACE_VALUE, formatInr, PRICE_MAX, PRICE_MIN, PRICE_STEP } from "@/lib/widgets/fairPrice";

export function FairPriceWidget() {
  const [price, setPrice] = useState(2200);
  const listing = evaluateListing(price);
  const listed = listing.status === "listed";

  return (
    <WidgetFrame title="ExtraTicket · Fair-price listing" caption="Illustrative event. Listings above face value are blocked.">
      <div className="rounded-2xl border border-line p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="label">Indie night · Hyderabad</p>
            <p className="mt-1 text-sm text-stone">Face value {formatInr(FACE_VALUE)}</p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
              listed ? "bg-live/15 text-[#13753a]" : "bg-alert/10 text-alert",
            )}
          >
            {listed ? "Listed ✓" : "Blocked"}
          </span>
        </div>
        <p className="mt-5 text-4xl font-extrabold tabular-nums tracking-tight">{formatInr(price)}</p>
        <p className="mt-1 text-sm text-stone" aria-live="polite">
          {listing.status === "listed"
            ? listing.saving > 0
              ? `${formatInr(listing.saving)} below face value`
              : "At face value"
            : `${formatInr(listing.over)} above face value. Listings are capped.`}
        </p>
      </div>
      <label className="mt-5 block">
        <span className="label">Asking price</span>
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          aria-valuetext={formatInr(price)}
          className="mt-3 w-full accent-ink"
        />
      </label>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-stone">
        <span>{formatInr(PRICE_MIN)}</span>
        <span>{formatInr(PRICE_MAX)}</span>
      </div>
    </WidgetFrame>
  );
}
