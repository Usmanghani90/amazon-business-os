"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  severity: "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";
  read: boolean;
  createdAt: string | Date;
}

const dot: Record<NotificationItem["severity"], string> = {
  INFO: "bg-sky-500",
  SUCCESS: "bg-emerald-500",
  WARNING: "bg-amber-500",
  CRITICAL: "bg-rose-500",
};

export function NotificationsMenu({ items }: { items: NotificationItem[] }) {
  const unread = items.filter((i) => !i.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="relative" aria-label="Notifications" />}
      >
        <Bell className="h-[1.15rem] w-[1.15rem]" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">Notifications</DropdownMenuLabel>
          {unread > 0 && <Badge variant="secondary">{unread} new</Badge>}
        </div>
        <DropdownMenuSeparator className="my-0" />
        <ScrollArea className="h-80">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">You're all caught up.</p>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id} className={cn("flex gap-3 px-3 py-3", !n.read && "bg-muted/40")}>
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dot[n.severity])} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground/70">
                      {formatRelative(n.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
