import Sidebar from "@/components/admin/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* Push content right of sidebar */}
      <main className="flex-1 ml-64 p-6 bg-gray-50 min-h-screen">
        {children}
      </main>
    </div>
  );
}
