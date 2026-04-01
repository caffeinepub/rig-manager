import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Order "mo:core/Order";
import List "mo:core/List";
import Array "mo:core/Array";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Migration "migration";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

// Attach migration logic to actor
(with migration = Migration.run) actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  include MixinStorage();

  type RigId = Nat;
  type NoteId = Nat;
  type JumpId = Nat;
  type CheckId = Nat;
  var nextRigId = 0;
  var nextNoteId = 0;
  var nextJumpId = 0;
  var nextCheckId = 0;

  module Rig {
    public type Rig = {
      id : RigId;
      name : Text;
      ownerName : Text;
      totalJumps : Nat;
      jumpsSinceLastCheck : Nat;
      createdAt : Int;
      updatedAt : Int;
      harnessContainer : ?HarnessContainer.HarnessContainer;
      aad : ?AAD.AAD;
      reserveCanopy : ?ReserveCanopy.ReserveCanopy;
      mainCanopy : ?MainCanopy.MainCanopy;
      tandemCanopy : ?TandemMainCanopy.TandemMainCanopy;
    };

    public func compare(a : Rig, b : Rig) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  module HarnessContainer {
    public type HarnessContainer = {
      id : RigId;
      manufacturer : Text;
      serialNumber : Text;
      model : Text;
      dateOfManufacture : Text;
      image : ?Storage.ExternalBlob;
    };
  };

  module AAD {
    public type AAD = {
      id : RigId;
      manufacturer : Text;
      aadType : Text;
      serialNumber : Text;
      dateOfManufacture : Text;
      endOfLife : Text;
      serviceDate : Text;
    };
  };

  module ReserveCanopy {
    public type ReserveCanopy = {
      id : RigId;
      manufacturer : Text;
      reserveType : Text;
      serialNumber : Text;
      dateOfManufacture : Text;
      dateRepacked : Text;
      expiryDate : Text;
      totalJumps : Nat;
    };
  };

  module MainCanopy {
    public type MainCanopy = {
      id : RigId;
      manufacturer : Text;
      canopyType : Text;
      serialNumber : Text;
      dateOfManufacture : Text;
      jumpsOnLineSet : Nat;
      jumpsOnMainRisers : Nat;
      totalJumps : Nat;
      image : ?Storage.ExternalBlob;
    };
  };

  module TandemMainCanopy {
    public type TandemMainCanopy = {
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
      image : ?Storage.ExternalBlob;
    };
  };

  module RiggerNote {
    public type RiggerNote = {
      id : NoteId;
      rigId : RigId;
      componentType : Text;
      note : Text;
      createdAt : Int;
    };

    public func compare(a : RiggerNote, b : RiggerNote) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  module PackJob {
    public type PackJob = {
      id : JumpId;
      rigId : RigId;
      packerName : Text;
      signatureData : Text;
      packDate : Text;
      createdAt : Int;
    };

    public func compare(a : PackJob, b : PackJob) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  module FiftyJumpCheck {
    public type FiftyJumpCheck = {
      id : CheckId;
      rigId : RigId;
      completedBy : Text;
      completedDate : Text;
      signatureData : Text;
      // Checklist items as comma-separated "item:pass/fail" or freeform notes
      checklistData : Text;
      notes : Text;
      createdAt : Int;
    };

    public func compare(a : FiftyJumpCheck, b : FiftyJumpCheck) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  public type UserProfile = {
    name : Text;
  };

  public type RigInput = {
    id : RigId;
    name : Text;
    ownerName : Text;
    totalJumps : Nat;
    jumpsSinceLastCheck : Nat;
    createdAt : Int;
    updatedAt : Int;
  };

  public type RigUpdateInput = {
    id : RigId;
    name : Text;
    ownerName : Text;
    totalJumps : Nat;
  };

  public type RigComponents = {
    harnessContainer : ?HarnessContainer.HarnessContainer;
    aad : ?AAD.AAD;
    reserveCanopy : ?ReserveCanopy.ReserveCanopy;
    mainCanopy : ?MainCanopy.MainCanopy;
    tandemCanopy : ?TandemMainCanopy.TandemMainCanopy;
  };

  public type ReserveRepackInput = {
    id : RigId;
    manufacturer : Text;
    reserveType : Text;
    serialNumber : Text;
    dateOfManufacture : Text;
    dateRepacked : Text;
    totalJumps : Nat;
  };

  public type MainCanopyInput = {
    id : RigId;
    manufacturer : Text;
    canopyType : Text;
    serialNumber : Text;
    dateOfManufacture : Text;
    jumpsOnLineSet : Nat;
    jumpsOnMainRisers : Nat;
    totalJumps : Nat;
    image : ?Storage.ExternalBlob;
  };

  public type MainCanopyJumpsInput = {
    id : Nat;
    jumpsOnLineSet : Nat;
    jumpsOnMainRisers : Nat;
    totalJumps : Nat;
  };

  public type TandemCanopyInput = {
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
    image : ?Storage.ExternalBlob;
  };

  public type TandemCanopyJumpsInput = {
    id : Nat;
    jumpsOnLineSet : Nat;
    jumpsOnMainRisers : Nat;
    jumpsOnDrogueBridle : Nat;
    jumpsOnLowerBridleKillLine : Nat;
    totalJumps : Nat;
  };

  public type FiftyJumpCheckInput = {
    rigId : RigId;
    completedBy : Text;
    completedDate : Text;
    signatureData : Text;
    checklistData : Text;
    notes : Text;
  };

  let rigsStore = Map.empty<RigId, Rig.Rig>();
  let notesStore = Map.empty<NoteId, RiggerNote.RiggerNote>();
  let jumpsStore = Map.empty<JumpId, PackJob.PackJob>();
  let checksStore = Map.empty<CheckId, FiftyJumpCheck.FiftyJumpCheck>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User profile management functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func createRig(name : Text, ownerName : Text) : async Rig.Rig {
    checkWritePermission(caller);
    let id = nextRigId;
    nextRigId += 1;
    let rig : Rig.Rig = {
      id;
      name;
      ownerName;
      totalJumps = 0;
      jumpsSinceLastCheck = 0;
      createdAt = Time.now();
      updatedAt = Time.now();
      harnessContainer = null;
      aad = null;
      reserveCanopy = null;
      mainCanopy = null;
      tandemCanopy = null;
    };
    rigsStore.add(id, rig);
    rig;
  };

  public shared ({ caller }) func updateRig(input : ?RigUpdateInput) : async ?Rig.Rig {
    checkWritePermission(caller);
    let ui = switch (input) {
      case (null) { return null };
      case (?i) { i };
    };
    switch (rigsStore.get(ui.id)) {
      case (null) { null };
      case (?existing) {
        let updated : Rig.Rig = {
          id = existing.id;
          name = ui.name;
          ownerName = ui.ownerName;
          totalJumps = ui.totalJumps;
          jumpsSinceLastCheck = existing.jumpsSinceLastCheck;
          createdAt = existing.createdAt;
          updatedAt = Time.now();
          harnessContainer = existing.harnessContainer;
          aad = existing.aad;
          reserveCanopy = existing.reserveCanopy;
          mainCanopy = existing.mainCanopy;
          tandemCanopy = existing.tandemCanopy;
        };
        rigsStore.add(ui.id, updated);
        ?updated;
      };
    };
  };

  public shared ({ caller }) func deleteRig(rigId : RigId) : async Bool {
    checkWritePermission(caller);
    if (not rigsStore.containsKey(rigId)) { return false };
    rigsStore.remove(rigId);
    true;
  };

  public query ({ caller }) func getRigs() : async [Rig.Rig] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view rigs");
    };
    rigsStore.values().toArray().sort();
  };

  public query ({ caller }) func getRig(id : RigId) : async ?Rig.Rig {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view rigs");
    };
    rigsStore.get(id);
  };

  public query ({ caller }) func getRigsByUser(username : Text) : async [Rig.Rig] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view rigs");
    };
    rigsStore.values().toArray().filter(func(rig) { rig.ownerName == username }).sort();
  };

  public shared ({ caller }) func setHarnessContainer(input : HarnessContainer.HarnessContainer) : async Bool {
    checkWritePermission(caller);
    switch (rigsStore.get(input.id)) {
      case (null) { false };
      case (?rig) {
        let updated : Rig.Rig = {
          id = rig.id;
          name = rig.name;
          ownerName = rig.ownerName;
          totalJumps = rig.totalJumps;
          jumpsSinceLastCheck = rig.jumpsSinceLastCheck;
          createdAt = rig.createdAt;
          updatedAt = Time.now();
          harnessContainer = ?input;
          aad = rig.aad;
          reserveCanopy = rig.reserveCanopy;
          mainCanopy = rig.mainCanopy;
          tandemCanopy = rig.tandemCanopy;
        };
        rigsStore.add(input.id, updated);
        true;
      };
    };
  };

  public shared ({ caller }) func addHarnessImage(id : RigId, input : Storage.ExternalBlob) : async ?HarnessContainer.HarnessContainer {
    checkWritePermission(caller);
    switch (rigsStore.get(id)) {
      case (null) { null };
      case (?rig) {
        switch (rig.harnessContainer) {
          case (null) { null };
          case (?harness) {
            let updated : HarnessContainer.HarnessContainer = {
              id = harness.id;
              manufacturer = harness.manufacturer;
              serialNumber = harness.serialNumber;
              model = harness.model;
              dateOfManufacture = harness.dateOfManufacture;
              image = ?input;
            };
            let updatedRig : Rig.Rig = {
              id = rig.id;
              name = rig.name;
              ownerName = rig.ownerName;
              totalJumps = rig.totalJumps;
              jumpsSinceLastCheck = rig.jumpsSinceLastCheck;
              createdAt = rig.createdAt;
              updatedAt = Time.now();
              harnessContainer = ?updated;
              aad = rig.aad;
              reserveCanopy = rig.reserveCanopy;
              mainCanopy = rig.mainCanopy;
              tandemCanopy = rig.tandemCanopy;
            };
            rigsStore.add(id, updatedRig);
            ?updated;
          };
        };
      };
    };
  };

  public shared ({ caller }) func removeHarnessContainer(rigId : RigId) : async Bool {
    checkWritePermission(caller);
    switch (rigsStore.get(rigId)) {
      case (null) { false };
      case (?rig) {
        let updated : Rig.Rig = {
          id = rig.id;
          name = rig.name;
          ownerName = rig.ownerName;
          totalJumps = rig.totalJumps;
          jumpsSinceLastCheck = rig.jumpsSinceLastCheck;
          createdAt = rig.createdAt;
          updatedAt = Time.now();
          harnessContainer = null;
          aad = rig.aad;
          reserveCanopy = rig.reserveCanopy;
          mainCanopy = rig.mainCanopy;
          tandemCanopy = rig.tandemCanopy;
        };
        rigsStore.add(rigId, updated);
        true;
      };
    };
  };

  public shared ({ caller }) func setAAD(input : AAD.AAD) : async Bool {
    checkWritePermission(caller);
    switch (rigsStore.get(input.id)) {
      case (null) { false };
      case (?rig) {
        let updated : Rig.Rig = {
          id = rig.id;
          name = rig.name;
          ownerName = rig.ownerName;
          totalJumps = rig.totalJumps;
          jumpsSinceLastCheck = rig.jumpsSinceLastCheck;
          createdAt = rig.createdAt;
          updatedAt = Time.now();
          harnessContainer = rig.harnessContainer;
          aad = ?input;
          reserveCanopy = rig.reserveCanopy;
          mainCanopy = rig.mainCanopy;
          tandemCanopy = rig.tandemCanopy;
        };
        rigsStore.add(input.id, updated);
        true;
      };
    };
  };

  public shared ({ caller }) func removeAAD(id : RigId) : async Bool {
    checkWritePermission(caller);
    switch (rigsStore.get(id)) {
      case (null) { false };
      case (?rig) {
        let updated : Rig.Rig = {
          id = rig.id;
          name = rig.name;
          ownerName = rig.ownerName;
          totalJumps = rig.totalJumps;
          jumpsSinceLastCheck = rig.jumpsSinceLastCheck;
          createdAt = rig.createdAt;
          updatedAt = Time.now();
          harnessContainer = rig.harnessContainer;
          aad = null;
          reserveCanopy = rig.reserveCanopy;
          mainCanopy = rig.mainCanopy;
          tandemCanopy = rig.tandemCanopy;
        };
        rigsStore.add(id, updated);
        true;
      };
    };
  };

  public shared ({ caller }) func setReserveCanopy(input : ReserveRepackInput) : async Bool {
    checkWritePermission(caller);
    let expiryDate = calcExpiryDate(input.dateRepacked);
    let reserve : ReserveCanopy.ReserveCanopy = {
      id = input.id;
      manufacturer = input.manufacturer;
      reserveType = input.reserveType;
      serialNumber = input.serialNumber;
      dateOfManufacture = input.dateOfManufacture;
      dateRepacked = input.dateRepacked;
      expiryDate;
      totalJumps = input.totalJumps;
    };
    switch (rigsStore.get(input.id)) {
      case (null) { false };
      case (?rig) {
        let updated : Rig.Rig = {
          id = rig.id;
          name = rig.name;
          ownerName = rig.ownerName;
          totalJumps = rig.totalJumps;
          jumpsSinceLastCheck = rig.jumpsSinceLastCheck;
          createdAt = rig.createdAt;
          updatedAt = Time.now();
          harnessContainer = rig.harnessContainer;
          aad = rig.aad;
          reserveCanopy = ?reserve;
          mainCanopy = rig.mainCanopy;
          tandemCanopy = rig.tandemCanopy;
        };
        rigsStore.add(input.id, updated);
        true;
      };
    };
  };

  public shared ({ caller }) func removeReserveCanopy(id : RigId) : async Bool {
    checkWritePermission(caller);
    switch (rigsStore.get(id)) {
      case (null) { false };
      case (?rig) {
        let updated : Rig.Rig = {
          id = rig.id;
          name = rig.name;
          ownerName = rig.ownerName;
          totalJumps = rig.totalJumps;
          jumpsSinceLastCheck = rig.jumpsSinceLastCheck;
          createdAt = rig.createdAt;
          updatedAt = Time.now();
          harnessContainer = rig.harnessContainer;
          aad = rig.aad;
          reserveCanopy = null;
          mainCanopy = rig.mainCanopy;
          tandemCanopy = rig.tandemCanopy;
        };
        rigsStore.add(id, updated);
        true;
      };
    };
  };

  public shared ({ caller }) func setMainCanopy(input : MainCanopyInput) : async Bool {
    checkWritePermission(caller);
    let canopy : MainCanopy.MainCanopy = {
      id = input.id;
      manufacturer = input.manufacturer;
      canopyType = input.canopyType;
      serialNumber = input.serialNumber;
      dateOfManufacture = input.dateOfManufacture;
      jumpsOnLineSet = input.jumpsOnLineSet;
      jumpsOnMainRisers = input.jumpsOnMainRisers;
      totalJumps = input.totalJumps;
      image = input.image;
    };
    switch (rigsStore.get(input.id)) {
      case (null) { false };
      case (?rig) {
        let updated : Rig.Rig = {
          id = rig.id;
          name = rig.name;
          ownerName = rig.ownerName;
          totalJumps = rig.totalJumps;
          jumpsSinceLastCheck = rig.jumpsSinceLastCheck;
          createdAt = rig.createdAt;
          updatedAt = Time.now();
          harnessContainer = rig.harnessContainer;
          aad = rig.aad;
          reserveCanopy = rig.reserveCanopy;
          mainCanopy = ?canopy;
          tandemCanopy = rig.tandemCanopy;
        };
        rigsStore.add(input.id, updated);
        true;
      };
    };
  };

  public shared ({ caller }) func updateMainCanopyJumps(input : MainCanopyJumpsInput) : async Bool {
    checkWritePermission(caller);
    switch (rigsStore.get(input.id)) {
      case (null) { false };
      case (?rig) {
        switch (rig.mainCanopy) {
          case (null) { false };
          case (?mainCanopy) {
            let updatedCanopy = {
              mainCanopy with
              jumpsOnLineSet = input.jumpsOnLineSet;
              jumpsOnMainRisers = input.jumpsOnMainRisers;
              totalJumps = input.totalJumps;
            };
            let updatedRig : Rig.Rig = {
              id = rig.id;
              name = rig.name;
              ownerName = rig.ownerName;
              totalJumps = rig.totalJumps;
              jumpsSinceLastCheck = rig.jumpsSinceLastCheck;
              createdAt = rig.createdAt;
              updatedAt = Time.now();
              harnessContainer = rig.harnessContainer;
              aad = rig.aad;
              reserveCanopy = rig.reserveCanopy;
              mainCanopy = ?updatedCanopy;
              tandemCanopy = rig.tandemCanopy;
            };
            rigsStore.add(input.id, updatedRig);
            true;
          };
        };
      };
    };
  };

  public shared ({ caller }) func removeMainCanopy(id : RigId) : async Bool {
    checkWritePermission(caller);
    switch (rigsStore.get(id)) {
      case (null) { false };
      case (?rig) {
        let updated : Rig.Rig = {
          id = rig.id;
          name = rig.name;
          ownerName = rig.ownerName;
          totalJumps = rig.totalJumps;
          jumpsSinceLastCheck = rig.jumpsSinceLastCheck;
          createdAt = rig.createdAt;
          updatedAt = Time.now();
          harnessContainer = rig.harnessContainer;
          aad = rig.aad;
          reserveCanopy = rig.reserveCanopy;
          mainCanopy = null;
          tandemCanopy = rig.tandemCanopy;
        };
        rigsStore.add(id, updated);
        true;
      };
    };
  };

  public shared ({ caller }) func setTandemMainCanopy(input : TandemCanopyInput) : async Bool {
    checkWritePermission(caller);
    let canopy : TandemMainCanopy.TandemMainCanopy = {
      id = input.id;
      manufacturer = input.manufacturer;
      canopyType = input.canopyType;
      serialNumber = input.serialNumber;
      dateOfManufacture = input.dateOfManufacture;
      jumpsOnLineSet = input.jumpsOnLineSet;
      jumpsOnMainRisers = input.jumpsOnMainRisers;
      jumpsOnDrogueBridle = input.jumpsOnDrogueBridle;
      jumpsOnLowerBridleKillLine = input.jumpsOnLowerBridleKillLine;
      totalJumps = input.totalJumps;
      image = input.image;
    };
    switch (rigsStore.get(input.id)) {
      case (null) { false };
      case (?rig) {
        let updated : Rig.Rig = {
          id = rig.id;
          name = rig.name;
          ownerName = rig.ownerName;
          totalJumps = rig.totalJumps;
          jumpsSinceLastCheck = rig.jumpsSinceLastCheck;
          createdAt = rig.createdAt;
          updatedAt = Time.now();
          harnessContainer = rig.harnessContainer;
          aad = rig.aad;
          reserveCanopy = rig.reserveCanopy;
          mainCanopy = rig.mainCanopy;
          tandemCanopy = ?canopy;
        };
        rigsStore.add(input.id, updated);
        true;
      };
    };
  };

  public shared ({ caller }) func updateTandemMainCanopyJumps(input : TandemCanopyJumpsInput) : async Bool {
    checkWritePermission(caller);
    switch (rigsStore.get(input.id)) {
      case (null) { false };
      case (?rig) {
        switch (rig.tandemCanopy) {
          case (null) { false };
          case (?tandemCanopy) {
            let updatedCanopy : TandemMainCanopy.TandemMainCanopy = {
              tandemCanopy with
              jumpsOnLineSet = input.jumpsOnLineSet;
              jumpsOnMainRisers = input.jumpsOnMainRisers;
              jumpsOnDrogueBridle = input.jumpsOnDrogueBridle;
              jumpsOnLowerBridleKillLine = input.jumpsOnLowerBridleKillLine;
              totalJumps = input.totalJumps;
            };
            let updatedRig : Rig.Rig = {
              id = rig.id;
              name = rig.name;
              ownerName = rig.ownerName;
              totalJumps = rig.totalJumps;
              jumpsSinceLastCheck = rig.jumpsSinceLastCheck;
              createdAt = rig.createdAt;
              updatedAt = Time.now();
              harnessContainer = rig.harnessContainer;
              aad = rig.aad;
              reserveCanopy = rig.reserveCanopy;
              mainCanopy = rig.mainCanopy;
              tandemCanopy = ?updatedCanopy;
            };
            rigsStore.add(input.id, updatedRig);
            true;
          };
        };
      };
    };
  };

  public shared ({ caller }) func removeTandemMainCanopy(id : RigId) : async Bool {
    checkWritePermission(caller);
    switch (rigsStore.get(id)) {
      case (null) { false };
      case (?rig) {
        let updated : Rig.Rig = {
          id = rig.id;
          name = rig.name;
          ownerName = rig.ownerName;
          totalJumps = rig.totalJumps;
          jumpsSinceLastCheck = rig.jumpsSinceLastCheck;
          createdAt = rig.createdAt;
          updatedAt = Time.now();
          harnessContainer = rig.harnessContainer;
          aad = rig.aad;
          reserveCanopy = rig.reserveCanopy;
          mainCanopy = rig.mainCanopy;
          tandemCanopy = null;
        };
        rigsStore.add(id, updated);
        true;
      };
    };
  };

  public shared ({ caller }) func addRiggerNote(rigId : RigId, componentType : Text, note : Text) : async ?RiggerNote.RiggerNote {
    checkWritePermission(caller);
    nextNoteId += 1;
    let newNote : RiggerNote.RiggerNote = {
      id = nextNoteId;
      rigId;
      componentType;
      note;
      createdAt = Time.now();
    };
    notesStore.add(nextNoteId, newNote);
    ?newNote;
  };

  public query ({ caller }) func getRiggerNotes(rigId : RigId) : async [RiggerNote.RiggerNote] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view rigger notes");
    };
    notesStore.values().toArray().filter(func(n) { n.rigId == rigId }).sort();
  };

  public shared ({ caller }) func addPackJob(rigId : RigId, packerName : Text, signatureData : Text, packDate : Text) : async ?PackJob.PackJob {
    checkWritePermission(caller);
    nextJumpId += 1;
    let newJump : PackJob.PackJob = {
      id = nextJumpId;
      rigId;
      packerName;
      signatureData;
      packDate;
      createdAt = Time.now();
    };
    jumpsStore.add(nextJumpId, newJump);

    switch (rigsStore.get(rigId)) {
      case (null) { null };
      case (?rig) {
        let updated : Rig.Rig = {
          id = rig.id;
          name = rig.name;
          ownerName = rig.ownerName;
          totalJumps = rig.totalJumps + 1;
          jumpsSinceLastCheck = rig.jumpsSinceLastCheck + 1;
          createdAt = rig.createdAt;
          updatedAt = Time.now();
          harnessContainer = rig.harnessContainer;
          aad = rig.aad;
          reserveCanopy = rig.reserveCanopy;
          mainCanopy = rig.mainCanopy;
          tandemCanopy = rig.tandemCanopy;
        };
        rigsStore.add(rigId, updated);
        ?newJump;
      };
    };
  };

  public query ({ caller }) func getPackJobs(rigId : RigId) : async [PackJob.PackJob] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view pack jobs");
    };
    jumpsStore.values().toArray().filter(func(j) { j.rigId == rigId }).sort();
  };

  public shared ({ caller }) func completeFiftyJumpCheck(input : FiftyJumpCheckInput) : async ?FiftyJumpCheck.FiftyJumpCheck {
    checkWritePermission(caller);
    switch (rigsStore.get(input.rigId)) {
      case (null) { null };
      case (?rig) {
        nextCheckId += 1;
        let newCheck : FiftyJumpCheck.FiftyJumpCheck = {
          id = nextCheckId;
          rigId = input.rigId;
          completedBy = input.completedBy;
          completedDate = input.completedDate;
          signatureData = input.signatureData;
          checklistData = input.checklistData;
          notes = input.notes;
          createdAt = Time.now();
        };
        checksStore.add(nextCheckId, newCheck);
        // Reset jumpsSinceLastCheck
        let updated : Rig.Rig = {
          id = rig.id;
          name = rig.name;
          ownerName = rig.ownerName;
          totalJumps = rig.totalJumps;
          jumpsSinceLastCheck = 0;
          createdAt = rig.createdAt;
          updatedAt = Time.now();
          harnessContainer = rig.harnessContainer;
          aad = rig.aad;
          reserveCanopy = rig.reserveCanopy;
          mainCanopy = rig.mainCanopy;
          tandemCanopy = rig.tandemCanopy;
        };
        rigsStore.add(input.rigId, updated);
        ?newCheck;
      };
    };
  };

  public query ({ caller }) func getFiftyJumpChecks(rigId : RigId) : async [FiftyJumpCheck.FiftyJumpCheck] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view fifty jump checks");
    };
    checksStore.values().toArray().filter(func(c) { c.rigId == rigId }).sort();
  };

  public query ({ caller }) func getRigComponents(rigId : RigId) : async ?RigComponents {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view rig components");
    };
    switch (rigsStore.get(rigId)) {
      case (null) { null };
      case (?rig) {
        let components : RigComponents = {
          harnessContainer = rig.harnessContainer;
          aad = rig.aad;
          reserveCanopy = rig.reserveCanopy;
          mainCanopy = rig.mainCanopy;
          tandemCanopy = rig.tandemCanopy;
        };
        ?components;
      };
    };
  };

  func calcExpiryDate(repackDate : Text) : Text {
    // Parse YYYY-MM-DD and add 6 months
    let parts = repackDate.split(#char '-').toArray();
    if (parts.size() < 3) return repackDate;
    let yearOpt = Nat.fromText(parts[0]);
    let monthOpt = Nat.fromText(parts[1]);
    let dayOpt = Nat.fromText(parts[2]);
    switch (yearOpt, monthOpt, dayOpt) {
      case (?year, ?month, ?day) {
        var newMonth = month + 6;
        var newYear = year;
        if (newMonth > 12) {
          newMonth -= 12;
          newYear += 1;
        };
        let yStr = newYear.toText();
        let mStr = if (newMonth < 10) { "0" # newMonth.toText() } else { newMonth.toText() };
        let dStr = if (day < 10) { "0" # day.toText() } else { day.toText() };
        yStr # "-" # mStr # "-" # dStr;
      };
      case _ { repackDate };
    };
  };

  func checkWritePermission(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
  };
};
