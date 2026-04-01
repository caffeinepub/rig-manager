import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface ReserveCanopy {
    id: RigId;
    manufacturer: string;
    expiryDate: string;
    totalJumps: bigint;
    dateRepacked: string;
    serialNumber: string;
    reserveType: string;
    dateOfManufacture: string;
}
export type NoteId = bigint;
export interface PackJob {
    id: JumpId;
    packDate: string;
    createdAt: bigint;
    signatureData: string;
    packerName: string;
    rigId: RigId;
}
export interface MainCanopy {
    id: RigId;
    manufacturer: string;
    totalJumps: bigint;
    jumpsOnMainRisers: bigint;
    canopyType: string;
    serialNumber: string;
    dateOfManufacture: string;
    image?: ExternalBlob;
    jumpsOnLineSet: bigint;
}
export interface MainCanopyJumpsInput {
    id: bigint;
    totalJumps: bigint;
    jumpsOnMainRisers: bigint;
    jumpsOnLineSet: bigint;
}
export type CheckId = bigint;
export interface Rig {
    id: RigId;
    aad?: AAD;
    mainCanopy?: MainCanopy;
    ownerName: string;
    jumpsSinceLastCheck: bigint;
    name: string;
    createdAt: bigint;
    totalJumps: bigint;
    reserveCanopy?: ReserveCanopy;
    updatedAt: bigint;
    harnessContainer?: HarnessContainer;
    tandemCanopy?: TandemMainCanopy;
}
export type RigId = bigint;
export interface MainCanopyInput {
    id: RigId;
    manufacturer: string;
    totalJumps: bigint;
    jumpsOnMainRisers: bigint;
    canopyType: string;
    serialNumber: string;
    dateOfManufacture: string;
    image?: ExternalBlob;
    jumpsOnLineSet: bigint;
}
export interface TandemCanopyInput {
    id: RigId;
    manufacturer: string;
    jumpsOnDrogueBridle: bigint;
    totalJumps: bigint;
    jumpsOnMainRisers: bigint;
    canopyType: string;
    serialNumber: string;
    dateOfManufacture: string;
    image?: ExternalBlob;
    jumpsOnLowerBridleKillLine: bigint;
    jumpsOnLineSet: bigint;
}
export interface FiftyJumpCheckInput {
    completedDate: string;
    completedBy: string;
    checklistData: string;
    signatureData: string;
    notes: string;
    rigId: RigId;
}
export interface TandemCanopyJumpsInput {
    id: bigint;
    jumpsOnDrogueBridle: bigint;
    totalJumps: bigint;
    jumpsOnMainRisers: bigint;
    jumpsOnLowerBridleKillLine: bigint;
    jumpsOnLineSet: bigint;
}
export interface RigComponents {
    aad?: AAD;
    mainCanopy?: MainCanopy;
    reserveCanopy?: ReserveCanopy;
    harnessContainer?: HarnessContainer;
    tandemCanopy?: TandemMainCanopy;
}
export interface ReserveRepackInput {
    id: RigId;
    manufacturer: string;
    totalJumps: bigint;
    dateRepacked: string;
    serialNumber: string;
    reserveType: string;
    dateOfManufacture: string;
}
export type JumpId = bigint;
export interface RiggerNote {
    id: NoteId;
    note: string;
    createdAt: bigint;
    rigId: RigId;
    componentType: string;
}
export interface TandemMainCanopy {
    id: RigId;
    manufacturer: string;
    jumpsOnDrogueBridle: bigint;
    totalJumps: bigint;
    jumpsOnMainRisers: bigint;
    canopyType: string;
    serialNumber: string;
    dateOfManufacture: string;
    image?: ExternalBlob;
    jumpsOnLowerBridleKillLine: bigint;
    jumpsOnLineSet: bigint;
}
export interface RigUpdateInput {
    id: RigId;
    ownerName: string;
    name: string;
    totalJumps: bigint;
}
export interface HarnessContainer {
    id: RigId;
    model: string;
    manufacturer: string;
    serialNumber: string;
    dateOfManufacture: string;
    image?: ExternalBlob;
}
export interface FiftyJumpCheck {
    id: CheckId;
    completedDate: string;
    completedBy: string;
    checklistData: string;
    createdAt: bigint;
    signatureData: string;
    notes: string;
    rigId: RigId;
}
export interface AAD {
    id: RigId;
    serviceDate: string;
    manufacturer: string;
    aadType: string;
    endOfLife: string;
    serialNumber: string;
    dateOfManufacture: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addHarnessImage(id: RigId, input: ExternalBlob): Promise<HarnessContainer | null>;
    addPackJob(rigId: RigId, packerName: string, signatureData: string, packDate: string): Promise<PackJob | null>;
    addRiggerNote(rigId: RigId, componentType: string, note: string): Promise<RiggerNote | null>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    completeFiftyJumpCheck(input: FiftyJumpCheckInput): Promise<FiftyJumpCheck | null>;
    createRig(name: string, ownerName: string): Promise<Rig>;
    deletePackJob(jumpId: JumpId): Promise<boolean>;
    deleteRig(rigId: RigId): Promise<boolean>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFiftyJumpChecks(rigId: RigId): Promise<Array<FiftyJumpCheck>>;
    getPackJobs(rigId: RigId): Promise<Array<PackJob>>;
    getRig(id: RigId): Promise<Rig | null>;
    getRigComponents(rigId: RigId): Promise<RigComponents | null>;
    getRiggerNotes(rigId: RigId): Promise<Array<RiggerNote>>;
    getRigs(): Promise<Array<Rig>>;
    getRigsByUser(username: string): Promise<Array<Rig>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    removeAAD(id: RigId): Promise<boolean>;
    removeHarnessContainer(rigId: RigId): Promise<boolean>;
    removeMainCanopy(id: RigId): Promise<boolean>;
    removeReserveCanopy(id: RigId): Promise<boolean>;
    removeTandemMainCanopy(id: RigId): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setAAD(input: AAD): Promise<boolean>;
    setHarnessContainer(input: HarnessContainer): Promise<boolean>;
    setMainCanopy(input: MainCanopyInput): Promise<boolean>;
    setReserveCanopy(input: ReserveRepackInput): Promise<boolean>;
    setTandemMainCanopy(input: TandemCanopyInput): Promise<boolean>;
    updateMainCanopyJumps(input: MainCanopyJumpsInput): Promise<boolean>;
    updateRig(input: RigUpdateInput | null): Promise<Rig | null>;
    updateTandemMainCanopyJumps(input: TandemCanopyJumpsInput): Promise<boolean>;
}
