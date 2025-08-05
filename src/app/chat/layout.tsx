import AstrologySideBar from '@/components/AstrologySideBar';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      <AstrologySideBar />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}