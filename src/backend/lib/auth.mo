import Array "mo:core/Array";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Types "../types/auth";

module {
  public type UserProfile = Types.UserProfile;
  public type Role = Types.Role;
  public type AuthResult = Types.AuthResult;
  public type UsersResult = Types.UsersResult;

  public func createProfile(
    profiles : Map.Map<Principal, UserProfile>,
    caller : Principal,
    role : Role,
    name : Text,
    phone : Text,
  ) : AuthResult {
    switch (profiles.get(caller)) {
      case (?_) { #err("Profile already exists") };
      case null {
        let profile : UserProfile = {
          principal = caller;
          role = role;
          name = name;
          phone = phone;
          createdAt = Time.now();
        };
        profiles.add(caller, profile);
        #ok(profile);
      };
    };
  };

  public func getProfile(
    profiles : Map.Map<Principal, UserProfile>,
    caller : Principal,
  ) : ?UserProfile {
    profiles.get(caller);
  };

  public func updateProfile(
    profiles : Map.Map<Principal, UserProfile>,
    caller : Principal,
    name : Text,
    phone : Text,
  ) : AuthResult {
    switch (profiles.get(caller)) {
      case null { #err("Profile not found") };
      case (?existing) {
        let updated : UserProfile = { existing with name = name; phone = phone };
        profiles.add(caller, updated);
        #ok(updated);
      };
    };
  };

  public func isAuthenticated(
    profiles : Map.Map<Principal, UserProfile>,
    caller : Principal,
  ) : Bool {
    switch (profiles.get(caller)) {
      case (?_) { true };
      case null { false };
    };
  };

  public func getRole(
    profiles : Map.Map<Principal, UserProfile>,
    caller : Principal,
  ) : Role {
    switch (profiles.get(caller)) {
      case (?profile) { profile.role };
      case null { #customer };
    };
  };

  public func getAllUsers(
    profiles : Map.Map<Principal, UserProfile>,
    adminList : Set.Set<Principal>,
    caller : Principal,
  ) : UsersResult {
    if (not adminList.contains(caller)) {
      return #err("Unauthorized");
    };
    let arr = profiles.values().toArray();
    #ok(arr);
  };

  public func setAdminRole(
    profiles : Map.Map<Principal, UserProfile>,
    adminList : Set.Set<Principal>,
    caller : Principal,
    targetPrincipal : Principal,
    makeAdmin : Bool,
  ) : AuthResult {
    if (not adminList.contains(caller)) {
      return #err("Unauthorized");
    };
    switch (profiles.get(targetPrincipal)) {
      case null { #err("Profile not found") };
      case (?existing) {
        let newRole : Role = if (makeAdmin) { #admin } else { #customer };
        let updated : UserProfile = { existing with role = newRole };
        profiles.add(targetPrincipal, updated);
        if (makeAdmin) {
          adminList.add(targetPrincipal);
        } else {
          adminList.remove(targetPrincipal);
        };
        #ok(updated);
      };
    };
  };
};
