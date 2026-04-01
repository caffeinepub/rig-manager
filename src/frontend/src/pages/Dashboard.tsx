import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ChevronRight,
  Loader2,
  LogIn,
  Plane,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Rig } from "../backend";
import AppHeader from "../components/AppHeader";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface DashboardProps {
  onSelectRig: (rigId: bigint) => void;
}

function getReserveDaysRemaining(rig: Rig): number | null {
  const expiry = rig.reserveCanopy?.expiryDate;
  if (!expiry || expiry.trim() === "") return null;
  const expiryTime = new Date(expiry).getTime();
  if (Number.isNaN(expiryTime)) return null;
  const now = Date.now();
  return Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24));
}

function getFlaggedItems(
  rig: Rig,
): Array<{ label: string; severity: "warning" | "critical" }> {
  const flags: Array<{ label: string; severity: "warning" | "critical" }> = [];
  const now = Date.now();

  // Reserve canopy expiry
  const reserveDays = getReserveDaysRemaining(rig);
  if (reserveDays !== null) {
    if (reserveDays < 0) {
      flags.push({ label: "Reserve canopy expired", severity: "critical" });
    } else if (reserveDays <= 30) {
      flags.push({
        label: `Reserve expires in ${reserveDays} day${reserveDays === 1 ? "" : "s"}`,
        severity: "warning",
      });
    }
  }

  // AAD service date
  const serviceDate = rig.aad?.serviceDate;
  if (serviceDate && serviceDate.trim() !== "") {
    const t = new Date(serviceDate).getTime();
    if (!Number.isNaN(t)) {
      const days = Math.ceil((t - now) / (1000 * 60 * 60 * 24));
      if (days < 0) {
        flags.push({ label: "AAD service overdue", severity: "critical" });
      } else if (days <= 30) {
        flags.push({
          label: `AAD service due in ${days} day${days === 1 ? "" : "s"}`,
          severity: "warning",
        });
      }
    }
  }

  // AAD end of life
  const endOfLife = rig.aad?.endOfLife;
  if (endOfLife && endOfLife.trim() !== "") {
    const t = new Date(endOfLife).getTime();
    if (!Number.isNaN(t)) {
      const days = Math.ceil((t - now) / (1000 * 60 * 60 * 24));
      if (days < 0) {
        flags.push({ label: "AAD end of life reached", severity: "critical" });
      } else if (days <= 30) {
        flags.push({
          label: `AAD end of life in ${days} day${days === 1 ? "" : "s"}`,
          severity: "warning",
        });
      }
    }
  }

  return flags;
}

