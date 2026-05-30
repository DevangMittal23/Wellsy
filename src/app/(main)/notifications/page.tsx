import type { Metadata } from "next";
import { Bell } from "lucide-react";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Your latest notifications on WELLSY.",
};

export default function NotificationsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
        <p className="text-sm text-text-secondary">
          Stay up to date with your activity
        </p>
      </div>

      <div className="glass-card flex flex-col items-center justify-center py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-subtle mb-4">
          <Bell className="h-8 w-8 text-accent" />
        </div>
        <p className="text-lg font-medium text-text-secondary">
          No notifications yet
        </p>
        <p className="mt-1 text-sm text-text-muted">
          When someone interacts with you, it&apos;ll show up here
        </p>
      </div>
    </div>
  );
}
