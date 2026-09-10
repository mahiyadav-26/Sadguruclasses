import { memo } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Overview tab of the admin dashboard, lifted verbatim out of Admin.tsx.
// Purely presentational: the stat/quick-action data and the navigation
// side effects stay in the page and arrive as props.

export interface AdminStat {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  tab?: string;
}

export interface AdminQuickAction {
  label: string;
  description: string;
  icon: LucideIcon;
  tab?: string;
  route?: string;
}

interface AdminOverviewTabProps {
  stats: AdminStat[];
  quickActions: AdminQuickAction[];
  onSelectTab: (tab: string) => void;
  onNavigate: (route: string) => void;
}

function AdminOverviewTabImpl({
  stats,
  quickActions,
  onSelectTab,
  onNavigate,
}: AdminOverviewTabProps) {
  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4 mb-6">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className={`border-none shadow-sm ${stat.tab ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
            onClick={() => { if (stat.tab) onSelectTab(stat.tab); }}
          >
            <CardContent className="p-2 md:p-4 flex items-center gap-1.5 md:gap-4 min-w-0">
              <div className={`p-1.5 md:p-3 rounded-md md:rounded-xl shrink-0 ${stat.color}`}>
                <stat.icon className="h-3.5 w-3.5 md:h-6 md:w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-base md:text-2xl font-bold text-foreground leading-tight">{stat.value}</p>
                <p className="text-[10px] md:text-sm text-muted-foreground font-medium truncate">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Card
              key={action.label}
              className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
              onClick={() => {
                if (action.route) onNavigate(action.route);
                else if (action.tab) onSelectTab(action.tab);
              }}
            >
              <CardContent className="p-4 flex flex-col items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <action.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{action.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

export const AdminOverviewTab = memo(AdminOverviewTabImpl);
