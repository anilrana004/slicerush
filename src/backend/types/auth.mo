import Time "mo:core/Time";

module {
  public type Role = {
    #customer;
    #delivery_partner;
    #admin;
  };

  public type UserProfile = {
    principal : Principal;
    role : Role;
    name : Text;
    phone : Text;
    createdAt : Time.Time;
  };

  public type AuthResult = {
    #ok : UserProfile;
    #err : Text;
  };

  public type UsersResult = {
    #ok : [UserProfile];
    #err : Text;
  };
};
