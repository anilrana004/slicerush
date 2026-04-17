import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import NotifTypes "../types/notifications";
import NotifLib "../lib/notifications";

mixin (
  notifications  : Map.Map<Text, NotifTypes.Notification>,
  userNotifIndex : Map.Map<Principal, List.List<Text>>,
) {
  /// Return caller's notifications in reverse-chronological order (last 50).
  public shared ({ caller }) func getMyNotifications() : async [NotifTypes.NotificationPublic] {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    NotifLib.getMyNotifications(notifications, userNotifIndex, caller)
  };

  /// Mark a single notification as read.
  public shared ({ caller }) func markNotificationRead(id : Text) : async NotifTypes.NotifResult {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    NotifLib.markRead(notifications, caller, id)
  };

  /// Mark every unread notification for the caller as read.
  public shared ({ caller }) func markAllNotificationsRead() : async () {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    NotifLib.markAllRead(notifications, userNotifIndex, caller)
  };

  /// Return the count of unread notifications for the caller.
  public shared ({ caller }) func getUnreadCount() : async Nat {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    NotifLib.unreadCount(notifications, userNotifIndex, caller)
  };
};
