import Float "mo:core/Float";
import Int "mo:core/Int";
import Map "mo:core/Map";
import List "mo:core/List";
import CartTypes "../types/cart";

module {
  // ── Store coordinates ─────────────────────────────────────────────────────
  let storeLat : Float = 40.7128;
  let storeLng : Float = -74.0060;

  // ── Haversine formula — returns distance in km ────────────────────────────
  public func calculateDistance(lat1 : Float, lng1 : Float, lat2 : Float, lng2 : Float) : Float {
    let r : Float = 6371.0; // Earth radius in km
    let dLat = (lat2 - lat1) * Float.pi / 180.0;
    let dLng = (lng2 - lng1) * Float.pi / 180.0;
    let a =
      Float.sin(dLat / 2.0) * Float.sin(dLat / 2.0) +
      Float.cos(lat1 * Float.pi / 180.0) *
      Float.cos(lat2 * Float.pi / 180.0) *
      Float.sin(dLng / 2.0) * Float.sin(dLng / 2.0);
    let c = 2.0 * Float.arctan2(Float.sqrt(a), Float.sqrt(1.0 - a));
    r * c
  };

  // ── Delivery fee in cents: free under 5km, $2/km above 5km ───────────────
  // Returns (feeInCents, distanceKm)
  public func getDeliveryFeeForCoords(lat : Float, lng : Float) : (Nat, Float) {
    let dist = calculateDistance(storeLat, storeLng, lat, lng);
    let fee : Float = if (dist <= 5.0) { 0.0 } else { (dist - 5.0) * 200.0 }; // $2/km in cents
    let feeNat = (fee + 0.5).toInt(); // round to nearest cent
    let feeNatUnsigned : Nat = if (feeNat < 0) { 0 } else { Int.abs(feeNat) };
    (feeNatUnsigned, dist)
  };

  // ── Estimated delivery minutes ────────────────────────────────────────────
  // base 30 min + 5 min per km over 5km
  public func getEstimatedDeliveryMinutes(distance : Float) : Nat {
    let extra = if (distance <= 5.0) { 0.0 } else { (distance - 5.0) * 5.0 };
    let total = (30.0 + extra + 0.5).toInt();
    if (total < 0) { 30 } else { Int.abs(total) }
  };

  // ── Look up address and compute fee ──────────────────────────────────────
  public func getDeliveryFee(
    addresses : Map.Map<Principal, List.List<CartTypes.Address>>,
    caller : Principal,
    addressId : Text,
  ) : ?{ feeInCents : Nat; distanceKm : Float; estimatedMinutes : Nat } {
    switch (addresses.get(caller)) {
      case null null;
      case (?list) {
        switch (list.find(func(a : CartTypes.Address) : Bool { a.id == addressId })) {
          case null null;
          case (?addr) {
            let (fee, dist) = getDeliveryFeeForCoords(addr.lat, addr.lng);
            let mins = getEstimatedDeliveryMinutes(dist);
            ?{ feeInCents = fee; distanceKm = dist; estimatedMinutes = mins }
          };
        };
      };
    };
  };
};
