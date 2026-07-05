import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Receipt,
  ArrowDownToLine,
  Landmark,
  Banknote,
  Package,
  Boxes,
  Factory,
  ClipboardList,
  BarChart3,
  Percent,
  Megaphone,
  FileText,
  Settings,
  Plug,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navigation: NavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Partners & Capital",
    items: [
      { title: "Partners", href: "/partners", icon: Users },
      { title: "Investments", href: "/investments", icon: TrendingUp },
      { title: "Withdrawals", href: "/withdrawals", icon: ArrowDownToLine },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Expenses", href: "/expenses", icon: Receipt },
      { title: "Banking", href: "/banking", icon: Landmark },
      { title: "Amazon Payouts", href: "/payouts", icon: Banknote },
    ],
  },
  {
    label: "Catalog & Supply",
    items: [
      { title: "Products", href: "/products", icon: Package },
      { title: "Inventory", href: "/inventory", icon: Boxes },
      { title: "Suppliers", href: "/suppliers", icon: Factory },
      { title: "Purchase Orders", href: "/purchase-orders", icon: ClipboardList },
    ],
  },
  {
    label: "Analytics",
    items: [
      { title: "Sales", href: "/sales", icon: BarChart3 },
      { title: "Profitability", href: "/profitability", icon: Percent },
      { title: "Advertising", href: "/advertising", icon: Megaphone },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Reports", href: "/reports", icon: FileText },
      { title: "Integrations", href: "/integrations", icon: Plug },
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

/** Flat list for the command palette / global search. */
export const allNavItems: NavItem[] = navigation.flatMap((g) => g.items);
