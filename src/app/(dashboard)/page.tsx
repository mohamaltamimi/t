import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import StatsCard from "@/components/StatsCard";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const [taskCount, checklistCount, auditCount, sopCount, locationCount, userCount, trainingCount] =
    await Promise.all([
      prisma.task.count(),
      prisma.checklist.count(),
      prisma.audit.count(),
      prisma.sOP.count(),
      prisma.location.count(),
      prisma.user.count(),
      prisma.training.count(),
    ]);

  const pendingTasks = await prisma.task.count({ where: { status: "pending" } });
  const completedTasks = await prisma.task.count({ where: { status: "completed" } });
  const completionRate = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;

  const recentTasks = await prisma.task.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { assignee: true, location: true },
  });

  const recentAuditResponses = await prisma.auditResponse.findMany({
    take: 5,
    orderBy: { completedAt: "desc" },
    include: { audit: true, user: true },
  });

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.name || "User"}`}
        description="Here's what's happening across your operations today."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Tasks"
          value={taskCount}
          change={`${pendingTasks} pending`}
          changeType="neutral"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Completion Rate"
          value={`${completionRate}%`}
          change={`${completedTasks} of ${taskCount} completed`}
          changeType={completionRate >= 80 ? "positive" : completionRate >= 50 ? "neutral" : "negative"}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
            </svg>
          }
        />
        <StatsCard
          title="Active Checklists"
          value={checklistCount}
          change={`${auditCount} audits`}
          changeType="neutral"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Locations"
          value={locationCount}
          change={`${userCount} users, ${trainingCount} trainings`}
          changeType="neutral"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          }
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
            <Link href="/tasks" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>
          {recentTasks.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No tasks yet. Create your first task to get started.</p>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      task.status === "completed"
                        ? "bg-green-500"
                        : task.status === "in_progress"
                        ? "bg-blue-500"
                        : task.status === "overdue"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-500">
                      {task.assignee?.name || "Unassigned"} {task.location ? `• ${task.location.name}` : ""}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      task.priority === "urgent"
                        ? "bg-red-100 text-red-700"
                        : task.priority === "high"
                        ? "bg-orange-100 text-orange-700"
                        : task.priority === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Audit Results */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Audits</h2>
            <Link href="/audits" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>
          {recentAuditResponses.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No audit results yet. Complete an audit to see results here.</p>
          ) : (
            <div className="space-y-3">
              {recentAuditResponses.map((response) => (
                <div key={response.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-700">
                      {response.score != null ? `${Math.round(response.score)}%` : "--"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{response.audit.title}</p>
                    <p className="text-xs text-gray-500">
                      by {response.user.name} • {new Date(response.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/tasks"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="text-sm font-medium text-blue-700">New Task</span>
          </Link>
          <Link
            href="/checklists"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
          >
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12" />
            </svg>
            <span className="text-sm font-medium text-green-700">New Checklist</span>
          </Link>
          <Link
            href="/audits"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08" />
            </svg>
            <span className="text-sm font-medium text-purple-700">New Audit</span>
          </Link>
          <Link
            href="/sops"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors"
          >
            <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span className="text-sm font-medium text-orange-700">New SOP</span>
          </Link>
        </div>
      </div>

      {/* SOPs Overview */}
      <div className="mt-6 card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Published SOPs</h2>
          <Link href="/sops" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View all
          </Link>
        </div>
        <div className="text-sm text-gray-500">
          {sopCount} SOPs available &bull; {trainingCount} training modules
        </div>
      </div>
    </>
  );
}
