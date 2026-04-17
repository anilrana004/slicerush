import Map "mo:core/Map";
import Set "mo:core/Set";
import Types "../types/auth";
import AuthLib "../lib/auth";

mixin (profiles : Map.Map<Principal, Types.UserProfile>, adminList : Set.Set<Principal>) {

  public shared ({ caller }) func createProfile(role : Types.Role, name : Text, phone : Text) : async Types.AuthResult {
    AuthLib.createProfile(profiles, caller, role, name, phone);
  };

  public shared query ({ caller }) func getProfile() : async ?Types.UserProfile {
    AuthLib.getProfile(profiles, caller);
  };

  public shared ({ caller }) func updateProfile(name : Text, phone : Text) : async Types.AuthResult {
    AuthLib.updateProfile(profiles, caller, name, phone);
  };

  public shared query ({ caller }) func isAuthenticated() : async Bool {
    AuthLib.isAuthenticated(profiles, caller);
  };

  public shared query ({ caller }) func getRole() : async Types.Role {
    AuthLib.getRole(profiles, caller);
  };

  public shared query ({ caller }) func getAllUsers() : async Types.UsersResult {
    AuthLib.getAllUsers(profiles, adminList, caller);
  };

  public shared ({ caller }) func setAdminRole(targetPrincipal : Principal, makeAdmin : Bool) : async Types.AuthResult {
    AuthLib.setAdminRole(profiles, adminList, caller, targetPrincipal, makeAdmin);
  };
};
