import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();

  // ---- Fetch all analytics data in parallel ----
  const [
    totalTasks,
    pendingTasks,
    inProgressTasks,
    completedTasks,
    overdueTasks,
    lowPriorityTasks,
    mediumPriorityTasks,
    highPriorityTasks,
    urgentPriorityTasks,
    auditResponses,
    locations,
    trainingProgress,
    checklistResponses,
    recentTasks,
    recentAuditResponses,
    recentChecklistResponses,
    recentTrainingProgress,
  ] = await Promise.all([
    prisma.task.count(),
    prisma.task.count({ where: { status: "pending" } }),
    prisma.task.count({ where: { status: "in_progress" } }),
    prisma.task.count({ where: { status: "completed" } }),
    prisma.task.count({ where: { status: "overdue" } }),
    prisma.task.count({ where: { priority: "low" } }),
    prisma.task.count({ where: { priority: "medium" } }),
    prisma.task.count({ where: { priority: "high" } }),
    prisma.task.count({ where: { priority: "urgent" } }),
    prisma.auditResponse.findMany({
      select: { score: true, audit: { select: { title: true } } },
    }),
    prisma.location.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { tasks: true, users: true } },
        tasks: { select: { status: true } },
      },
    }),
    prisma.trainingProgress.findMany({
      select: { status: true, training: { select: { title: true } } },
    }),
    prisma.checklistResponse.findMany({
      select: { score: true, checklist: { select: { title: true } } },
    }),
    prisma.task.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        assignee: { select: { name: true } },
      },
    }),
    prisma.auditResponse.findMany({
      take: 5,
      orderBy: { completedAt: "desc" },
      select: {
        id: true,
        score: true,
        completedAt: true,
        audit: { select: { title: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.checklistResponse.findMany({
      take: 5,
      orderBy: { completedAt: "desc" },
      select: {
        id: true,
        score: true,
        completedAt: true,
        checklist: { select: { title: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.trainingProgress.findMany({
      take: 5,
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        status: true,
        score: true,
        startedAt: true,
        completedAt: true,
        training: { select: { title: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  // ---- Compute derived stats ----
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Audit average score
  const auditScores = auditResponses.filter((r) => r.score != null).map((r) => r.score as number);
  const avgAuditScore = auditScores.length > 0
    ? Math.round(auditScores.reduce((a, b) => a + b, 0) / auditScores.length)
    : 0;

  // Location performance
  const locationPerformance = locations.map((loc) => {
    const total = loc.tasks.length;
    const completed = loc.tasks.filter((t) => t.status === "completed").length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { name: loc.name, total, completed, rate, userCount: loc._count.users };
  });

  // Training completion rates
  const totalTraining = trainingProgress.length;
  const completedTraining = trainingProgress.filter((t) => t.status === "completed").length;
  const inProgressTraining = trainingProgress.filter((t) => t.status === "in_progress").length;
  const trainingCompletionRate = totalTraining > 0
    ? Math.round((completedTraining / totalTraining) * 100)
    : 0;

  // Checklist completion rates
  const checklistScores = checklistResponses.filter((r) => r.score != null).map((r) => r.score as number);
  const avgChecklistScore = checklistScores.length > 0
    ? Math.round(checklistScores.reduce((a, b) => a + b, 0) / checklistScores.length)
    : 0;

  // Recent activity timeline
  type TimelineItem = {
    id: string;
    type: "task" | "audit" | "checklist" | "training";
    title: string;
    description: string;
    date: Date;
    color: string;
  };

  const timeline: TimelineItem[] = [
    ...recentTasks.map((t) => ({
      id: t.id,
      type: "task" as const,
      title: t.title,
      description: `Task ${t.status.replace("_", " ")}${t.assignee ? ` - ${t.assignee.name}` : ""}`,
      date: new Date(t.createdAt),
      color: "bg-blue-500",
    })),
    ...recentAuditResponses.map((r) => ({
      id: r.id,
      type: "audit" as const,
      title: r.audit.title,
      description: `Audit completed by ${r.user.name}${r.score != null ? ` - Score: ${Math.round(r.score)}%` : ""}`,
      date: new Date(r.completedAt),
      color: "bg-purple-500",
    })),
    ...recentChecklistResponses.map((r) => ({
      id: r.id,
      type: "checklist" as const,
      title: r.checklist.title,
      description: `Checklist completed by ${r.user.name}${r.score != null ? ` - Score: ${Math.round(r.score)}%` : ""}`,
      date: new Date(r.completedAt),
      color: "bg-green-500",
    })),
    ...recentTrainingProgress.map((r) => ({
      id: r.id,
      type: "training" as const,
      title: r.training.title,
      description: `Training ${r.status.replace("_", " ")} by ${r.user.name}${r.score != null ? ` - Score: ${Math.round(r.score)}%` : ""}`,
      date: new Date(r.completedAt || r.startedAt),
      color: "bg-orange-500",
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 15);

  // Helper: safe percentage width style
  function barWidth(value: number, max: number) {
    if (max === 0) return "0%";
    return `${Math.max(2, Math.round((value / max) * 100))}%`;
  }

  return (
    <>
      <PageHeader
        title="Analytics"
        description={`Operations overview and performance metrics${user ? ` for ${user.name}` : ""}.`}
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <p className="text-sm font-medium text-gray-500">Total Tasks</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalTasks}</p>
          <p className="text-sm text-gray-500 mt-1">{completionRate}% completion rate</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-500">Avg Audit Score</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{avgAuditScore}%</p>
          <p className="text-sm text-gray-500 mt-1">{auditScores.length} audit responses</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-500">Training Completion</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{trainingCompletionRate}%</p>
          <p className="text-sm text-gray-500 mt-1">{completedTraining} of {totalTraining} completed</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-500">Avg Checklist Score</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{avgChecklistScore}%</p>
          <p className="text-sm text-gray-500 mt-1">{checklistResponses.length} responses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Task Completion Bar Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Completion Overview</h2>
          {totalTasks === 0 ? (
            <p className="text-sm text-gray-500 py-4">No tasks to display.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24 flex-shrink-0">Completed</span>
                <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-green-500 h-8 rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{ width: barWidth(completedTasks, totalTasks) }}
                  >
                    <span className="text-xs font-semibold text-white">{completedTasks}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24 flex-shrink-0">In Progress</span>
                <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-blue-500 h-8 rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{ width: barWidth(inProgressTasks, totalTasks) }}
                  >
                    <span className="text-xs font-semibold text-white">{inProgressTasks}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24 flex-shrink-0">Pending</span>
                <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-yellow-500 h-8 rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{ width: barWidth(pendingTasks, totalTasks) }}
                  >
                    <span className="text-xs font-semibold text-white">{pendingTasks}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24 flex-shrink-0">Overdue</span>
                <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-red-500 h-8 rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{ width: barWidth(overdueTasks, totalTasks) }}
                  >
                    <span className="text-xs font-semibold text-white">{overdueTasks}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tasks by Priority */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Priority</h2>
          {totalTasks === 0 ? (
            <p className="text-sm text-gray-500 py-4">No tasks to display.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24 flex-shrink-0">Urgent</span>
                <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-red-600 h-8 rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{ width: barWidth(urgentPriorityTasks, totalTasks) }}
                  >
                    <span className="text-xs font-semibold text-white">{urgentPriorityTasks}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24 flex-shrink-0">High</span>
                <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-orange-500 h-8 rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{ width: barWidth(highPriorityTasks, totalTasks) }}
                  >
                    <span className="text-xs font-semibold text-white">{highPriorityTasks}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24 flex-shrink-0">Medium</span>
                <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-yellow-500 h-8 rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{ width: barWidth(mediumPriorityTasks, totalTasks) }}
                  >
                    <span className="text-xs font-semibold text-white">{mediumPriorityTasks}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24 flex-shrink-0">Low</span>
                <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-gray-400 h-8 rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{ width: barWidth(lowPriorityTasks, totalTasks) }}
                  >
                    <span className="text-xs font-semibold text-white">{lowPriorityTasks}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Compliance Scores from Audits */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Audit Compliance Scores</h2>
          {auditScores.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No audit responses yet.</p>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">Average Score</span>
                <span className={`text-sm font-bold ${avgAuditScore >= 80 ? "text-green-600" : avgAuditScore >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                  {avgAuditScore}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4 mb-6">
                <div
                  className={`h-4 rounded-full transition-all ${avgAuditScore >= 80 ? "bg-green-500" : avgAuditScore >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${avgAuditScore}%` }}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total responses</span>
                  <span className="font-medium text-gray-900">{auditScores.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Highest score</span>
                  <span className="font-medium text-green-600">{Math.round(Math.max(...auditScores))}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Lowest score</span>
                  <span className="font-medium text-red-600">{Math.round(Math.min(...auditScores))}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Training Completion Rates */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Training Completion Rates</h2>
          {totalTraining === 0 ? (
            <p className="text-sm text-gray-500 py-4">No training progress data yet.</p>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">Overall Completion</span>
                <span className="text-sm font-bold text-gray-900">{trainingCompletionRate}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4 mb-6">
                <div
                  className="bg-primary-600 h-4 rounded-full transition-all"
                  style={{ width: `${trainingCompletionRate}%` }}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-28 flex-shrink-0">Completed</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-green-500 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: barWidth(completedTraining, totalTraining) }}
                    >
                      <span className="text-xs font-semibold text-white">{completedTraining}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-28 flex-shrink-0">In Progress</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: barWidth(inProgressTraining, totalTraining) }}
                    >
                      <span className="text-xs font-semibold text-white">{inProgressTraining}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-28 flex-shrink-0">Not Started</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-gray-400 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: barWidth(totalTraining - completedTraining - inProgressTraining, totalTraining) }}
                    >
                      <span className="text-xs font-semibold text-white">
                        {totalTraining - completedTraining - inProgressTraining}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Location Performance Comparison */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Performance</h2>
          {locationPerformance.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No locations to display.</p>
          ) : (
            <div className="space-y-4">
              {locationPerformance.map((loc) => (
                <div key={loc.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">{loc.name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-500">{loc.userCount} users</span>
                      <span className="text-sm font-semibold text-gray-900">{loc.rate}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${loc.rate >= 80 ? "bg-green-500" : loc.rate >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${Math.max(2, loc.rate)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {loc.completed} of {loc.total} tasks completed
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checklist Completion Rates */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Checklist Completion Rates</h2>
          {checklistResponses.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No checklist responses yet.</p>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">Average Score</span>
                <span className={`text-sm font-bold ${avgChecklistScore >= 80 ? "text-green-600" : avgChecklistScore >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                  {avgChecklistScore}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4 mb-6">
                <div
                  className={`h-4 rounded-full transition-all ${avgChecklistScore >= 80 ? "bg-green-500" : avgChecklistScore >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${avgChecklistScore}%` }}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total responses</span>
                  <span className="font-medium text-gray-900">{checklistResponses.length}</span>
                </div>
                {checklistScores.length > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Highest score</span>
                      <span className="font-medium text-green-600">{Math.round(Math.max(...checklistScores))}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Lowest score</span>
                      <span className="font-medium text-red-600">{Math.round(Math.min(...checklistScores))}%</span>
                    </div>
                  </>
                )}
              </div>

              {/* Score Distribution */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Score Distribution</h3>
                <div className="flex items-end gap-1 h-24">
                  {(() => {
                    const buckets = [0, 0, 0, 0, 0]; // 0-20, 20-40, 40-60, 60-80, 80-100
                    checklistScores.forEach((s) => {
                      const idx = Math.min(Math.floor(s / 20), 4);
                      buckets[idx]++;
                    });
                    const maxBucket = Math.max(...buckets, 1);
                    const labels = ["0-20", "20-40", "40-60", "60-80", "80-100"];
                    const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-blue-400", "bg-green-400"];
                    return buckets.map((count, i) => (
                      <div key={labels[i]} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs text-gray-500">{count}</span>
                        <div
                          className={`w-full ${colors[i]} rounded-t transition-all`}
                          style={{ height: `${Math.max(4, (count / maxBucket) * 80)}px` }}
                        />
                        <span className="text-xs text-gray-400">{labels[i]}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">No recent activity to display.</p>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-6">
              {timeline.map((item) => (
                <div key={`${item.type}-${item.id}`} className="relative flex items-start gap-4 pl-10">
                  <div className={`absolute left-2.5 w-3 h-3 rounded-full ${item.color} ring-4 ring-white`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          item.type === "task"
                            ? "badge-info"
                            : item.type === "audit"
                            ? "badge-warning"
                            : item.type === "checklist"
                            ? "badge-success"
                            : "badge-gray"
                        }
                      >
                        {item.type}
                      </span>
                      <h4 className="text-sm font-medium text-gray-900 truncate">{item.title}</h4>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {item.date.toLocaleDateString()} at {item.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
