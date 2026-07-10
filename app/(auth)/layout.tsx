export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-bg-page px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-bg-card p-8 shadow-strong">
        {children}
      </div>
    </div>
  );
}
