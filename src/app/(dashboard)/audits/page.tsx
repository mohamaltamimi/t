"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import EmptyState from "@/components/EmptyState";

interface AuditQuestion {
  id?: string;
  question: string;
  type: "yes_no" | "rating" | "text" | "photo";
  weight: number;
  sortOrder?: number;
}

interface Location {
  id: string;
  name: string;
  city: string;
}

interface AuditResponse {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string };
  data: string;
  score: number | null;
  completedAt: string;
}

interface Audit {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  locationId: string | null;
  location: Location | null;
  questions: AuditQuestion[];
  responses?: AuditResponse[];
  _count: { responses: number };
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { value: "food_safety", label: "Food Safety" },
  { value: "cleanliness", label: "Cleanliness" },
  { value: "visual_merchandising", label: "Visual Merchandising" },
  { value: "operations", label: "Operations" },
  { value: "compliance", label: "Compliance" },
];

const QUESTION_TYPES = [
  { value: "yes_no", label: "Yes / No" },
  { value: "rating", label: "Rating (1-5)" },
  { value: "text", label: "Text" },
  { value: "photo", label: "Photo" },
];

function getCategoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label || value;
}

function getCategoryBadgeClass(category: string): string {
  switch (category) {
    case "food_safety":
      return "badge-warning";
    case "cleanliness":
      return "badge-success";
    case "visual_merchandising":
      return "badge-info";
    case "operations":
      return "badge-info";
    case "compliance":
      return "badge-warning";
    default:
      return "badge-info";
  }
}

function getQuestionTypeLabel(type: string): string {
  return QUESTION_TYPES.find((t) => t.value === type)?.label || type;
}

const emptyQuestion: AuditQuestion = {
  question: "",
  type: "yes_no",
  weight: 1.0,
};

