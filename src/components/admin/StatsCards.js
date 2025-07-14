import { Icon } from "@iconify/react";

export default function StatsCards({ stats, onApprovedClick, onRejectedClick }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
        <div className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-xl bg-ndsi-blue flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon icon="tabler:users" className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                Pending Approvals
              </p>
              <p className="text-3xl font-medium text-slate-800 mt-1">
                {stats.totalPending}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50 cursor-pointer"
        onClick={onApprovedClick}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
        <div className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-xl bg-ndsi-green flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon icon="mdi:check" className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                Approved Today
              </p>
              <p className="text-3xl font-medium text-slate-800 mt-1">
                {stats.approvedToday}
              </p>
            </div>
            <div className="flex-shrink-0">
              <Icon
                icon="mdi:chevron-right"
                className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50 cursor-pointer"
        onClick={onRejectedClick}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
        <div className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-xl bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon icon="mdi:close" className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                Rejected Today
              </p>
              <p className="text-3xl font-medium text-slate-800 mt-1">
                {stats.rejectedToday}
              </p>
            </div>
            <div className="flex-shrink-0">
              <Icon
                icon="mdi:chevron-right"
                className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 