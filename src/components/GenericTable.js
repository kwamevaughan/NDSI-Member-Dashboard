import React, { useState, useMemo, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { DateRange } from 'react-date-range';
import { format, parseISO, isWithinInterval } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import ReactDOM from 'react-dom';
import { toast } from 'react-hot-toast';
import ExportModal from "./ExportModal";
import SimpleModal from "./SimpleModal";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import AddUserModal from "./admin/AddUserModal";

// Enhanced useTable hook
function useTable(data, initialPageSize = 20) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [selected, setSelected] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  // Filtering
  const filteredData = useMemo(() => {
    let result = data;
    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(row => {
        if (statusFilter === "approved") return row.is_approved === true;
        if (statusFilter === "pending") return row.is_approved === false || row.is_approved === null;
        if (statusFilter === "rejected") return row.approval_status === 'rejected';
        return true;
      });
    }
    // Search filter
    if (searchTerm) {
      result = result.filter((row) =>
        Object.values(row).some((value) =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    // Date filters for sortBy
    if (sortBy === "last_month") {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      result = result.filter(row => row.created_at && new Date(row.created_at) >= lastMonth);
    } else if (sortBy === "last_7_days") {
      const now = new Date();
      const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(row => row.created_at && new Date(row.created_at) >= last7);
    }
    return result;
  }, [data, searchTerm, statusFilter, sortBy]);

  // Sorting
  const sortedData = useMemo(() => {
    if (sortBy === "recent") {
      return [...filteredData].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === "asc") {
      return [...filteredData].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "desc") {
      return [...filteredData].sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    }
    // Default to filteredData
    return filteredData;
  }, [filteredData, sortBy]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paged = sortedData.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handlePage = (newPage) => {
    setPage(Math.max(1, Math.min(totalPages, newPage)));
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelected(
      selected.length === paged.length ? [] : paged.map((row) => row.id)
    );
  };

  return {
    paged,
    page,
    pageSize,
    totalPages,
    sortKey,
    sortDir,
    selected,
    setSelected,
    searchTerm,
    setPage,
    setPageSize,
    handleSort,
    handlePage,
    toggleSelect,
    selectAll,
    setSearchTerm,
    totalItems: sortedData.length,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
  };
}


export function GenericTable({
  data = [],
  columns = [],
  onEdit,
  onDelete,
  onBulkDelete,
  onBulkApprove,
  onBulkReject,
  onReorder,
  onAddNew,
  addNewLabel = "Add New",
  title,
  emptyMessage = "No data available",
  selectable = true,
  searchable = true,
  enableDragDrop = false,
  actions = [],
  onImport,
  customRowRender,
  importType,
  enableDateFilter = false,
  onRefresh,
  onAddUser,
  loading = false, // <-- Add loading prop, default false
  showStatusFilter = true,
}) {
  // Ensure data is an array and filter out any null/undefined items
  const safeData = useMemo(() => {
    return Array.isArray(data) ? data.filter(item => item != null) : [];
  }, [data]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState([
    {
      startDate: null,
      endDate: null,
      key: 'selection',
    },
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const datePickerRef = useRef();
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef();
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  // Detect mode (light/dark)
  const [mode, setMode] = useState('light');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMode(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    }
  }, []);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    }
    if (showDatePicker) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDatePicker]);

  // Filter data by date range
  const filteredByDate = useMemo(() => {
    if (!enableDateFilter) return safeData;
    const { startDate, endDate } = dateRange[0] || {};
    if (!startDate || !endDate) return safeData;
    return safeData.filter((row) => {
      if (!row.created_at) return false;
      const created = parseISO(row.created_at);
      return isWithinInterval(created, { start: startDate, end: endDate });
    });
  }, [safeData, dateRange, enableDateFilter]);

  // Use filtered data for table
  const table = useTable(filteredByDate);
  const [selectAllMode, setSelectAllMode] = useState(false);
  const [addUserLoading, setAddUserLoading] = useState(false);

  const handleBulkDelete = () => {
    if (table.selected.length > 0) {
      if (onBulkDelete) {
        // Use custom bulk delete handler
        const selectedItems = data.filter(item => table.selected.includes(item.id));
        onBulkDelete(table.selected, selectedItems);
      } else if (onDelete) {
        // Fallback to individual delete calls
        table.selected.forEach((id) => {
          const row = data.find((item) => item.id === id);
          if (row) onDelete(row);
        });
      }
    }
  };

  const selectAll = () => {
    if (selectAllMode || table.selected.length === table.paged.length) {
      table.setSelected([]);
      setSelectAllMode(false);
    } else {
      table.setSelected(table.paged.map((row) => row.id));
      setSelectAllMode(false);
    }
  };

  // Determine eligibility for bulk approve/reject
  const selectedRows = data.filter(item => table.selected.includes(item.id));
  const canBulkApprove = onBulkApprove && selectedRows.length > 0 && selectedRows.every(row => row.is_approved === false || row.is_approved === null);
  // Allow bulk reject for any user not already rejected
  const canBulkReject = onBulkReject && selectedRows.length > 0 && selectedRows.some(row => row.approval_status !== 'rejected');

  // Helper to get eligible user IDs for bulk reject
  const getBulkRejectIds = () => table.selected.filter(id => {
    const row = data.find(item => item.id === id);
    return row && row.approval_status !== 'rejected';
  });

  // Helper to render a table row's cells
  const renderRowCells = (row, index) => {
    if (!row) return null;
    
    return (
    <>
      {selectable && (
        <td className="px-4 py-4">
          <input
            type="checkbox"
            checked={table.selected.includes(row.id)}
            onChange={() => table.toggleSelect(row.id)}
            className="w-4 h-4 text-ndsi-blue bg-gray-100 border-gray-300 rounded focus:ring-ndsi-blue focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
        </td>
      )}
      {columns.map((col) => {
        let value = row[col.accessor];

        // Use custom render function if provided
        if (typeof col.render === "function") {
          return (
            <td
              key={col.accessor}
              className="px-4 py-4 text-sm text-gray-900 dark:text-white"
            >
              {col.render(row, value, index)}
            </td>
          );
        }

        if (col.type === "image") {
          return (
            <td key={col.accessor} className="px-4 py-4">
              <Image
                src={value}
                alt={row.name || "Image"}
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                width={40}
                height={40}
              />
            </td>
          );
        }

        return (
          <td
            key={col.accessor}
            className="px-4 py-4 text-sm text-gray-900 dark:text-white"
          >
            {value}
          </td>
        );
      })}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          {/* Custom actions */}
          {actions.map((action, i) => {
            if (!action || typeof action.onClick !== 'function') return null;
            
            // Check if action should be shown for this row
            if (action.show && typeof action.show === 'function' && !action.show(row)) {
              return null;
            }
            
            const label = typeof action.label === 'function' ? action.label(row) : action.label;
            const icon = typeof action.icon === 'function' ? action.icon(row) : action.icon;
            
            return (
              <button
                key={label || i}
                onClick={() => action.onClick(row)}
                className={`p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors ${action.className || ''}`}
                title={label || ''}
              >
                <Icon icon={icon || 'mdi:help'} className="w-4 h-4" />
              </button>
            );
          })}
          {/* Edit/Delete */}
          {onEdit && (
            <button
              onClick={() => onEdit(row)}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-ndsi-blue-light dark:hover:bg-blue-900/50 text-ndsi-blue dark:text-blue-400 transition-colors"
              title="Edit"
            >
              <Icon icon="cuida:edit-outline" className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(row)}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors"
              title="Delete"
            >
              <Icon icon="mynaui:trash" className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </>
    );
  };

  // Open popover and set position
  const handleDateButtonClick = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
    setShowDatePicker((v) => !v);
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      const loadingToast = toast.loading('Refreshing data...');
      
      try {
        await onRefresh();
        toast.success('Data refreshed successfully!', {
          id: loadingToast,
        });
      } catch (error) {
        console.error('Error refreshing data:', error);
        toast.error('Failed to refresh data. Please try again.', {
          id: loadingToast,
        });
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const [importError, setImportError] = useState("");
  const [importedRows, setImportedRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileUpload = (file) => {
    setImportError("");
    setImportedRows([]);
    setImportPreview([]);
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data;
          const required = columns.map((c) => c.accessor);
          const missing = required.filter((col) => !results.meta.fields.includes(col));
          if (missing.length > 0) {
            setImportError(`Missing required columns: ${missing.join(", ")}`);
            return;
          }
          setImportedRows(rows);
          setImportPreview(rows.slice(0, 5));
        },
        error: (err) => {
          setImportError("Failed to parse CSV: " + err.message);
        },
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          if (!rows.length) {
            setImportError("No data found in the XLSX file.");
            return;
          }
          const required = columns.map((c) => c.accessor);
          const missing = required.filter((col) => !(col in rows[0]));
          if (missing.length > 0) {
            setImportError(`Missing required columns: ${missing.join(", ")}`);
            return;
          }
          setImportedRows(rows);
          setImportPreview(rows.slice(0, 5));
        } catch (err) {
          setImportError("Failed to parse XLSX: " + err.message);
        }
      };
      reader.onerror = () => setImportError("Failed to read XLSX file.");
      reader.readAsArrayBuffer(file);
    } else {
      setImportError("Unsupported file format. Please upload a CSV or XLSX file.");
    }
  };

  const handleImport = async () => {
    if (!importedRows.length) return;
    setImporting(true);
    setImportError("");
    const toastId = toast.loading("Importing data...");
    try {
      if (onImport) {
        await onImport(importedRows);
      }
      setShowImportModal(false);
      setImportedRows([]);
      setImportPreview([]);
      toast.success("Data imported successfully!", { id: toastId });
    } catch (err) {
      setImportError(err.message || "Failed to import data");
      toast.error(err.message || "Failed to import data", { id: toastId });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      {(title || searchable || onAddNew || enableDateFilter) && (
        <div
          className="p-6 border-b bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-white/30 dark:border-gray-700/40"
          style={{ boxShadow: '0 4px 24px 0 rgba(30, 41, 59, 0.04)' }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {title && (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-0">
                {title}
              </h2>
            )}
            <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-4 w-full">
              {/* Unified Filter/Search Row */}
              <div className="flex flex-1 flex-wrap gap-3 items-center">
                {/* Search */}
                {searchable && (
                  <div className="relative">
                    <Icon
                      icon="mdi:magnify"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={table.searchTerm}
                      onChange={(e) => table.setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-56 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                )}
                {/* Status Filter */}
                {showStatusFilter && (
                  <div>
                    <select
                      value={table.statusFilter}
                      onChange={(e) => table.setStatusFilter(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="all">All</option>
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                )}
                {/* Refresh Button */}
                {onRefresh && (
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Refresh data"
                  >
                    <Icon
                      icon={isRefreshing ? "mdi:loading" : "mdi:refresh"}
                      className={`w-4 h-4 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                    {isRefreshing ? "Refreshing..." : "Refresh"}
                  </button>
                )}
                {/* Date Filter Button */}
                {enableDateFilter && (
                  <div className="relative">
                    <button
                      type="button"
                      ref={buttonRef}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={handleDateButtonClick}
                    >
                      <Icon icon="mdi:calendar-range" className="w-4 h-4" />
                      Filter by Date
                    </button>
                    {showDatePicker &&
                      ReactDOM.createPortal(
                        <div
                          ref={datePickerRef}
                          className="z-[9999] absolute bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4"
                          style={{
                            top: popoverPosition.top,
                            left: popoverPosition.left,
                          }}
                        >
                          <DateRange
                            ranges={dateRange}
                            onChange={(ranges) =>
                              setDateRange([ranges.selection])
                            }
                            moveRangeOnFirstSelection={false}
                            showDateDisplay={true}
                            editableDateInputs={true}
                            maxDate={new Date()}
                          />
                          <div className="flex justify-end mt-2 gap-2">
                            <button
                              className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100"
                              onClick={() => {
                                setDateRange([
                                  {
                                    startDate: null,
                                    endDate: null,
                                    key: "selection",
                                  },
                                ]);
                                setShowDatePicker(false);
                              }}
                            >
                              Clear
                            </button>
                            <button
                              className="px-3 py-1 rounded-lg bg-ndsi-blue text-white hover:bg-ndsi-green"
                              onClick={() => setShowDatePicker(false)}
                            >
                              Apply
                            </button>
                          </div>
                          {dateRange[0].startDate && dateRange[0].endDate && (
                            <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                              Showing from{" "}
                              {format(dateRange[0].startDate, "yyyy-MM-dd")} to{" "}
                              {format(dateRange[0].endDate, "yyyy-MM-dd")}
                            </div>
                          )}
                        </div>,
                        document.body
                      )}
                  </div>
                )}
              </div>
              {/* Export, Import, and Add New on the right */}
              <div className="flex items-center gap-3 ml-auto">
                {onAddUser && (
                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-ndsi-blue text-white rounded-lg hover:bg-ndsi-blue-700 transition-colors focus:ring-2 focus:ring-ndsi-blue focus:ring-offset-2"
                  >
                    <Icon icon="mdi:account-plus" className="w-4 h-4" />
                    Add User
                  </button>
                )}
                {/* <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Icon icon="mdi:upload" className="w-4 h-4" />
                  Import Data
                </button>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Icon icon="mdi:download" className="w-4 h-4" />
                  Export Data
                </button> */}
                {onAddNew && (
                  <button
                    onClick={onAddNew}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-ndsi-blue text-white rounded-lg hover:bg-ndsi-blue-700 transition-colors focus:ring-2 focus:ring-ndsi-blue focus:ring-offset-2"
                  >
                    <Icon icon="mdi:plus" className="w-4 h-4" />
                    {addNewLabel}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectable && table.selected.length > 0 && (
        <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {selectAllMode
                ? `All ${filteredByDate.length} users selected.`
                : `${table.selected.length} item${
                    table.selected.length !== 1 ? "s" : ""
                  } selected on this page.`}
            </span>
            <div className="flex gap-2 items-center">
              {canBulkApprove && (
                <button
                  onClick={() => onBulkApprove(table.selected)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                >
                  <Icon icon="mdi:check" className="w-4 h-4" />
                  Approve
                </button>
              )}
              {canBulkReject && (
                <button
                  onClick={() => onBulkReject(getBulkRejectIds())}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  <Icon icon="mdi:close" className="w-4 h-4" />
                  Reject
                </button>
              )}
              {(onBulkDelete || onDelete) && table.selected.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  <Icon icon="mdi:delete" className="w-4 h-4" />
                  Delete
                </button>
              )}
              {!selectAllMode &&
                table.selected.length === table.paged.length &&
                table.selected.length < filteredByDate.length && (
                  <button
                    className="text-xs px-3 py-1 rounded bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                    onClick={() => {
                      table.setSelected(filteredByDate.map((row) => row.id));
                      setSelectAllMode(true);
                    }}
                  >
                    Select all {filteredByDate.length} users
                  </button>
                )}
              {selectAllMode && (
                <button
                  className="text-xs px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => {
                    table.setSelected([]);
                    setSelectAllMode(false);
                  }}
                >
                  Clear selection
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto h-[600px] max-h-full md:max-h-screen overflow-y-auto">
        <table className="w-full">
          <thead className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-b border-white/30 dark:border-gray-700/40 sticky top-0 z-10">
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={
                      table.paged.length > 0 &&
                      (selectAllMode ||
                        table.paged.every((row) =>
                          table.selected.includes(row.id)
                        ))
                    }
                    indeterminate={
                      !selectAllMode &&
                      table.selected.length > 0 &&
                      table.selected.length < table.paged.length
                    }
                    onChange={selectAll}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.accessor}
                  className={`px-4 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 ${
                    col.sortable
                      ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                      : ""
                  }`}
                  onClick={
                    col.sortable
                      ? () => table.handleSort(col.accessor)
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2">
                    {col.header
                      .split(" ")
                      .map(
                        (word) =>
                          word.charAt(0).toUpperCase() +
                          word.slice(1).toLowerCase()
                      )
                      .join(" ")}
                    {col.sortable && (
                      <div className="flex flex-col">
                        <Icon
                          icon="mdi:chevron-up"
                          className={`w-3 h-3 ${
                            table.sortKey === col.accessor &&
                            table.sortDir === "asc"
                              ? "text-blue-600"
                              : "text-gray-300"
                          }`}
                        />
                        <Icon
                          icon="mdi:chevron-down"
                          className={`w-3 h-3 -mt-1 ${
                            table.sortKey === col.accessor &&
                            table.sortDir === "desc"
                              ? "text-blue-600"
                              : "text-gray-300"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + 1}
                  className="px-4 py-12 text-center"
                >
                  <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <div className="flex justify-center text-4xl mb-3 ">
                      <Icon icon="mdi:loading" className="w-10 h-10 animate-spin" />
                    </div>
                    <div className="text-sm font-medium">Please wait, loading data...</div>
                  </div>
                </td>
              </tr>
            ) : table.paged.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + 1}
                  className="px-4 py-12 text-center"
                >
                  <div className="text-gray-500 dark:text-gray-400">
                    <div className="flex justify-center text-4xl mb-3 ">
                      <Icon icon="mdi:table-search" className="w-10 h-10" />
                    </div>
                    <div className="text-sm font-medium">{emptyMessage}</div>
                  </div>
                </td>
              </tr>
            ) : (
              table.paged.map((row, index) => {
                const defaultRow = (
                  <tr
                    key={row.id || index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    {renderRowCells(row, index)}
                  </tr>
                );
                // If customRowRender is provided, use it to render extra content (e.g. expanded row)
                return customRowRender
                  ? customRowRender(row, index, defaultRow)
                  : defaultRow;
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with pagination */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
            <div>
              Showing{" "}
              <span className="font-medium">
                {(table.page - 1) * table.pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(table.page * table.pageSize, table.totalItems)}
              </span>{" "}
              of <span className="font-medium">{table.totalItems}</span> results
            </div>
            <div className="flex items-center gap-2">
              <span>Show:</span>
              <select
                value={table.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                {[5, 10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => table.handlePage(table.page - 1)}
              disabled={table.page === 1}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Icon icon="mdi:chevron-left" className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, table.totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => table.handlePage(pageNum)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      table.page === pageNum
                        ? "bg-ndsi-blue text-white shadow-sm"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => table.handlePage(table.page + 1)}
              disabled={table.page === table.totalPages}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <Icon icon="mdi:chevron-right" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        users={safeData}
        mode={mode}
        type="users"
      />
      <SimpleModal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportError("");
          setImportedRows([]);
          setImportPreview([]);
          setIsDragActive(false);
        }}
        title="Upload CSV / XLSX file to import user data"
        width="max-w-4xl"
      >
        <div className="space-y-6">
          {/* Header Description */}
          {/* <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-ndsi-blue rounded-full mb-4">
              <Icon icon="mdi:file-text" className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Upload your CSV file to import data
            </p>
          </div> */}

          {/* Required Columns */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800/50">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Icon
                icon="mdi:check-circle"
                className="w-5 h-5 text-green-500"
              />
              Required Columns
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {columns.map((col) => (
                <div
                  key={col.accessor}
                  className="flex items-center gap-3 p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {col.header}
                  </span>
                  {col.accessor !== col.header && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {col.accessor}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* File Upload Instructions */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <Icon
                icon="mdi:alert-circle"
                className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0"
              />
              <div className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                <p>• File must be in CSV or XLSX format with comma-separated values</p>
                <p>
                  • First row should contain column headers exactly as listed
                  above
                </p>
                <p>• All required fields must be present for each data row</p>
                <p>• Maximum file size: 10MB</p>
              </div>
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
              isDragActive
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/40 scale-105"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragActive(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragActive(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFileUpload(file);
            }}
          >
            <div className="text-center space-y-4">
              <div
                className={`inline-flex items-center justify-center w-16 h-16 rounded-full transition-all ${
                  isDragActive
                    ? "bg-blue-500 text-white scale-110"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                }`}
              >
                <Icon icon="mdi:upload" className="w-8 h-8" />
              </div>

              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {isDragActive
                    ? "Drop your file here"
                    : "Drag & drop CSV / XLSX / XLS file"}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  or click to browse
                </p>
              </div>

              <input
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </div>
          </div>

          {/* Error Display */}
          {importError && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <Icon
                icon="mdi:alert-circle"
                className="w-5 h-5 text-red-500 flex-shrink-0"
              />
              <p className="text-red-700 dark:text-red-400 text-sm">
                {importError}
              </p>
            </div>
          )}

          {/* Preview Table */}
          {importPreview.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Icon
                  icon="mdi:eye"
                  className="w-5 h-5 text-gray-600 dark:text-gray-400"
                />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Preview (first 5 rows)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-separate border-spacing-0">
                  <thead>
                    <tr>
                      {columns.map((col) => (
                        <th
                          key={col.accessor}
                          className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-700 first:rounded-tl-lg last:rounded-tr-lg border-b border-gray-200 dark:border-gray-600"
                        >
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((row, i) => (
                      <tr
                        key={i}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        {columns.map((col) => (
                          <td
                            key={col.accessor}
                            className="px-4 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                          >
                            {row[col.accessor]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowImportModal(false)}
              className="px-6 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={importedRows.length === 0 || importing}
              onClick={handleImport}
              className="px-6 py-2.5 bg-ndsi-blue hover:bg-ndsi-green disabled:bg-gray-400 text-white rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              {importing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Icon icon="mdi:upload" className="w-4 h-4" />
                  Import Data
                </>
              )}
            </button>
          </div>
        </div>
      </SimpleModal>
      {/* AddUserModal */}
      {onAddUser && (
        <AddUserModal
          isOpen={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
          loading={addUserLoading}
          onSubmit={async (formData) => {
            setAddUserLoading(true);
            const success = await onAddUser(formData);
            setAddUserLoading(false);
            if (success) setShowAddUserModal(false);
            return success;
          }}
        />
      )}
    </div>
  );
}