export default function AuditsPage() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "food_safety",
    locationId: "",
  });
  const [formQuestions, setFormQuestions] = useState<AuditQuestion[]>([
    { ...emptyQuestion },
  ]);

  // Selected audit for detail/edit/delete
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [detailAudit, setDetailAudit] = useState<Audit | null>(null);

  const fetchAudits = useCallback(async () => {
    try {
      const res = await fetch("/api/audits");
      if (res.ok) {
        const data = await res.json();
        setAudits(data);
      }
    } catch (error) {
      console.error("Failed to fetch audits:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch("/api/locations");
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch {
      // Locations API may not exist yet
    }
  }, []);

  useEffect(() => {
    fetchAudits();
    fetchLocations();
  }, [fetchAudits, fetchLocations]);

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "food_safety",
      locationId: "",
    });
    setFormQuestions([{ ...emptyQuestion }]);
  };

  // Open create modal
  const handleOpenCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  // Open edit modal
  const handleOpenEdit = (audit: Audit) => {
    setSelectedAudit(audit);
    setFormData({
      title: audit.title,
      description: audit.description,
      category: audit.category,
      locationId: audit.locationId || "",
    });
    setFormQuestions(
      audit.questions.length > 0
        ? audit.questions.map((q) => ({
            question: q.question,
            type: q.type as AuditQuestion["type"],
            weight: q.weight,
          }))
        : [{ ...emptyQuestion }]
    );
    setShowEditModal(true);
  };

  // Open detail modal
  const handleOpenDetail = async (audit: Audit) => {
    try {
      const res = await fetch(`/api/audits/${audit.id}`);
      if (res.ok) {
        const data = await res.json();
        setDetailAudit(data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error("Failed to fetch audit detail:", error);
    }
  };

  // Open delete confirmation
  const handleOpenDelete = (audit: Audit) => {
    setSelectedAudit(audit);
    setShowDeleteConfirm(true);
  };

  // Add question
  const handleAddQuestion = () => {
    setFormQuestions([...formQuestions, { ...emptyQuestion }]);
  };

  // Remove question
  const handleRemoveQuestion = (index: number) => {
    if (formQuestions.length <= 1) return;
    setFormQuestions(formQuestions.filter((_, i) => i !== index));
  };

  // Update question field
  const handleQuestionChange = (
    index: number,
    field: keyof AuditQuestion,
    value: string | number
  ) => {
    const updated = [...formQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setFormQuestions(updated);
  };

  // Create audit
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          locationId: formData.locationId || null,
          questions: formQuestions.filter((q) => q.question.trim() !== ""),
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        resetForm();
        fetchAudits();
      }
    } catch (error) {
      console.error("Failed to create audit:", error);
    } finally {
      setSaving(false);
    }
  };

  // Update audit
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAudit) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/audits/${selectedAudit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          locationId: formData.locationId || null,
          questions: formQuestions.filter((q) => q.question.trim() !== ""),
        }),
      });
      if (res.ok) {
        setShowEditModal(false);
        setSelectedAudit(null);
        resetForm();
        fetchAudits();
      }
    } catch (error) {
      console.error("Failed to update audit:", error);
    } finally {
      setSaving(false);
    }
  };

  // Delete audit
  const handleDelete = async () => {
    if (!selectedAudit) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/audits/${selectedAudit.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setShowDeleteConfirm(false);
        setSelectedAudit(null);
        fetchAudits();
      }
    } catch (error) {
      console.error("Failed to delete audit:", error);
    } finally {
      setSaving(false);
    }
  };

  // Audit form (shared between create/edit)
  const renderAuditForm = (onSubmit: (e: React.FormEvent) => void) => (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          className="input-field"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          placeholder="e.g. Monthly Kitchen Audit"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          className="input-field"
          rows={3}
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Describe the purpose of this audit..."
          required
        />
      </div>

      {/* Category & Location row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            className="input-field"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            required
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <select
            className="input-field"
            value={formData.locationId}
            onChange={(e) =>
              setFormData({ ...formData, locationId: e.target.value })
            }
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} - {loc.city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Questions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Audit Questions
          </label>
          <button
            type="button"
            onClick={handleAddQuestion}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            + Add Question
          </button>
        </div>
        <div className="space-y-3">
          {formQuestions.map((q, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold mt-1 flex-shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <input
                    type="text"
                    className="input-field"
                    value={q.question}
                    onChange={(e) =>
                      handleQuestionChange(index, "question", e.target.value)
                    }
                    placeholder="Enter your question..."
                    required
                  />
                </div>
                {formQuestions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(index)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded mt-1 flex-shrink-0"
                    title="Remove question"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 pl-9">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Type
                  </label>
                  <select
                    className="input-field text-sm"
                    value={q.type}
                    onChange={(e) =>
                      handleQuestionChange(index, "type", e.target.value)
                    }
                  >
                    {QUESTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Weight
                  </label>
                  <input
                    type="number"
                    className="input-field text-sm"
                    value={q.weight}
                    onChange={(e) =>
                      handleQuestionChange(
                        index,
                        "weight",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    min={0}
                    max={10}
                    step={0.5}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
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
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving..." : selectedAudit ? "Update Audit" : "Create Audit"}
        </button>
      </div>
    </form>
  );

  if (loading) {
    return (
      <>
        <PageHeader title="Audits" description="Manage store audits and inspections" />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Audits"
        description="Manage store audits and inspections"
        action={
          <button onClick={handleOpenCreate} className="btn-primary">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Create Audit
          </button>
        }
      />

      {/* Audit Cards Grid */}
      {audits.length === 0 ? (
        <EmptyState
          title="No audits yet"
          description="Create your first audit to start inspecting locations and tracking compliance."
          icon={
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
              />
            </svg>
          }
          action={
            <button onClick={handleOpenCreate} className="btn-primary">
              Create Your First Audit
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {audits.map((audit) => (
            <div key={audit.id} className="card hover:shadow-md transition-shadow">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {audit.title}
                  </h3>
                </div>
                <span className={getCategoryBadgeClass(audit.category)}>
                  {getCategoryLabel(audit.category)}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                {audit.description}
              </p>

              {/* Stats Row */}
              <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                    />
                  </svg>
                  <span>
                    {audit.questions.length}{" "}
                    {audit.questions.length === 1 ? "question" : "questions"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                  </svg>
                  <span>
                    {audit._count.responses}{" "}
                    {audit._count.responses === 1 ? "response" : "responses"}
                  </span>
                </div>
              </div>

              {/* Location */}
              {audit.location && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                    />
                  </svg>
                  <span>
                    {audit.location.name}, {audit.location.city}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleOpenDetail(audit)}
                  className="btn-secondary text-xs px-3 py-1.5 flex-1"
                >
                  <svg
                    className="w-3.5 h-3.5 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  View
                </button>
                <button
                  onClick={() => handleOpenEdit(audit)}
                  className="btn-secondary text-xs px-3 py-1.5 flex-1"
                >
                  <svg
                    className="w-3.5 h-3.5 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                    />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => handleOpenDelete(audit)}
                  className="btn-danger text-xs px-3 py-1.5"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Audit"
        size="lg"
      >
        {renderAuditForm(handleCreate)}
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAudit(null);
        }}
        title="Edit Audit"
        size="lg"
      >
        {renderAuditForm(handleUpdate)}
      </Modal>

      {/* Detail / Responses Modal */}
      <Modal
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setDetailAudit(null);
        }}
        title={detailAudit?.title || "Audit Details"}
        size="lg"
      >
        {detailAudit && (
          <div className="space-y-6">
            {/* Audit Info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={getCategoryBadgeClass(detailAudit.category)}>
                  {getCategoryLabel(detailAudit.category)}
                </span>
                <span
                  className={
                    detailAudit.status === "active"
                      ? "badge-success"
                      : "badge-warning"
                  }
                >
                  {detailAudit.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">{detailAudit.description}</p>
              {detailAudit.location && (
                <p className="text-xs text-gray-400 mt-2">
                  Location: {detailAudit.location.name},{" "}
                  {detailAudit.location.city}
                </p>
              )}
            </div>

            {/* Questions List */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Questions ({detailAudit.questions.length})
              </h4>
              <div className="space-y-2">
                {detailAudit.questions.map((q, index) => (
                  <div
                    key={q.id || index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                  >
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{q.question}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">
                          {getQuestionTypeLabel(q.type)}
                        </span>
                        <span className="text-xs text-gray-300">|</span>
                        <span className="text-xs text-gray-400">
                          Weight: {q.weight}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Responses */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Responses ({detailAudit.responses?.length || 0})
              </h4>
              {!detailAudit.responses || detailAudit.responses.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">
                  No responses submitted yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {detailAudit.responses.map((response) => (
                    <div
                      key={response.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                    >
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary-700">
                          {response.score != null
                            ? `${Math.round(response.score)}%`
                            : "--"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {response.user.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(response.completedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                      <span
                        className={
                          response.score != null && response.score >= 80
                            ? "badge-success"
                            : response.score != null && response.score >= 50
                            ? "badge-warning"
                            : "badge-info"
                        }
                      >
                        {response.score != null
                          ? response.score >= 80
                            ? "Pass"
                            : response.score >= 50
                            ? "Needs Work"
                            : "Fail"
                          : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailAudit(null);
                }}
                className="btn-secondary"
              >
                Close
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
          setSelectedAudit(null);
        }}
        title="Delete Audit"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900">
              {selectedAudit?.title}
            </span>
            ? This will also delete all associated questions and responses. This
            action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3">
            <button
              className="btn-secondary"
              onClick={() => {
                setShowDeleteConfirm(false);
                setSelectedAudit(null);
              }}
            >
              Cancel
            </button>
            <button
              className="btn-danger"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete Audit"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
