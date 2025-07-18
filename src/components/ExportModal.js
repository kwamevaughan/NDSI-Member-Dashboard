"use client";
import { useState } from "react";
import { Icon } from "@iconify/react";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";
import { DragDropContext } from "@hello-pangea/dnd";
import FieldSelector from "./FieldSelector";
import FilterSection from "./FilterSection";
import PreviewTable from "./PreviewTable";
import useExportFilters from "../hooks/useExportFilters";

// Utility function to format date to DD-MM-YYYY
const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
        // If the date is already in DD/MM/YYYY format, convert it
        if (dateString.includes('/')) {
            const [datePart] = dateString.split(',');
            const [day, month, year] = datePart.split('/');
            return `${day}-${month}-${year}`;
        }
        
        // Otherwise parse as ISO date
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "-";
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return "-";
    }
};

export default function ExportModal({ isOpen, onClose, users, mode, type = "users" }) {
    // Only relevant user fields for export
    const getDefaultFields = () => ({
        full_name: true,
        email: true,
        organization_name: true,
        role_job_title: true,
        approval_status: true,
        is_approved: true,
        approved_by_name: true,
        approved_at: false,
        rejection_reason: false,
        created_at: true,
        updated_at: false,
        last_login_at: false,
        is_first_time: false,
    });

    const getFieldsOrder = () => ([
        { label: "Name", key: "full_name", icon: "mdi:account" },
        { label: "Email", key: "email", icon: "mdi:email" },
        { label: "Organization", key: "organization_name", icon: "mdi:office-building" },
        { label: "Job Title", key: "role_job_title", icon: "mdi:briefcase" },
        { label: "Approval Status", key: "approval_status", icon: "mdi:tag" },
        { label: "Approved", key: "is_approved", icon: "mdi:check-circle" },
        { label: "Approved By", key: "approved_by_name", icon: "mdi:account-check" },
        { label: "Approved At", key: "approved_at", icon: "mdi:calendar-check" },
        { label: "Rejection Reason", key: "rejection_reason", icon: "mdi:close-circle" },
        { label: "Registration Date", key: "created_at", icon: "mdi:calendar" },
        { label: "Last Updated", key: "updated_at", icon: "mdi:update" },
        { label: "Last Login", key: "last_login_at", icon: "mdi:login" },
        { label: "First Time Setup", key: "is_first_time", icon: "mdi:star" },
    ]);

    const [selectedFields, setSelectedFields] = useState(getDefaultFields());
    const [exportFormat, setExportFormat] = useState("csv");
    const [previewRows, setPreviewRows] = useState(3);
    const [fieldsOrder, setFieldsOrder] = useState(getFieldsOrder());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const { filterStatus, setFilterStatus, dateRange, setDateRange, filteredUsers } =
        useExportFilters(users);

    // Format the relevant fields for export
    const formattedUsers = filteredUsers.map(user => ({
        ...user,
        created_at: formatDate(user.created_at),
        updated_at: user.updated_at ? formatDate(user.updated_at) : "-",
        approved_at: user.approved_at ? formatDate(user.approved_at) : "-",
        last_login_at: user.last_login_at ? formatDate(user.last_login_at) : "-",
        is_approved: user.is_approved === true ? "Yes" : user.is_approved === false ? "No" : "-",
        is_first_time: user.is_first_time ? "Yes" : "No",
        approval_status: user.approval_status ? user.approval_status.charAt(0).toUpperCase() + user.approval_status.slice(1) : "-",
        approved_by_name: user.approved_by_name || "-",
        rejection_reason: user.rejection_reason || "-",
        organization_name: user.organization_name || "-",
        role_job_title: user.role_job_title || "-",
        full_name: user.full_name || "-",
        email: user.email || "-",
    }));


    const statuses = ["all", "Pending", "Reviewed", "Shortlisted", "Rejected"];

    const fallbackStaticRanges = [
        {
            label: "All Time",
            range: () => ({ startDate: null, endDate: null }),
            isSelected: () => !dateRange[0].startDate,
        },
        {
            label: "Today",
            range: () => {
                const today = new Date();
                return { startDate: today, endDate: today };
            },
            isSelected: (range) =>
                range.startDate?.toDateString() === new Date().toDateString() &&
                range.endDate?.toDateString() === new Date().toDateString(),
        },
        {
            label: "Last 7 Days",
            range: () => {
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - 6);
                return { startDate: start, endDate: end };
            },
            isSelected: (range) => {
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - 6);
                return (
                    range.startDate?.toDateString() === start.toDateString() &&
                    range.endDate?.toDateString() === end.toDateString()
                );
            },
        },
    ];

    const handleFieldToggle = (key) => {
        setSelectedFields((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSelectAll = () => {
        setSelectedFields(Object.fromEntries(fieldsOrder.map((f) => [f.key, true])));
        toast.success("All fields selected", { icon: "✅" });
    };

    const handleSelectNone = () => {
        setSelectedFields(Object.fromEntries(fieldsOrder.map((f) => [f.key, false])));
        toast.success("All fields deselected", { icon: "✅" });
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;
        const reorderedFields = Array.from(fieldsOrder);
        const [movedField] = reorderedFields.splice(result.source.index, 1);
        reorderedFields.splice(result.destination.index, 0, movedField);
        setFieldsOrder(reorderedFields);
        toast.success("Fields reordered", { icon: "✅" });
    };

    const csvHeaders = fieldsOrder.filter((f) => selectedFields[f.key]).map((f) => ({
        label: f.label,
        key: f.key,
    }));

    const exportPDF = () => {
        const selectedKeys = fieldsOrder.filter((f) => selectedFields[f.key]).map((f) => f.key);
        if (selectedKeys.length === 0) {
            toast.error("Please select at least one field to export!", { icon: "⚠️" });
            return;
        }

        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("NDSI Members Export", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);

        autoTable(doc, {
            head: [selectedKeys.map((key) => fieldsOrder.find((f) => f.key === key).label)],
            body: formattedUsers.map((user) =>
                selectedKeys.map((key) => user[key] || "-")
            ),
            startY: 30,
            theme: "striped",
            headStyles: { fillColor: [240, 93, 35] },
            styles: { textColor: mode === "dark" ? 255 : 35 },
        });

        doc.save("ndsi_members_export.pdf");
        toast.success("PDF exported successfully!", { icon: "✅" });
    };

    const handleExportClick = () => {
        if (Object.values(selectedFields).every((v) => !v)) {
            toast.error("Please select at least one field to export!", { icon: "⚠️" });
            return false;
        }
        toast.success("CSV exported successfully!", { icon: "✅" });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[9999]">
            <div
                className={`rounded-xl max-w-2xl w-full mx-0 shadow-2xl transform transition-all duration-300 animate-fade-in flex flex-col max-h-[80vh] ${
                    mode === "dark" ? "bg-gray-800 text-white" : "bg-white text-[#231812]"
                }`}
            >
                <div className="bg-ndsi-blue rounded-t-xl p-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <Icon icon="mdi:export" className="w-8 h-8 text-white mr-3" />
                        <h2 className="text-2xl font-bold text-white">Export User Data
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-200 transition duration-200"
                    >
                        <Icon icon="mdi:close" width={24} height={24} />  
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-200 relative">
                    <div className="p-6 space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label
                                    className={`block text-sm font-medium ${
                                        mode === "dark"
                                            ? "text-gray-200 bg-gray-800"
                                            : "text-[#231812] bg-white"
                                    }`}
                                >
                                    Select Fields to Export
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSelectAll}
                                        className={`text-xs px-2 py-1 rounded-full ${
                                            mode === "dark"
                                                ? "bg-gray-700 text-ndsi-blue hover:bg-gray-600"
                                                : "bg-gray-200 text-ndsi-blue hover:bg-gray-300"
                                        }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={handleSelectNone}
                                        className={`text-xs px-2 py-1 rounded-full ${
                                            mode === "dark"
                                                ? "bg-gray-700 text-ndsi-blue hover:bg-gray-600"
                                                : "bg-gray-200 text-ndsi-blue hover:bg-gray-300"
                                        }`}
                                    >
                                        None
                                    </button>
                                </div>
                            </div>
                            <DragDropContext onDragEnd={onDragEnd}>
                                <FieldSelector
                                    fieldsOrder={fieldsOrder}
                                    selectedFields={selectedFields}
                                    handleFieldToggle={handleFieldToggle}
                                    mode={mode}
                                />
                            </DragDropContext>
                        </div>
                        <FilterSection
                            filterStatus={filterStatus}
                            setFilterStatus={setFilterStatus}
                            dateRange={dateRange}
                            setDateRange={setDateRange}
                            showDatePicker={showDatePicker}
                            setShowDatePicker={setShowDatePicker}
                            mode={mode}
                            statuses={statuses}
                            fallbackStaticRanges={fallbackStaticRanges}
                        />
                        <div>
                            <label
                                className={`block text-sm font-medium mb-2 ${
                                    mode === "dark"
                                        ? "text-gray-200 bg-gray-800"
                                        : "text-[#231812] bg-white"
                                }`}
                            >
                                Export Format
                            </label>
                            <select
                                value={exportFormat}
                                onChange={(e) => setExportFormat(e.target.value)}
                                className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ndsi-blue text-sm ${
                                    mode === "dark"
                                        ? "bg-gray-700 border-gray-600 text-white"
                                        : "bg-gray-50 border-gray-300 text-[#231812]"
                                }`}
                            >
                                <option value="csv">CSV</option>
                                <option value="pdf">PDF</option>
                            </select>
                        </div>
                        <div>
                            <label
                                className={`block text-sm font-medium mb-2 ${
                                    mode === "dark"
                                        ? "text-gray-200 bg-gray-800"
                                        : "text-[#231812] bg-white"
                                }`}
                            >
                                Preview Rows
                            </label>
                            <select
                                value={previewRows}
                                onChange={(e) => setPreviewRows(Number(e.target.value))}
                                className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ndsi-blue text-sm ${
                                    mode === "dark"
                                        ? "bg-gray-700 border-gray-600 text-white"
                                        : "bg-gray-50 border-gray-300 text-[#231812]"
                                }`}
                            >
                                <option value={3}>3 Rows</option>
                                <option value={5}>5 Rows</option>
                                <option value={10}>10 Rows</option>
                            </select>
                            <PreviewTable
                                filteredUsers={formattedUsers}
                                csvHeaders={csvHeaders}
                                previewRows={previewRows}
                                mode={mode}
                            />
                        </div>
                    </div>
                </div>
                <div
                    className={`sticky bottom-0 p-4 border-t rounded-b-xl shadow-md ${
                        mode === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                    }`}
                >
                    <div className="flex justify-end gap-4">
                        <button
                            onClick={onClose}
                            className={`px-6 py-2 rounded-full flex items-center gap-2 transition duration-200 shadow-md hover:shadow-lg ${
                                mode === "dark"
                                    ? "bg-gray-700 text-white hover:bg-gray-600"
                                    : "bg-gray-200 text-[#231812] hover:bg-gray-300"
                            }`}
                        >
                            <Icon icon="mdi:close" width={20} height={20} />
                            Cancel
                        </button>
                        {exportFormat === "csv" ? (
                            <CSVLink
                                data={formattedUsers}
                                headers={csvHeaders}
                                filename="ndsi_members_export.csv"
                                onClick={handleExportClick}
                                className={`px-6 py-2 rounded-full flex items-center gap-2 transition duration-200 shadow-md hover:shadow-lg ${
                                    mode === "dark"
                                        ? "bg-ndsi-blue text-white hover:bg-ndsi-blue"
                                        : "bg-ndsi-blue text-white hover:bg-ndsi-blue"
                                }`}
                            >
                                <Icon icon="mdi:download" width={20} height={20} />
                                Export CSV
                            </CSVLink>
                        ) : (
                            <button
                                onClick={exportPDF}
                                className={`px-6 py-2 rounded-full flex items-center gap-2 transition duration-200 shadow-md hover:shadow-lg ${
                                    mode === "dark"
                                        ? "bg-ndsi-blue text-white hover:bg-ndsi-blue"
                                        : "bg-ndsi-blue text-white hover:bg-ndsi-blue"
                                }`}
                            >
                                <Icon icon="mdi:download" width={20} height={20} />
                                Export PDF
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}