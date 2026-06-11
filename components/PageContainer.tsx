export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 w-full max-w-[var(--spacing-container)] mx-auto px-6 py-12 flex flex-col relative pb-32">
      {children}
    </div>
  );
}
