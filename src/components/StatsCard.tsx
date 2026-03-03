interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
}

export default function StatsCard({ title, value, change, changeType = "neutral", icon }: StatsCardProps) {
  const changeColor =
    changeType === "positive" ? "text-green-600" : changeType === "negative" ? "text-red-600" : "text-gray-500";

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {change && <p className={`text-sm ${changeColor}`}>{change}</p>}
    </div>
  );
}
