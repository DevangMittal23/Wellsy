import type { Metadata } from "next";
import { getNotifications, getUnreadNotificationCount } from "@/actions/notification-actions";
import { NotificationList } from "@/components/notifications/notification-list";
import type { Notification } from "@/types/notification";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Your latest notifications on WELLSY.",
};

export default async function NotificationsPage() {
  const { notifications, hasMore } = await getNotifications();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
        <p className="text-sm text-text-secondary">
          Stay up to date with your activity
        </p>
      </div>

      <NotificationList
        initialNotifications={notifications as Notification[]}
        initialHasMore={hasMore}
      />
    </div>
  );
}
