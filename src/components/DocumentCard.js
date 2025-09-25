import { Icon } from "@iconify/react";

function truncateText(text, maxLength = 20) {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 1) + "…";
  }

export default function DocumentCard({ doc, mode, onView, onDownload }) {
  return (
    <div
      className={`group relative flex flex-col p-6 rounded-xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer ${
        mode === "dark"
          ? "bg-gradient-to-br from-[#1a5a75] to-[#0f3d52] border-gray-700/50 hover:border-[#28A8E0]/30"
          : "bg-gradient-to-br from-white to-gray-50 border-gray-200/60 hover:border-[#28A8E0]/30 hover:shadow-blue-100/50"
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
          <span className="sm:hidden">{truncateText(doc.title, 25)}</span>
          <span className="hidden sm:inline">
            {truncateText(doc.title, 20)}
          </span>
        </h3>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Icon icon="heroicons:calendar-days" className="w-4 h-4" />
          <span>{doc.year}</span>
        </div>
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
