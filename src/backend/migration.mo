import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Blob "mo:core/Blob";

module {
  type RigId = Nat;

  type HarnessContainer = {
    id : RigId;
    manufacturer : Text;
    serialNumber : Text;
    model : Text;
    dateOfManufacture : Text;
    image : ?Blob;
  };

  type AAD = {
    id : RigId;
    manufacturer : Text;
    aadType : Text;
    serialNumber : Text;
    dateOfManufacture : Text;
    endOfLife : Text;
    serviceDate : Text;
  };

  type ReserveCanopy = {
    id : RigId;
    manufacturer : Text;
    reserveType : Text;
    serialNumber : Text;
    dateOfManufacture : Text;
    dateRepacked : Text;
    expiryDate : Text;
    totalJumps : Nat;
  };

  type MainCanopy = {
    id : RigId;
    manufacturer : Text;
    canopyType : Text;
    serialNumber : Text;
    dateOfManufacture : Text;
    jumpsOnLineSet : Nat;
    jumpsOnMainRisers : Nat;
    totalJumps : Nat;
    image : ?Blob;
  };

  type TandemMainCanopy = {
    id : RigId;
    manufacturer : Text;
    canopyType : Text;
    serialNumber : Text;
    dateOfManufacture : Text;
    jumpsOnLineSet : Nat;
    jumpsOnMainRisers : Nat;
    jumpsOnDrogueBridle : Nat;
    jumpsOnLowerBridleKillLine : Nat;
    totalJumps : Nat;
    image : ?Blob;
  };

  // Make old and new type explicit
  type OldRig = {
    id : RigId;
    name : Text;
    ownerName : Text;
    totalJumps : Nat;
    createdAt : Int;
    updatedAt : Int;
    harnessContainer : ?HarnessContainer;
    aad : ?AAD;
    reserveCanopy : ?ReserveCanopy;
    mainCanopy : ?MainCanopy;
    tandemCanopy : ?TandemMainCanopy;
  };

  type OldActor = {
    rigsStore : Map.Map<RigId, OldRig>;
  };

  type NewRig = OldRig and {
    jumpsSinceLastCheck : Nat;
  };

  type NewActor = {
    rigsStore : Map.Map<RigId, NewRig>;
  };

  public func run(old : OldActor) : NewActor {
    // Add new field with all entries initialized to 0
    let newRigsStore = old.rigsStore.map<RigId, OldRig, NewRig>(
      func(_, rig) { { rig with jumpsSinceLastCheck = 0 } }
    );
    { rigsStore = newRigsStore };
  };
};
