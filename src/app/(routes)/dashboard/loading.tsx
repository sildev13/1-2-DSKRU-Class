export default function DashboardLoading() {
  return (
    <div className="aura-scope mx-auto max-w-4xl px-2 pt-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl2 border border-line bg-surface" />)}
      </div>
    </div>
  );
}
