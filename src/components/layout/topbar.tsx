import { db } from "@/lib/db";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { CommandPalette } from "@/components/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { UserMenu } from "@/components/layout/user-menu";

export async function Topbar() {
  const [notifications, admin] = await Promise.all([
    db.notification.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
    db.user.findFirst({ where: { role: "ADMIN" } }),
  ]);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-6" />
      <CommandPalette />
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <NotificationsMenu
          items={notifications.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            severity: n.severity,
            read: n.read,
            createdAt: n.createdAt,
          }))}
        />
        <Separator orientation="vertical" className="mx-1 h-6" />
        <UserMenu name={admin?.name ?? "Admin"} email={admin?.email ?? "admin@fbaventures.com"} />
      </div>
    </header>
  );
}
