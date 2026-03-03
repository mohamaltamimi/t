"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import EmptyState from "@/components/EmptyState";

interface TrainingModule {
  id?: string;
  title: string;
  content: string;
  type: string;
  sortOrder?: number;
}

interface TrainingProgress {
  id: string;
  userId: string;
  status: string;
  score: number | null;
  startedAt: string;
  completedAt: string | null;
  user: { id: string; name: string; email: string };
}

interface Training {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  duration: number;
  status: string;
  modules: TrainingModule[];
  progress?: TrainingProgress[];
  _count?: { progress: number };
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { value: "onboarding", label: "Onboarding" },
  { value: "safety", label: "Safety" },
  { value: "operations", label: "Operations" },
  { value: "product", label: "Product" },
  { value: "compliance", label: "Compliance" },
];

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const MODULE_TYPES = [
  { value: "lesson", label: "Lesson" },
  { value: "quiz", label: "Quiz" },
  { value: "video", label: "Video" },
];

const emptyForm = {
  title: "",
  description: "",
  content: "",
  category: "onboarding",
  duration: "30",
  status: "draft",
};

const emptyModule: TrainingModule = {
  title: "",
  content: "",
  type: "lesson",
};

function statusBadge(status: string) {
  switch (status) {
    case "published":
      return "badge-success";
    case "draft":
      return "badge-warning";
    case "archived":
      return "badge-info";
    default:
      return "badge-info";
  }
}

function categoryBadge(category: string) {
  switch (category) {
    case "safety":
      return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20";
    case "compliance":
      return "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20";
    case "onboarding":
      return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20";
    case "operations":
      return "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20";
    case "product":
      return "bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/20";
    default:
      return "bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20";
  }
}

