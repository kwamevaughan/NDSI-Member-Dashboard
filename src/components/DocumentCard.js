import { Icon } from "@iconify/react";

function truncateText(text, maxLength = 20) {
  if (!text) return "";
  // Replace underscores with spaces first
  const processedText = text.replace(/_/g, ' ');
  if (processedText.length <= maxLength) return processedText;
  return processedText.slice(0, maxLength - 1) + "…";
}

// Extracts a webinar label like "Webinar 3" from a title string
function extractWebinarLabel(title) {
  if (!title) return null;
  const match = title.match(/webinar\s*(\d+)?/i);
  if (!match) return null;
  const number = match[1];
  return number ? `Webinar ${number}` : "Webinar";
}

// Extracts a series label like "Series 5" from a title string
function extractSeriesLabel(title) {
  if (!title) return null;
  const match = title.match(/series\s*(\d+)?/i);
  if (!match) return null;
  const number = match[1];
  return number ? `Series ${number}` : "Series";
}

// Returns a cleaned title without extension and leading year/date prefixes
function getDisplayTitle(title) {
  if (!title) return "";
  let base = title.replace(/\.[^.]+$/, "");
  // Remove leading patterns like: 2023 - 24-05-23 - ..., or 2023 - ..., supporting -, _, or spaces
  base = base.replace(
    /^\s*\d{4}\s*[-_\s]+\s*(?:\d{1,2}[-_\/]\d{1,2}[-_\/]\d{2,4}\s*[-_\s]+)?/i,
    ""
  );
  // Collapse extra whitespace and separators
  base = base.replace(/\s{2,}/g, " ").trim();
  return base;
}

export default function DocumentCard({ doc, mode, onView, onDownload }) {
  const webinarLabel = extractWebinarLabel(doc.title);
  const seriesLabel = extractSeriesLabel(doc.title);
  const displayTitle = getDisplayTitle(doc.title);
  return (
    <div
      className={`group relative flex flex-col p-6 rounded-xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer ${
        mode === "dark"
          ? "bg-gradient-to-br from-[#1a5a75] to-[#0f3d52] border-gray-700/50 hover:border-l-blue/30"
          : "bg-gradient-to-br from-white to-gray-50 border-gray-200/60 hover:border-ndsi-blue/30 hover:shadow-blue-100/50"
      }`}
      onClick={onView}
    >
      {/* Document type badge */}
      <div className="absolute top-3 right-3">
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            doc.type === "pdf"
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
          }`}
        >
          {doc.type.toUpperCase()}
        </span>
      </div>

      <div className="mb-6 flex justify-center">
        {doc.type === "pdf" ? (
          <div className="relative">
            <Icon
              icon="mdi:file-pdf"
              className="text-6xl text-red-500 drop-shadow-lg"
            />
            <div className="absolute inset-0 bg-red-500/10 rounded-lg blur-xl group-hover:bg-red-500/20 transition-colors"></div>
          </div>
        ) : (
          <div className="relative">
            <Icon
              icon="mdi:file-word"
              className="text-6xl text-blue-500 drop-shadow-lg"
            />
            <div className="absolute inset-0 bg-blue-500/10 rounded-lg blur-xl group-hover:bg-blue-500/20 transition-colors"></div>
          </div>
        )}
      </div>

      <div className="text-center flex-1 space-y-2">
        <h3
          className={`font-semibold text-lg leading-tight ${
            mode === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          <span className="sm:hidden">{truncateText(displayTitle, 25)}</span>
          <span className="hidden sm:inline">
            {truncateText(displayTitle, 20)}
          </span>
        </h3>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Icon icon="heroicons:calendar-days" className="w-4 h-4" />
          <span>{doc.year}</span>
        </div>
        {(webinarLabel || seriesLabel) && (
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {webinarLabel && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-ndsi-blue/10 text-ndsi-blue dark:bg-white/10 dark:text-white">
                {webinarLabel}
              </span>
            )}
            {seriesLabel && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-ndsi-blue/10 text-ndsi-blue dark:bg-white/10 dark:text-white">
                {seriesLabel}
              </span>
            )}
          </div>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Uploaded: {new Date(doc.date).toLocaleDateString()}
        </p>
      </div>

      <div className="mt-6 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="flex-1 bg-ndsi-blue hover:bg-ndsi-green text-white font-normal py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <Icon icon="heroicons:eye" className="w-4 h-4" />
          View
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className="flex-1 bg-ndsi-blue hover:bg-ndsi-green text-white font-normal py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <Icon icon="heroicons:arrow-down-tray" className="w-4 h-4" />
          Download
        </button>
      </div>
    </div>
  );
}
