import { StatCard } from "./StatCart";

export default function DashboardGrid({ stats }: { stats: any[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {stats.map((stat, i) => (
        <StatCard key={i} {...stat} />
      ))}
    </div>
  );
}