function moduleTypeIcon(type: string) {
  switch (type) {
    case "lesson":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      );
    case "quiz":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
      );
    case "video":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function TrainingPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchTrainings = useCallback(async () => {
    try {
      const res = await fetch("/api/training");
      if (res.ok) {
        const data = await res.json();
        setTrainings(data.trainings);
      }
    } catch (error) {
      console.error("Failed to fetch trainings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  function openCreate() {
    setForm(emptyForm);
    setModules([]);
    setEditingTraining(null);
    setShowCreateModal(true);
  }

  function openEdit(training: Training) {
    setForm({
      title: training.title,
      description: training.description,
      content: training.content,
      category: training.category,
      duration: String(training.duration),
      status: training.status,
    });
    setModules(
      training.modules.map((m) => ({
        title: m.title,
        content: m.content,
        type: m.type,
      }))
    );
    setEditingTraining(training);
    setShowDetailModal(false);
    setShowCreateModal(true);
  }

  async function openDetail(training: Training) {
    try {
      const res = await fetch(`/api/training/${training.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTraining(data.training);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error("Failed to fetch training details:", error);
    }
  }

  function closeCreateModal() {
    setShowCreateModal(false);
    setEditingTraining(null);
    setForm(emptyForm);
    setModules([]);
  }

  function addModule() {
    setModules([...modules, { ...emptyModule }]);
  }

  function updateModule(index: number, field: keyof TrainingModule, value: string) {
    const updated = [...modules];
    updated[index] = { ...updated[index], [field]: value };
    setModules(updated);
  }

  function removeModule(index: number) {
    setModules(modules.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        duration: parseInt(form.duration, 10) || 30,
        modules: modules.filter((m) => m.title.trim() !== ""),
      };

      const url = editingTraining ? `/api/training/${editingTraining.id}` : "/api/training";
      const method = editingTraining ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        closeCreateModal();
        fetchTrainings();
      }
    } catch (error) {
      console.error("Failed to save training:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(trainingId: string) {
    if (!confirm("Are you sure you want to delete this training? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/training/${trainingId}`, { method: "DELETE" });
      if (res.ok) {
        setShowDetailModal(false);
        setSelectedTraining(null);
        fetchTrainings();
      }
    } catch (error) {
      console.error("Failed to delete training:", error);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Training" description="Manage training programs and learning modules." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-full mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Training"
        description="Manage training programs and learning modules."
        action={
          <button onClick={openCreate} className="btn-primary">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Training
          </button>
        }
      />

      {/* Training Grid */}
      {trainings.length === 0 ? (
        <EmptyState
          title="No trainings yet"
          description="Create your first training program to start building learning content for your team."
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
            </svg>
          }
          action={
            <button onClick={openCreate} className="btn-primary">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Training
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainings.map((training) => (
            <div
              key={training.id}
              className="card hover:shadow-md transition-shadow duration-200 cursor-pointer"
              onClick={() => openDetail(training)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">{training.title}</h3>
                </div>
                <span className={statusBadge(training.status) + " ml-2 flex-shrink-0"}>
                  {training.status}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-500 line-clamp-2 mb-4">{training.description}</p>

              {/* Category badge */}
              <div className="mb-4">
                <span
                  className={
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium " +
                    categoryBadge(training.category)
                  }
                >
                  {training.category}
                </span>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{training.duration} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                  </svg>
                  <span>
                    {training.modules.length} module{training.modules.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                  <span>
                    {training._count?.progress || 0} enrolled
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={showCreateModal}
        onClose={closeCreateModal}
        title={editingTraining ? "Edit Training" : "Create Training"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter training title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="Brief description of the training"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          {/* Category & Status row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                className="input-field"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="input-field"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
            <input
              type="number"
              className="input-field"
              min="1"
              placeholder="30"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Main training content or overview"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
            />
          </div>

          {/* Modules Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Training Modules</label>
              <button type="button" onClick={addModule} className="btn-secondary text-xs !py-1.5 !px-3">
                <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Module
              </button>
            </div>

            {modules.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center border border-dashed border-gray-200 rounded-lg">
                No modules added yet. Click &quot;Add Module&quot; to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {modules.map((mod, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">Module {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeModule(index)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <input
                          type="text"
                          className="input-field text-xs"
                          placeholder="Module title"
                          value={mod.title}
                          onChange={(e) => updateModule(index, "title", e.target.value)}
                        />
                      </div>
                      <div>
                        <select
                          className="input-field text-xs"
                          value={mod.type}
                          onChange={(e) => updateModule(index, "type", e.target.value)}
                        >
                          {MODULE_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <textarea
                      className="input-field text-xs"
                      rows={2}
                      placeholder="Module content"
                      value={mod.content}
                      onChange={(e) => updateModule(index, "content", e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={closeCreateModal} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </>
              ) : editingTraining ? (
                "Update Training"
              ) : (
                "Create Training"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail / View Modal */}
      <Modal
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedTraining(null);
        }}
        title="Training Details"
        size="lg"
      >
        {selectedTraining && (
          <div className="space-y-5">
            {/* Header info */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{selectedTraining.title}</h3>
                <span className={statusBadge(selectedTraining.status) + " ml-2 flex-shrink-0"}>
                  {selectedTraining.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">{selectedTraining.description}</p>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-3">
              <span
                className={
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium " +
                  categoryBadge(selectedTraining.category)
                }
              >
                {selectedTraining.category}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {selectedTraining.duration} minutes
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                Created {new Date(selectedTraining.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Content */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Content</h4>
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                {selectedTraining.content}
              </div>
            </div>

            {/* Modules list */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Modules ({selectedTraining.modules.length})
              </h4>
              {selectedTraining.modules.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center border border-dashed border-gray-200 rounded-lg">
                  No modules in this training.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedTraining.modules.map((mod, index) => (
                    <div key={mod.id || index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{mod.title}</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs text-gray-500 ring-1 ring-inset ring-gray-200">
                            {moduleTypeIcon(mod.type)}
                            {mod.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">{mod.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Progress section */}
            {selectedTraining.progress && selectedTraining.progress.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Progress ({selectedTraining.progress.length} enrolled)
                </h4>
                <div className="space-y-2">
                  {selectedTraining.progress.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                          {p.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.user.name}</p>
                          <p className="text-xs text-gray-500">{p.user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={
                            p.status === "completed"
                              ? "badge-success"
                              : p.status === "in_progress"
                              ? "badge-info"
                              : "badge-warning"
                          }
                        >
                          {p.status.replace("_", " ")}
                        </span>
                        {p.score != null && (
                          <p className="text-xs text-gray-500 mt-1">{Math.round(p.score)}% score</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <button
                onClick={() => handleDelete(selectedTraining.id)}
                disabled={deleting}
                className="btn-danger"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedTraining(null);
                  }}
                  className="btn-secondary"
                >
                  Close
                </button>
                <button onClick={() => openEdit(selectedTraining)} className="btn-primary">
                  Edit Training
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
