import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Principal "mo:core/Principal";


import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  include MixinStorage();

  type RigId = Nat;
  type NoteId = Nat;
  type JumpId = Nat;
  type CheckId = Nat;

  // Counters — implicitly stable inside actor
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

  // Stable backing arrays — data survives canister upgrades (implicitly stable)
  var stableRigs : [Rig.Rig] = [];
  var stableNotes : [RiggerNote.RiggerNote] = [];
  var stableJumps : [PackJob.PackJob] = [];
  var stableChecks : [FiftyJumpCheck.FiftyJumpCheck] = [];

  // Working in-memory maps
  let rigsStore = Map.empty<RigId, Rig.Rig>();
  let notesStore = Map.empty<NoteId, RiggerNote.RiggerNote>();
  let jumpsStore = Map.empty<JumpId, PackJob.PackJob>();
  let checksStore = Map.empty<CheckId, FiftyJumpCheck.FiftyJumpCheck>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Restore from stable storage on upgrade
  system func postupgrade() {
    for (rig in stableRigs.vals()) {
      rigsStore.add(rig.id, rig);
    };
    for (note in stableNotes.vals()) {
      notesStore.add(note.id, note);
    };
    for (jump in stableJumps.vals()) {
      jumpsStore.add(jump.id, jump);
    };
    for (check in stableChecks.vals()) {
      checksStore.add(check.id, check);
    };
    stableRigs := [];
    stableNotes := [];
    stableJumps := [];
    stableChecks := [];
  };

  // Persist to stable storage before upgrade
  system func preupgrade() {
    stableRigs := rigsStore.values().toArray();
    stableNotes := notesStore.values().toArray();
    stableJumps := jumpsStore.values().toArray();
    stableChecks := checksStore.values().toArray();
  };

  // User profile management functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    requireLogin(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    requireLogin(caller);
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    requireLogin(caller);
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func createRig(name : Text, ownerName : Text) : async Rig.Rig {
    requireLogin(caller);
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
    requireLogin(caller);
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
    requireLogin(caller);
    if (not rigsStore.containsKey(rigId)) { return false };
    rigsStore.remove(rigId);
    true;
  };

  public query ({ caller }) func getRigs() : async [Rig.Rig] {
    requireLogin(caller);
    rigsStore.values().toArray().sort();
  };

  public query ({ caller }) func getRig(id : RigId) : async ?Rig.Rig {
    requireLogin(caller);
    rigsStore.get(id);
  };

  public query ({ caller }) func getRigsByUser(username : Text) : async [Rig.Rig] {
    requireLogin(caller);
    rigsStore.values().toArray().filter(func(rig) { rig.ownerName == username }).sort();
  };

  public shared ({ caller }) func setHarnessContainer(input : HarnessContainer.HarnessContainer) : async Bool {
    requireLogin(caller);
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
    requireLogin(caller);
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
    requireLogin(caller);
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
    requireLogin(caller);
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
    requireLogin(caller);
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
    requireLogin(caller);
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
    requireLogin(caller);
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
    requireLogin(caller);
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
    requireLogin(caller);
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
    requireLogin(caller);
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
    requireLogin(caller);
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
    requireLogin(caller);
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
    requireLogin(caller);
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
    requireLogin(caller);
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
    requireLogin(caller);
    notesStore.values().toArray().filter(func(n) { n.rigId == rigId }).sort();
  };

  public shared ({ caller }) func addPackJob(rigId : RigId, packerName : Text, signatureData : Text, packDate : Text) : async ?PackJob.PackJob {
    requireLogin(caller);
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
        let updatedMainCanopy : ?MainCanopy.MainCanopy = switch (rig.mainCanopy) {
          case (null) { null };
          case (?mc) {
            ?{
              mc with
              jumpsOnLineSet = mc.jumpsOnLineSet + 1;
              jumpsOnMainRisers = mc.jumpsOnMainRisers + 1;
              totalJumps = mc.totalJumps + 1;
            };
          };
        };
        let updatedTandemCanopy : ?TandemMainCanopy.TandemMainCanopy = switch (rig.tandemCanopy) {
          case (null) { null };
          case (?tc) {
            ?{
              tc with
              jumpsOnLineSet = tc.jumpsOnLineSet + 1;
              jumpsOnMainRisers = tc.jumpsOnMainRisers + 1;
              jumpsOnDrogueBridle = tc.jumpsOnDrogueBridle + 1;
              jumpsOnLowerBridleKillLine = tc.jumpsOnLowerBridleKillLine + 1;
              totalJumps = tc.totalJumps + 1;
            };
          };
        };
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
          mainCanopy = updatedMainCanopy;
          tandemCanopy = updatedTandemCanopy;
        };
        rigsStore.add(rigId, updated);
        ?newJump;
      };
    };
  };

  public query ({ caller }) func getPackJobs(rigId : RigId) : async [PackJob.PackJob] {
    requireLogin(caller);
    jumpsStore.values().toArray().filter(func(j) { j.rigId == rigId }).sort();
  };

  public shared ({ caller }) func deletePackJob(jumpId : JumpId) : async Bool {
    requireLogin(caller);
    if (not jumpsStore.containsKey(jumpId)) { return false };
    jumpsStore.remove(jumpId);
    true;
  };

  public shared ({ caller }) func completeFiftyJumpCheck(input : FiftyJumpCheckInput) : async ?FiftyJumpCheck.FiftyJumpCheck {
    requireLogin(caller);
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
    requireLogin(caller);
    checksStore.values().toArray().filter(func(c) { c.rigId == rigId }).sort();
  };

  public query ({ caller }) func getRigComponents(rigId : RigId) : async ?RigComponents {
    requireLogin(caller);
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

  // Allow any authenticated (non-anonymous) user
  func requireLogin(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: You must be logged in");
    };
  };
};
