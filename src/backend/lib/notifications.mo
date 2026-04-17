import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import NotifTypes "../types/notifications";

module {
  let maxPerUser : Nat = 50;

  // ── Helpers ─────────────────────────────────────────────────────────────────

  public func toPublic(n : NotifTypes.Notification) : NotifTypes.NotificationPublic {
    {
      id        = n.id;
      userId    = n.userId;
      notifType = n.notifType;
      title     = n.title;
      message   = n.message;
      orderId   = n.orderId;
      read      = n.read;
      createdAt = n.createdAt;
    };
  };

  // ── Internal creation helper (called from order status transitions) ─────────

  public func createNotification(
    notifications  : Map.Map<Text, NotifTypes.Notification>,
    userNotifIndex : Map.Map<Principal, List.List<Text>>,
    userId         : Principal,
    notifType      : NotifTypes.NotificationType,
    title          : Text,
    message        : Text,
    orderId        : ?Text,
  ) : () {
    let now = Time.now();
    let id  = "notif-" # userId.toText() # "-" # now.toText();

    let notif : NotifTypes.Notification = {
      id;
      userId;
      notifType;
      title;
      message;
      orderId;
      var read  = false;
      createdAt = now;
    };
    notifications.add(id, notif);

    // Update user index, capping at maxPerUser
    let currentList = switch (userNotifIndex.get(userId)) {
      case (?lst) lst;
      case null   List.empty<Text>();
    };
    currentList.add(id);
    // Trim oldest if over limit
    while (currentList.size() > maxPerUser) {
      switch (currentList.first()) {
        case null {};
        case (?oldId) {
          notifications.remove(oldId);
          // Remove from list by rebuilding without first element
          let trimmed = currentList.filter(func(s : Text) : Bool { s != oldId });
          currentList.clear();
          currentList.addAll(trimmed.values());
        };
      };
    };
    userNotifIndex.add(userId, currentList);
  };

  public func getMyNotifications(
    notifications  : Map.Map<Text, NotifTypes.Notification>,
    userNotifIndex : Map.Map<Principal, List.List<Text>>,
    caller         : Principal,
  ) : [NotifTypes.NotificationPublic] {
    let ids = switch (userNotifIndex.get(caller)) {
      case (?lst) lst;
      case null   List.empty<Text>();
    };
    // Collect notifications for caller, filter nulls, sort by createdAt desc
    let collected = ids.filterMap<Text, NotifTypes.NotificationPublic>(func(id) {
      switch (notifications.get(id)) {
        case (?n) ?toPublic(n);
        case null null;
      }
    });
    let arr = collected.toArray();
    arr.sort(func(a : NotifTypes.NotificationPublic, b : NotifTypes.NotificationPublic) : {#less; #equal; #greater} {
      if (b.createdAt > a.createdAt) #greater
      else if (b.createdAt < a.createdAt) #less
      else #equal
    })
  };

  public func markRead(
    notifications : Map.Map<Text, NotifTypes.Notification>,
    caller        : Principal,
    id            : Text,
  ) : NotifTypes.NotifResult {
    switch (notifications.get(id)) {
      case null #err("Notification not found");
      case (?notif) {
        if (not Principal.equal(notif.userId, caller)) return #err("Not your notification");
        notif.read := true;
        #ok(())
      };
    }
  };

  public func markAllRead(
    notifications  : Map.Map<Text, NotifTypes.Notification>,
    userNotifIndex : Map.Map<Principal, List.List<Text>>,
    caller         : Principal,
  ) : () {
    let ids = switch (userNotifIndex.get(caller)) {
      case (?lst) lst;
      case null   List.empty<Text>();
    };
    ids.forEach(func(id : Text) {
      switch (notifications.get(id)) {
        case (?notif) { notif.read := true };
        case null {};
      };
    });
  };

  public func unreadCount(
    notifications  : Map.Map<Text, NotifTypes.Notification>,
    userNotifIndex : Map.Map<Principal, List.List<Text>>,
    caller         : Principal,
  ) : Nat {
    let ids = switch (userNotifIndex.get(caller)) {
      case (?lst) lst;
      case null   List.empty<Text>();
    };
    ids.foldLeft<Nat, Text>(0, func(acc, id) {
      switch (notifications.get(id)) {
        case (?n) if (not n.read) acc + 1 else acc;
        case null acc;
      }
    })
  };
};
