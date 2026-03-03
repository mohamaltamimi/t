"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import EmptyState from "@/components/EmptyState";

interface SOP {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  version: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { value: "operations", label: "Operations" },
  { value: "safety", label: "Safety" },
  { value: "hr", label: "HR" },
  { value: "compliance", label: "Compliance" },
  { value: "training", label: "Training" },
];

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "published":
      return "badge-success";
    case "draft":
      return "badge-warning";
    case "archived":
      return "badge-gray";
    default:
      return "badge-gray";
  }
}

function getCategoryBadgeClass(category: string): string {
  switch (category) {
    case "operations":
      return "badge-info";
    case "safety":
      return "badge-warning";
    case "hr":
      return "badge-success";
    case "compliance":
      return "badge-gray";
    case "training":
      return "badge-info";
    default:
      return "badge-gray";
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const emptyForm = {
  title: "",
  description: "",
  content: "",
  category: "operations",
  version: "1.0",
  status: "draft",
};

export default function SOPsPage() {
  const [sops, setSOPs] = useState<SOP[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [selectedSOP, setSelectedSOP] = useState<SOP | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchSOPs = useCallback(async () => {
    try {
      setLoading(true);
      const url =
        statusFilter === "all"
          ? "/api/sops"
          : `/api/sops?status=${statusFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSOPs(data);
      }
    } catch {
      console.error("Failed to fetch SOPs");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchSOPs();
  }, [fetchSOPs]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/sops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setFormData(emptyForm);
        fetchSOPs();
      }
    } catch {
      console.error("Failed to create SOP");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSOP) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sops/${selectedSOP.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowEditModal(false);
        setSelectedSOP(null);
        setFormData(emptyForm);
        fetchSOPs();
      }
    } catch {
      console.error("Failed to update SOP");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSOP) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sops/${selectedSOP.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setShowDeleteConfirm(false);
        setSelectedSOP(null);
        fetchSOPs();
      }
    } catch {
      console.error("Failed to delete SOP");
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setFormData(emptyForm);
    setShowCreateModal(true);
  };

  const openViewModal = (sop: SOP) => {
    setSelectedSOP(sop);
    setShowViewModal(true);
  };

  const openEditModal = (sop: SOP) => {
    setSelectedSOP(sop);
    setFormData({
      title: sop.title,
      description: sop.description,
      content: sop.content,
      category: sop.category,
      version: sop.version,
      status: sop.status,
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (sop: SOP) => {
    setSelectedSOP(sop);
    setShowDeleteConfirm(true);
  };

  const renderForm = (onSubmit: (e: React.FormEvent) => void, submitLabel: string) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          required
          className="input-field"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g. Opening Procedures"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input
          type="text"
          required
          className="input-field"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of this SOP"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          className="input-field"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
        <textarea
          required
          rows={8}
          className="input-field"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Write the full SOP content here. You can use rich text formatting..."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
          <input
            type="text"
            required
            className="input-field"
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            placeholder="e.g. 1.0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            className="input-field"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
          }}
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );

  return (
    <>
      <PageHeader
        title="SOPs"
        description="Standard Operating Procedures for your organization."
        action={
          <button className="btn-primary" onClick={openCreateModal}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create SOP
          </button>
        }
      />

      {/* Status Filter */}
      <div className="flex items-center gap-2 mb-6">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
              statusFilter === filter.value
                ? "bg-primary-100 text-primary-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-full mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-4" />
              <div className="flex gap-2">
                <div className="h-5 bg-gray-200 rounded-full w-16" />
                <div className="h-5 bg-gray-200 rounded-full w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : sops.length === 0 ? (
        <EmptyState
          title="No SOPs found"
          description={
            statusFilter !== "all"
              ? `No SOPs with status "${statusFilter}". Try a different filter or create a new SOP.`
              : "Get started by creating your first Standard Operating Procedure."
          }
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          }
          action={
            <button className="btn-primary" onClick={openCreateModal}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create SOP
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sops.map((sop) => (
            <div
              key={sop.id}
              className="card hover:shadow-md transition-shadow duration-200 flex flex-col"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 mr-3">
                  <h3 className="text-base font-semibold text-gray-900 truncate">{sop.title}</h3>
                </div>
                <span className={getStatusBadgeClass(sop.status)}>
                  {sop.status.charAt(0).toUpperCase() + sop.status.slice(1)}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{sop.description}</p>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={getCategoryBadgeClass(sop.category)}>
                  {sop.category.charAt(0).toUpperCase() + sop.category.slice(1)}
                </span>
                <span className="badge-info">
                  v{sop.version}
                </span>
              </div>

              {/* Footer */}
              <div className="mt-auto pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Updated {formatDate(sop.updatedAt)}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openViewModal(sop)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="View SOP"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => openEditModal(sop)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Edit SOP"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(sop)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete SOP"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create SOP" size="lg">
        {renderForm(handleCreate, "Create SOP")}
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit SOP" size="lg">
        {renderForm(handleEdit, "Save Changes")}
      </Modal>

      {/* View Modal */}
      <Modal
        open={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedSOP(null);
        }}
        title={selectedSOP?.title || "SOP Details"}
        size="lg"
      >
        {selectedSOP && (
          <div className="space-y-5">
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={getStatusBadgeClass(selectedSOP.status)}>
                {selectedSOP.status.charAt(0).toUpperCase() + selectedSOP.status.slice(1)}
              </span>
              <span className={getCategoryBadgeClass(selectedSOP.category)}>
                {selectedSOP.category.charAt(0).toUpperCase() + selectedSOP.category.slice(1)}
              </span>
              <span className="badge-info">v{selectedSOP.version}</span>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
              <p className="text-sm text-gray-600">{selectedSOP.description}</p>
            </div>

            {/* Content */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Content</h4>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                {selectedSOP.content}
              </div>
            </div>

            {/* Timestamps */}
            <div className="flex items-center gap-6 pt-4 border-t border-gray-100 text-xs text-gray-400">
              <span>Created {formatDate(selectedSOP.createdAt)}</span>
              <span>Updated {formatDate(selectedSOP.updatedAt)}</span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedSOP(null);
                }}
              >
                Close
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(selectedSOP);
                }}
              >
                Edit SOP
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedSOP(null);
        }}
        title="Delete SOP"
        size="sm"
      >
        {selectedSOP && (
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Are you sure you want to delete this SOP?
            </p>
            <p className="text-sm font-medium text-gray-900 mb-4">
              &ldquo;{selectedSOP.title}&rdquo;
            </p>
            <p className="text-xs text-gray-400 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedSOP(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleDelete}
                disabled={submitting}
              >
                {submitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
