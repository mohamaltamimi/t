"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import EmptyState from "@/components/EmptyState";

interface ChecklistItem {
  id?: string;
  label: string;
  type: "checkbox" | "text" | "number" | "photo";
  required: boolean;
  sortOrder: number;
}

interface Location {
  id: string;
  name: string;
}

interface Checklist {
  id: string;
  title: string;
  description: string;
  category: string;
  frequency: string;
  status: string;
  locationId: string | null;
  location: Location | null;
  items: ChecklistItem[];
  _count: { responses: number };
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { value: "operations", label: "Operations" },
  { value: "safety", label: "Safety" },
  { value: "quality", label: "Quality" },
  { value: "hygiene", label: "Hygiene" },
];

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const ITEM_TYPES = [
  { value: "checkbox", label: "Checkbox" },
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "photo", label: "Photo" },
];

const emptyForm = {
  title: "",
  description: "",
  category: "operations",
  frequency: "daily",
  locationId: "",
  items: [] as ChecklistItem[],
};

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null);
  const [deletingChecklist, setDeletingChecklist] = useState<Checklist | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchChecklists = useCallback(async () => {
    try {
      const res = await fetch("/api/checklists");
      if (res.ok) {
        const data = await res.json();
        setChecklists(data);
      }
    } catch (error) {
      console.error("Failed to fetch checklists:", error);
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
    } catch (error) {
      console.error("Failed to fetch locations:", error);
    }
  }, []);

  useEffect(() => {
    fetchChecklists();
    fetchLocations();
  }, [fetchChecklists, fetchLocations]);

  function openCreateModal() {
    setEditingChecklist(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(checklist: Checklist) {
    setEditingChecklist(checklist);
    setForm({
      title: checklist.title,
      description: checklist.description,
      category: checklist.category,
      frequency: checklist.frequency,
      locationId: checklist.locationId || "",
      items: checklist.items.map((item, index) => ({
        label: item.label,
        type: item.type as "checkbox" | "text" | "number" | "photo",
        required: item.required,
        sortOrder: index,
      })),
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingChecklist(null);
    setForm(emptyForm);
  }

  function addItem() {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          label: "",
          type: "checkbox" as const,
          required: true,
          sortOrder: prev.items.length,
        },
      ],
    }));
  }

  function removeItem(index: number) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index).map((item, i) => ({ ...item, sortOrder: i })),
    }));
  }

  function updateItem(index: number, field: string, value: string | boolean) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        frequency: form.frequency,
        locationId: form.locationId || null,
        items: form.items.map((item, index) => ({
          label: item.label,
          type: item.type,
          required: item.required,
          sortOrder: index,
        })),
      };

      const url = editingChecklist
        ? `/api/checklists/${editingChecklist.id}`
        : "/api/checklists";
      const method = editingChecklist ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        closeModal();
        fetchChecklists();
      }
    } catch (error) {
      console.error("Failed to save checklist:", error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deletingChecklist || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/checklists/${deletingChecklist.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDeleteModalOpen(false);
        setDeletingChecklist(null);
        fetchChecklists();
      }
    } catch (error) {
      console.error("Failed to delete checklist:", error);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(checklist: Checklist) {
    const newStatus = checklist.status === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`/api/checklists/${checklist.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: checklist.title,
          description: checklist.description,
          category: checklist.category,
          frequency: checklist.frequency,
          locationId: checklist.locationId,
          status: newStatus,
          items: checklist.items.map((item, index) => ({
            label: item.label,
            type: item.type,
            required: item.required,
            sortOrder: index,
          })),
        }),
      });

      if (res.ok) {
        fetchChecklists();
      }
    } catch (error) {
      console.error("Failed to toggle status:", error);
    }
  }

  function getCategoryBadge(category: string) {
    switch (category) {
      case "operations":
        return "badge-info";
      case "safety":
        return "badge-warning";
      case "quality":
        return "badge-success";
      case "hygiene":
        return "badge-success";
      default:
        return "badge-info";
    }
  }

  function getFrequencyBadge(frequency: string) {
    switch (frequency) {
      case "daily":
        return "badge-info";
      case "weekly":
        return "badge-warning";
      case "monthly":
        return "badge-success";
      default:
        return "badge-info";
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Checklists" description="Manage operational checklists for your locations." />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Checklists"
        description="Manage operational checklists for your locations."
        action={
          <button onClick={openCreateModal} className="btn-primary">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Checklist
          </button>
        }
      />

      {checklists.length === 0 ? (
        <EmptyState
          title="No checklists yet"
          description="Create your first checklist to start standardizing operations across your locations."
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
              />
            </svg>
          }
          action={
            <button onClick={openCreateModal} className="btn-primary">
              Create Checklist
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {checklists.map((checklist) => (
            <div key={checklist.id} className="card flex flex-col">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 mr-3">
                  <h3 className="text-base font-semibold text-gray-900 truncate">{checklist.title}</h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{checklist.description}</p>
                </div>
                <button
                  onClick={() => toggleStatus(checklist)}
                  className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    checklist.status === "active" ? "bg-green-500" : "bg-gray-300"
                  }`}
                  title={checklist.status === "active" ? "Deactivate" : "Activate"}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      checklist.status === "active" ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={getCategoryBadge(checklist.category)}>
                  {checklist.category.charAt(0).toUpperCase() + checklist.category.slice(1)}
                </span>
                <span className={getFrequencyBadge(checklist.frequency)}>
                  {checklist.frequency.charAt(0).toUpperCase() + checklist.frequency.slice(1)}
                </span>
                <span className={checklist.status === "active" ? "badge-success" : "badge-warning"}>
                  {checklist.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4 flex-1">
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                    />
                  </svg>
                  {checklist.items.length} {checklist.items.length === 1 ? "item" : "items"}
                </div>
                {checklist.location && (
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                      />
                    </svg>
                    {checklist.location.name}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
                    />
                  </svg>
                  {checklist._count.responses} {checklist._count.responses === 1 ? "response" : "responses"}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => openEditModal(checklist)}
                  className="btn-secondary flex-1 text-xs py-2"
                >
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                    />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => {
                    setDeletingChecklist(checklist);
                    setDeleteModalOpen(true);
                  }}
                  className="btn-danger flex-1 text-xs py-2"
                >
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingChecklist ? "Edit Checklist" : "Create Checklist"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="input-field"
              placeholder="e.g., Morning Opening Checklist"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="input-field"
              rows={3}
              placeholder="Describe the purpose and scope of this checklist"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="input-field"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select
                value={form.frequency}
                onChange={(e) => setForm((prev) => ({ ...prev, frequency: e.target.value }))}
                className="input-field"
              >
                {FREQUENCIES.map((freq) => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              value={form.locationId}
              onChange={(e) => setForm((prev) => ({ ...prev, locationId: e.target.value }))}
              className="input-field"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Checklist Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Checklist Items</label>
              <button
                type="button"
                onClick={addItem}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Item
              </button>
            </div>

            {form.items.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-sm text-gray-500">No items added yet. Click &quot;Add Item&quot; to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {form.items.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs font-medium text-gray-400 mt-2.5 shrink-0 w-5 text-center">
                      {index + 1}
                    </span>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => updateItem(index, "label", e.target.value)}
                        className="input-field"
                        placeholder="Item label"
                        required
                      />
                      <div className="flex items-center gap-3">
                        <select
                          value={item.type}
                          onChange={(e) => updateItem(index, "type", e.target.value)}
                          className="input-field text-xs py-1.5"
                        >
                          {ITEM_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-1.5 text-xs text-gray-600 whitespace-nowrap cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.required}
                            onChange={(e) => updateItem(index, "required", e.target.checked)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          Required
                        </label>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-1"
                      title="Remove item"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={closeModal} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting
                ? "Saving..."
                : editingChecklist
                ? "Update Checklist"
                : "Create Checklist"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingChecklist(null);
        }}
        title="Delete Checklist"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900">{deletingChecklist?.title}</span>?
            This action cannot be undone and will remove all associated items.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setDeleteModalOpen(false);
                setDeletingChecklist(null);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button onClick={handleDelete} disabled={submitting} className="btn-danger">
              {submitting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
