import type { Metadata } from "next";
import { NotificationList } from "@/components/notifications/notification-list";

export const metadata: Metadata = {
  title: "Activity",
  description: "Your latest notifications on HUDdang.",
};

export default function NotificationsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Activity</h1>
        <p className="text-sm text-text-secondary">
          What's been happening while you were away
        </p>
      </div>

      <NotificationList />
    </div>
  );
}