export default function Dashboard({ onSelectRig }: DashboardProps) {
  const { actor, isFetching } = useActor();
  const { identity, login } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<bigint | null>(null);

  const { data: rigs = [], isLoading } = useQuery<Rig[]>({
    queryKey: ["rigs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRigs();
    },
    enabled: !!actor && !isFetching,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.createRig(newName.trim(), newOwner.trim());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rigs"] });
      setAddOpen(false);
      setNewName("");
      setNewOwner("");
      toast.success("Rig created successfully");
    },
    onError: () => toast.error("Failed to create rig"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (rigId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteRig(rigId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rigs"] });
      setDeleteConfirmId(null);
      toast.success("Rig deleted");
    },
    onError: () => toast.error("Failed to delete rig"),
  });

  const handleAddRigClick = () => {
    if (!identity) {
      toast.error("Please log in to create a rig");
      return;
    }
    setAddOpen(true);
  };

  const getComponentBadges = (rig: Rig) => {
    const badges: { label: string; color: string }[] = [];
    if (rig.harnessContainer)
      badges.push({ label: "Harness", color: "#1B3FA6" });
    if (rig.aad) badges.push({ label: "AAD", color: "#3B82C4" });
    if (rig.reserveCanopy) badges.push({ label: "Reserve", color: "#F39C3D" });
    if (rig.mainCanopy) badges.push({ label: "Main", color: "#2E6F9E" });
    if (rig.tandemCanopy) badges.push({ label: "Tandem", color: "#D85A4A" });
    return badges;
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Rig Inventory
            </h1>
            <p className="text-muted-foreground mt-1">
              {rigs.length} rig{rigs.length !== 1 ? "s" : ""} registered
            </p>
          </div>
          {identity ? (
            <Button
              onClick={() => setAddOpen(true)}
              className="gap-2"
              style={{ backgroundColor: "#2E6F9E" }}
              data-ocid="dashboard.open_modal_button"
            >
              <Plus className="w-4 h-4" />
              Add New Rig
            </Button>
          ) : (
            <Button
              onClick={login}
              className="gap-2"
              style={{ backgroundColor: "#2E6F9E" }}
              data-ocid="dashboard.open_modal_button"
            >
              <LogIn className="w-4 h-4" />
              Login to Add Rigs
            </Button>
          )}
        </div>

        {isLoading ? (
          <div
            className="flex justify-center py-12"
            data-ocid="dashboard.loading_state"
          >
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : rigs.length === 0 ? (
          <div
            className="text-center py-16 bg-white rounded-xl border border-border"
            data-ocid="dashboard.empty_state"
          >
            <Plane className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-xl font-semibold text-foreground">No rigs yet</p>
            <p className="text-muted-foreground mt-1">
              {identity
                ? "Add your first rig to get started"
                : "Log in to add and manage your rigs"}
            </p>
            <Button
              className="mt-4 gap-2"
              onClick={handleAddRigClick}
              style={{ backgroundColor: "#2E6F9E" }}
            >
              {identity ? (
                <>
                  <Plus className="w-4 h-4" /> Add New Rig
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Login to Add Rigs
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rigs.map((rig, idx) => {
              const reserveDays = getReserveDaysRemaining(rig);
              const flaggedItems = getFlaggedItems(rig);
              const hasCritical = flaggedItems.some(
                (f) => f.severity === "critical",
              );
              const hasFlags = flaggedItems.length > 0;

              return (
                <article
                  key={String(rig.id)}
                  className="bg-white rounded-xl border border-border hover:border-primary hover:shadow-md transition-all"
                  style={{
                    boxShadow: hasFlags
                      ? hasCritical
                        ? "0 2px 8px rgba(220,38,38,0.15)"
                        : "0 2px 8px rgba(245,158,11,0.15)"
                      : "0 2px 8px rgba(0,0,0,0.06)",
                    borderColor: hasFlags
                      ? hasCritical
                        ? "#ef4444"
                        : "#f59e0b"
                      : undefined,
                  }}
                  data-ocid={`dashboard.item.${idx + 1}`}
                >
                  <button
                    type="button"
                    className="w-full text-left p-5 cursor-pointer group"
                    onClick={() => onSelectRig(rig.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {rig.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {rig.ownerName}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                    </div>

                    {/* Jump count + reserve days remaining */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <div
                        className="px-3 py-1 rounded-full text-white text-sm font-semibold"
                        style={{ backgroundColor: "#2E6F9E" }}
                      >
                        {Number(rig.totalJumps).toLocaleString()} jumps
                      </div>
                      {reserveDays !== null && (
                        <div
                          className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={
                            reserveDays < 0
                              ? {
                                  backgroundColor: "#fee2e2",
                                  color: "#b91c1c",
                                  border: "1px solid #fca5a5",
                                }
                              : reserveDays <= 30
                                ? {
                                    backgroundColor: "#fef3c7",
                                    color: "#92400e",
                                    border: "1px solid #fcd34d",
                                  }
                                : {
                                    backgroundColor: "#d1fae5",
                                    color: "#065f46",
                                    border: "1px solid #6ee7b7",
                                  }
                          }
                        >
                          {reserveDays < 0
                            ? "Reserve EXPIRED"
                            : `Reserve expires in ${reserveDays} day${reserveDays === 1 ? "" : "s"}`}
                        </div>
                      )}
                    </div>

                    {/* Component badges */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {getComponentBadges(rig).map((badge) => (
                        <span
                          key={badge.label}
                          className="px-2 py-0.5 rounded text-white text-xs font-medium"
                          style={{ backgroundColor: badge.color }}
                        >
                          {badge.label}
                        </span>
                      ))}
                      {getComponentBadges(rig).length === 0 && (
                        <span className="text-xs text-muted-foreground">
                          No components added
                        </span>
                      )}
                    </div>

                    {/* Flagged items warning banner */}
                    {hasFlags && (
                      <div
                        className="mt-3 rounded-lg px-3 py-2"
                        style={
                          hasCritical
                            ? {
                                backgroundColor: "#fef2f2",
                                border: "1px solid #fca5a5",
                              }
                            : {
                                backgroundColor: "#fffbeb",
                                border: "1px solid #fcd34d",
                              }
                        }
                        data-ocid={`dashboard.item.${idx + 1}.error_state`}
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle
                            className="w-4 h-4 flex-shrink-0 mt-0.5"
                            style={{
                              color: hasCritical ? "#dc2626" : "#d97706",
                            }}
                          />
                          <ul className="space-y-0.5">
                            {flaggedItems.map((item) => (
                              <li
                                key={item.label}
                                className="text-xs font-medium"
                                style={{
                                  color:
                                    item.severity === "critical"
                                      ? "#b91c1c"
                                      : "#92400e",
                                }}
                              >
                                {item.label}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </button>
                  <div className="px-5 pb-4 border-t border-border pt-3 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setDeleteConfirmId(rig.id)}
                      data-ocid={`dashboard.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Rig Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent data-ocid="dashboard.dialog">
          <DialogHeader>
            <DialogTitle>Add New Rig</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="rig-name">Rig Name</Label>
              <Input
                id="rig-name"
                placeholder="e.g. Main Competition Rig"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                data-ocid="dashboard.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rig-owner">Owner Name</Label>
              <Input
                id="rig-owner"
                placeholder="e.g. John Smith"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              data-ocid="dashboard.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={
                !newName.trim() || !newOwner.trim() || createMutation.isPending
              }
              style={{ backgroundColor: "#2E6F9E" }}
              data-ocid="dashboard.submit_button"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Create Rig
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <DialogContent data-ocid="dashboard.modal">
          <DialogHeader>
            <DialogTitle>Delete Rig</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete this rig? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              data-ocid="dashboard.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteConfirmId !== null &&
                deleteMutation.mutate(deleteConfirmId)
              }
              disabled={deleteMutation.isPending}
              data-ocid="dashboard.confirm_button"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="text-center text-xs text-muted-foreground py-6">
        &copy; {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="underline hover:text-primary"
          target="_blank"
          rel="noopener noreferrer"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
