import AccountNav from '@/components/AccountNav'

// Shared shell for the account area (founder 2026-09-23: "/account split with a standard left
// sidebar"). The sidebar lists the account sections — Account, My vendors, Watchlist — and each
// child page carries its own content and metadata. Static layout, no personal state: everything
// personal stays client-gated inside the pages (lib/session.ts + lib/myStack.ts), so the
// prerendered HTML is identical for anonymous readers.
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:gap-10">
      <AccountNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
