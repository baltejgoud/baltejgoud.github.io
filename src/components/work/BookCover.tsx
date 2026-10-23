import type { Project, WidgetKind } from "@/content/types";
import { projectBooks } from "@/content/projectBooks";

/** Small, code-native illustrations keep the shelf crisp without image downloads. */
export function BookArtwork({ kind }: { kind: WidgetKind }) {
  return (
    <svg
      viewBox="0 0 180 160"
      fill="none"
      className={`wb-art wb-art-${kind}`}
      aria-hidden="true"
    >
      {kind === "forecast" && (
        <>
          <circle cx="90" cy="78" r="62" />
          <circle cx="90" cy="78" r="42" />
          <path
            d="M13 124 37 105 58 111 80 75 101 86 125 46 154 54 171 24"
            className="wb-art-line"
          />
          <path d="M14 137H168M26 145V18" strokeDasharray="2 5" />
          <circle cx="125" cy="46" r="5" className="wb-art-fill" />
        </>
      )}
      {kind === "atlas" && (
        <>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(0 ${i * 33})`}>
              <path d="m90 10 70 34-70 34-70-34 70-34Z" />
              <path d="m20 44 70 34 70-34" className="wb-art-line" />
            </g>
          ))}
          <path d="M90 12v134" strokeDasharray="2 5" />
          <circle cx="90" cy="78" r="9" className="wb-art-fill" />
        </>
      )}
      {kind === "import" && (
        <>
          <circle cx="90" cy="79" r="65" />
          <circle cx="90" cy="79" r="48" />
          <circle cx="90" cy="79" r="31" />
          <path
            d="M5 83h39l13-18 15 41 20-66 15 49 10-15h58"
            className="wb-art-line"
          />
          <circle cx="90" cy="79" r="3" className="wb-art-fill" />
        </>
      )}
      {kind === "fairPrice" && (
        <g transform="rotate(-19 90 80)">
          <path
            d="M25 32h130v30a18 18 0 0 0 0 36v30H25V98a18 18 0 0 0 0-36V32Z"
            className="wb-art-ticket"
          />
          <path d="M115 34v92" strokeDasharray="3 5" />
          <path
            d="m70 55 6 17 18 1-14 11 4 18-14-10-15 10 4-18-14-11 18-1 7-17Z"
            className="wb-art-fill"
          />
          <path d="M131 47v13m6-13v13m-6 40v13m6-13v13" />
        </g>
      )}
      {kind === "custody" && (
        <>
          <path
            d="M89 139V72M89 98C49 98 27 78 27 45c36 0 62 18 62 53ZM89 79c0-33 23-52 61-52 0 33-23 52-61 52Z"
            className="wb-art-line"
          />
          <circle cx="89" cy="79" r="66" strokeDasharray="2 6" />
          <path d="M48 133h82M58 143h62" />
          <circle cx="89" cy="139" r="4" className="wb-art-fill" />
        </>
      )}
      {kind === "reconcile" && (
        <>
          <path
            d="M143 63a57 57 0 0 0-103-19L25 64m0 0V32m0 32h32M37 99a57 57 0 0 0 103 19l15-20m0 0v32m0-32h-32"
            className="wb-art-line"
          />
          <circle cx="90" cy="80" r="29" />
          <path d="m76 80 10 10 20-22" className="wb-art-line" />
        </>
      )}
    </svg>
  );
}

export function BookCover({ project }: { project: Project }) {
  const book = projectBooks[project.widget];
  return (
    <span className="wb-cover-content">
      <span className="wb-cover-edition">
        THE BUILD SERIES <span>NO. {project.index}</span>
      </span>
      <span className="wb-cover-title">{project.title}</span>
      <span className="wb-cover-subtitle">{book.subject}</span>
      <BookArtwork kind={project.widget} />
      <span className="wb-cover-author">
        BALTEJ GOUD <span>↗</span>
      </span>
    </span>
  );
}
