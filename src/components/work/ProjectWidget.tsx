"use client";

import dynamic from "next/dynamic";
import type { WidgetKind } from "@/content/types";

function WidgetLoading() {
  return (
    <div className="flex h-full min-h-[380px] items-center justify-center rounded-[20px] border border-line bg-cream" role="status">
      <span className="text-sm text-stone">Loading the interactive model…</span>
    </div>
  );
}

const ForecastWidget = dynamic(() => import("./widgets/ForecastWidget").then((m) => m.ForecastWidget), {
  ssr: false,
  loading: WidgetLoading,
});
const AtlasWidget = dynamic(() => import("./widgets/AtlasWidget").then((m) => m.AtlasWidget), {
  ssr: false,
  loading: WidgetLoading,
});
const ImportWidget = dynamic(() => import("./widgets/ImportWidget").then((m) => m.ImportWidget), {
  ssr: false,
  loading: WidgetLoading,
});
const FairPriceWidget = dynamic(() => import("./widgets/FairPriceWidget").then((m) => m.FairPriceWidget), {
  ssr: false,
  loading: WidgetLoading,
});
const CustodyWidget = dynamic(() => import("./widgets/CustodyWidget").then((m) => m.CustodyWidget), {
  ssr: false,
  loading: WidgetLoading,
});
const ReconcileWidget = dynamic(() => import("./widgets/ReconcileWidget").then((m) => m.ReconcileWidget), {
  ssr: false,
  loading: WidgetLoading,
});

/** Loads a project's widget only when its panel first opens. */
export function ProjectWidget({ kind }: { kind: WidgetKind }) {
  switch (kind) {
    case "forecast":
      return <ForecastWidget />;
    case "atlas":
      return <AtlasWidget />;
    case "import":
      return <ImportWidget />;
    case "fairPrice":
      return <FairPriceWidget />;
    case "custody":
      return <CustodyWidget />;
    case "reconcile":
      return <ReconcileWidget />;
  }
}
