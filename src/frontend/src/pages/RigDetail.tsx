import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  ClipboardList,
  Download,
  Eye,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  AAD,
  ExternalBlob,
  FiftyJumpCheck,
  HarnessContainer,
  MainCanopy,
  PackJob,
  ReserveCanopy,
  Rig,
  RiggerNote,
  TandemMainCanopy,
} from "../backend";
import { ExternalBlob as ExternalBlobClass } from "../backend";

import AppHeader from "../components/AppHeader";
import ComponentCard from "../components/ComponentCard";
import FiftyJumpCheckModal from "../components/FiftyJumpCheckModal";
import SignaturePad from "../components/SignaturePad";
import { useActor } from "../hooks/useActor";

interface RigDetailProps {
  rigId: bigint;
  onBack: () => void;
}

// ── helpers ─────────────────────────────────────────────────────────────────
const fmtTs = (ns: bigint) => new Date(Number(ns) / 1_000_000).toLocaleString();

const calcReserveExpiry = (dateRepacked: string): string => {
  if (!dateRepacked) return "";
  const parts = dateRepacked.split("-");
  if (parts.length < 3) return "";
  const year = Number.parseInt(parts[0], 10);
  const month = Number.parseInt(parts[1], 10); // 1-indexed
  const day = Number.parseInt(parts[2], 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return "";
  // Use Date object arithmetic for correct month overflow
  const d = new Date(year, month - 1, day, 12, 0, 0); // local noon avoids TZ issues
  d.setMonth(d.getMonth() + 6);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Returns backend-stored expiry if valid, otherwise calculates from repack date
const getReserveExpiry = (
  dateRepacked: string,
  storedExpiry: string,
): string => {
  if (storedExpiry && storedExpiry !== dateRepacked) return storedExpiry;
  return calcReserveExpiry(dateRepacked);
};

const parseBigInt = (v: string): bigint => {
  const n = Number.parseInt(v, 10);
  return BigInt(Number.isNaN(n) ? 0 : n);
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-1.5">
      <span className="text-sm text-muted-foreground w-40 flex-shrink-0">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

// ── Rigger Notes Sub-component ───────────────────────────────────────────────
function RiggerNotes({
  rigId,
  componentType,
}: {
  rigId: bigint;
  componentType: string;
}) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState("");

  const { data: allNotes = [] } = useQuery<RiggerNote[]>({
    queryKey: ["notes", String(rigId)],
    queryFn: async () => (actor ? actor.getRiggerNotes(rigId) : []),
    enabled: !!actor,
  });

  const notes = allNotes.filter((n) => n.componentType === componentType);

  const addNote = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.addRiggerNote(rigId, componentType, noteText.trim());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", String(rigId)] });
      setNoteText("");
      toast.success("Note added");
    },
    onError: () => toast.error("Failed to add note"),
  });

  return (
    <div className="mt-4 border-t border-border pt-4">
      <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
        Rigger's Notes
      </h4>
      {notes.length > 0 ? (
        <ul className="space-y-2 mb-3">
          {notes.map((note, idx) => (
            <li
              key={String(note.id)}
              className="text-sm bg-secondary/40 rounded-lg p-3"
              data-ocid={`notes.item.${idx + 1}`}
            >
              <p className="text-foreground">{note.note}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {fmtTs(note.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground mb-3">No notes yet</p>
      )}
      <div className="flex gap-2">
        <Textarea
          placeholder="Add a rigger's note..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          className="text-sm resize-none h-16"
          data-ocid="notes.textarea"
        />
        <Button
          size="sm"
          className="self-end"
          disabled={!noteText.trim() || addNote.isPending}
          onClick={() => addNote.mutate()}
          style={{ backgroundColor: "#2E6F9E" }}
          data-ocid="notes.submit_button"
        >
          {addNote.isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            "Add"
          )}
        </Button>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function RigDetail({ rigId, onBack }: RigDetailProps) {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const { data: rig, isLoading } = useQuery<Rig | null>({
    queryKey: ["rig", String(rigId)],
    queryFn: async () => (actor ? actor.getRig(rigId) : null),
    enabled: !!actor && !isFetching,
  });

  const { data: packJobs = [] } = useQuery<PackJob[]>({
    queryKey: ["packjobs", String(rigId)],
    queryFn: async () => (actor ? actor.getPackJobs(rigId) : []),
    enabled: !!actor && !isFetching,
  });

  const { data: fiftyJumpChecks = [] } = useQuery<FiftyJumpCheck[]>({
    queryKey: ["fiftyjumpchecks", String(rigId)],
    queryFn: async () => (actor ? actor.getFiftyJumpChecks(rigId) : []),
    enabled: !!actor && !isFetching,
  });

  // Auto-open check modal when jumpsSinceLastCheck >= 50
  const jumpsSince = Number(rig?.jumpsSinceLastCheck ?? 0);
  const checkRequired = jumpsSince >= 50;
  const [checkModalOpen, setCheckModalOpen] = useState(false);
  const [checkModalDismissed, setCheckModalDismissed] = useState(false);
  const [previewCheckOpen, setPreviewCheckOpen] = useState(false);

  // Open modal automatically when check is required (reset dismissed state when rig data changes)
  if (checkRequired && !checkModalOpen && !checkModalDismissed) {
    setCheckModalOpen(true);
  }
  if (!checkRequired && checkModalDismissed) {
    setCheckModalDismissed(false);
  }

  // Edit Rig Name/Jumps
  const [editRigOpen, setEditRigOpen] = useState(false);
  const [editRigName, setEditRigName] = useState("");
  const [editRigOwner, setEditRigOwner] = useState("");
  const [editRigJumps, setEditRigJumps] = useState("");

  useEffect(() => {
    if (rig) {
      setEditRigName(rig.name);
      setEditRigOwner(rig.ownerName);
      setEditRigJumps(String(rig.totalJumps));
    }
  }, [rig]);

  const updateRig = useMutation({
    mutationFn: async () => {
      if (!actor || !rig) throw new Error("No actor");
      return actor.updateRig({
        id: rigId,
        name: editRigName.trim(),
        ownerName: editRigOwner.trim(),
        totalJumps: parseBigInt(editRigJumps),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rig", String(rigId)] });
      queryClient.invalidateQueries({ queryKey: ["rigs"] });
      setEditRigOpen(false);
      toast.success("Rig updated");
    },
    onError: () => toast.error("Failed to update rig"),
  });

  // ── Harness/Container ──────────────────────────────────────────────────────
  const [harnessOpen, setHarnessOpen] = useState(false);
  const [harnessForm, setHarnessForm] = useState({
    manufacturer: "",
    serialNumber: "",
    model: "",
    dateOfManufacture: "",
  });
  const [harnessImageFile, setHarnessImageFile] = useState<File | null>(null);

  const openHarnessEdit = useCallback(() => {
    if (rig?.harnessContainer) {
      setHarnessForm({
        manufacturer: rig.harnessContainer.manufacturer,
        serialNumber: rig.harnessContainer.serialNumber,
        model: rig.harnessContainer.model,
        dateOfManufacture: rig.harnessContainer.dateOfManufacture,
      });
    } else {
      setHarnessForm({
        manufacturer: "",
        serialNumber: "",
        model: "",
        dateOfManufacture: "",
      });
    }
    setHarnessImageFile(null);
    setHarnessOpen(true);
  }, [rig]);

  const saveHarness = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.setHarnessContainer({
        id: rigId,
        ...harnessForm,
      });
      if (harnessImageFile) {
        const buffer = await harnessImageFile.arrayBuffer();
        const blob = ExternalBlobClass.fromBytes(new Uint8Array(buffer));
        await actor.addHarnessImage(rigId, blob);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rig", String(rigId)] });
      setHarnessOpen(false);
      toast.success("Harness/Container saved");
    },
    onError: () => toast.error("Failed to save harness"),
  });

  const removeHarness = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.removeHarnessContainer(rigId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rig", String(rigId)] });
      toast.success("Harness removed");
    },
  });

  // ── AAD ───────────────────────────────────────────────────────────────────
  const [aadOpen, setAadOpen] = useState(false);
  const [aadForm, setAadForm] = useState({
    manufacturer: "",
    aadType: "",
    serialNumber: "",
    dateOfManufacture: "",
    endOfLife: "",
    serviceDate: "",
  });

  const openAadEdit = useCallback(() => {
    if (rig?.aad) {
      setAadForm({
        manufacturer: rig.aad.manufacturer,
        aadType: rig.aad.aadType,
        serialNumber: rig.aad.serialNumber,
        dateOfManufacture: rig.aad.dateOfManufacture,
        endOfLife: rig.aad.endOfLife,
        serviceDate: rig.aad.serviceDate,
      });
    } else {
      setAadForm({
        manufacturer: "",
        aadType: "",
        serialNumber: "",
        dateOfManufacture: "",
        endOfLife: "",
        serviceDate: "",
      });
    }
    setAadOpen(true);
  }, [rig]);

  const saveAad = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.setAAD({ id: rigId, ...aadForm });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rig", String(rigId)] });
      setAadOpen(false);
      toast.success("AAD saved");
    },
    onError: () => toast.error("Failed to save AAD"),
  });

  const removeAad = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.removeAAD(rigId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rig", String(rigId)] });
      toast.success("AAD removed");
    },
  });

  // ── Reserve Canopy ────────────────────────────────────────────────────────
  const [reserveOpen, setReserveOpen] = useState(false);
  const [reserveForm, setReserveForm] = useState({
    manufacturer: "",
    reserveType: "",
    serialNumber: "",
    dateOfManufacture: "",
    dateRepacked: "",
    totalJumps: "0",
  });

  const openReserveEdit = useCallback(() => {
    if (rig?.reserveCanopy) {
      const r = rig.reserveCanopy;
      setReserveForm({
        manufacturer: r.manufacturer,
        reserveType: r.reserveType,
        serialNumber: r.serialNumber,
        dateOfManufacture: r.dateOfManufacture,
        dateRepacked: r.dateRepacked,
        totalJumps: String(r.totalJumps),
      });
    } else {
      setReserveForm({
        manufacturer: "",
        reserveType: "",
        serialNumber: "",
        dateOfManufacture: "",
        dateRepacked: "",
        totalJumps: "0",
      });
    }
    setReserveOpen(true);
  }, [rig]);

  const saveReserve = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.setReserveCanopy({
        id: rigId,
        manufacturer: reserveForm.manufacturer,
        reserveType: reserveForm.reserveType,
        serialNumber: reserveForm.serialNumber,
        dateOfManufacture: reserveForm.dateOfManufacture,
        dateRepacked: reserveForm.dateRepacked,
        totalJumps: parseBigInt(reserveForm.totalJumps),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rig", String(rigId)] });
      setReserveOpen(false);
      toast.success("Reserve canopy saved");
    },
    onError: () => toast.error("Failed to save reserve"),
  });

  const removeReserve = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.removeReserveCanopy(rigId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rig", String(rigId)] });
      toast.success("Reserve canopy removed");
    },
  });

  const isReserveExpiringSoon = rig?.reserveCanopy
    ? (() => {
        const expiry = new Date(
          getReserveExpiry(
            rig.reserveCanopy.dateRepacked,
            rig.reserveCanopy.expiryDate,
          ),
        );
        const diff = expiry.getTime() - Date.now();
        return diff < 30 * 24 * 60 * 60 * 1000;
      })()
    : false;

  // ── Main Canopy ───────────────────────────────────────────────────────────
  const [mainOpen, setMainOpen] = useState(false);
  const [mainJumpsOpen, setMainJumpsOpen] = useState(false);
  const [mainForm, setMainForm] = useState({
    manufacturer: "",
    serialNumber: "",
    canopyType: "",
    dateOfManufacture: "",
    jumpsOnLineSet: "0",
    jumpsOnMainRisers: "0",
    totalJumps: "0",
  });
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);

  const openMainEdit = useCallback(() => {
    if (rig?.mainCanopy) {
      const m = rig.mainCanopy;
      setMainForm({
        manufacturer: m.manufacturer,
        serialNumber: m.serialNumber,
        canopyType: m.canopyType,
        dateOfManufacture: m.dateOfManufacture,
        jumpsOnLineSet: String(m.jumpsOnLineSet),
        jumpsOnMainRisers: String(m.jumpsOnMainRisers),
        totalJumps: String(m.totalJumps),
      });
    } else {
      setMainForm({
        manufacturer: "",
        serialNumber: "",
        canopyType: "",
        dateOfManufacture: "",
        jumpsOnLineSet: "0",
        jumpsOnMainRisers: "0",
        totalJumps: "0",
      });
    }
    setMainImageFile(null);
    setMainOpen(true);
  }, [rig]);

  const saveMain = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      let image: ExternalBlob | undefined;
      if (mainImageFile) {
        const buffer = await mainImageFile.arrayBuffer();
        image = ExternalBlobClass.fromBytes(new Uint8Array(buffer));
      }
      return actor.setMainCanopy({
        id: rigId,
        manufacturer: mainForm.manufacturer,
        serialNumber: mainForm.serialNumber,
        canopyType: mainForm.canopyType,
        dateOfManufacture: mainForm.dateOfManufacture,
        jumpsOnLineSet: parseBigInt(mainForm.jumpsOnLineSet),
        jumpsOnMainRisers: parseBigInt(mainForm.jumpsOnMainRisers),
        totalJumps: parseBigInt(mainForm.totalJumps),
        image,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rig", String(rigId)] });
      setMainOpen(false);
      toast.success("Main canopy saved");
    },
    onError: () => toast.error("Failed to save main canopy"),
  });

  const updateMainJumps = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.updateMainCanopyJumps({
        id: rigId,
        jumpsOnLineSet: parseBigInt(mainForm.jumpsOnLineSet),
        jumpsOnMainRisers: parseBigInt(mainForm.jumpsOnMainRisers),
        totalJumps: parseBigInt(mainForm.totalJumps),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rig", String(rigId)] });
      setMainJumpsOpen(false);
      toast.success("Jump counts updated");
    },
    onError: () => toast.error("Failed to update jump counts"),
  });

  const removeMain = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.removeMainCanopy(rigId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rig", String(rigId)] });
      toast.success("Main canopy removed");
    },
  });

  // ── Tandem Canopy ─────────────────────────────────────────────────────────
  const [tandemOpen, setTandemOpen] = useState(false);
  const [tandemJumpsOpen, setTandemJumpsOpen] = useState(false);
  const [tandemForm, setTandemForm] = useState({
    manufacturer: "",
    serialNumber: "",
    canopyType: "",
    dateOfManufacture: "",
    jumpsOnLineSet: "0",
    jumpsOnMainRisers: "0",
    jumpsOnDrogueBridle: "0",
    jumpsOnLowerBridleKillLine: "0",
    totalJumps: "0",
  });
  const [tandemImageFile, setTandemImageFile] = useState<File | null>(null);

  const openTandemEdit = useCallback(() => {
    if (rig?.tandemCanopy) {
      const t = rig.tandemCanopy;
      setTandemForm({
        manufacturer: t.manufacturer,
        serialNumber: t.serialNumber,
        canopyType: t.canopyType,
        dateOfManufacture: t.dateOfManufacture,
        jumpsOnLineSet: String(t.jumpsOnLineSet),
        jumpsOnMainRisers: String(t.jumpsOnMainRisers),
        jumpsOnDrogueBridle: String(t.jumpsOnDrogueBridle),
        jumpsOnLowerBridleKillLine: String(t.jumpsOnLowerBridleKillLine),
        totalJumps: String(t.totalJumps),
      });
    } else {
      setTandemForm({
        manufacturer: "",
        serialNumber: "",
        canopyType: "",
        dateOfManufacture: "",
        jumpsOnLineSet: "0",
        jumpsOnMainRisers: "0",
        jumpsOnDrogueBridle: "0",
        jumpsOnLowerBridleKillLine: "0",
        totalJumps: "0",
      });
    }
    setTandemImageFile(null);
    setTandemOpen(true);
  }, [rig]);

  const saveTandem = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      let image: ExternalBlob | undefined;
      if (tandemImageFile) {
        const buffer = await tandemImageFile.arrayBuffer();
        image = ExternalBlobClass.fromBytes(new Uint8Array(buffer));
      }
      return actor.setTandemMainCanopy({
        id: rigId,
        manufacturer: tandemForm.manufacturer,
        serialNumber: tandemForm.serialNumber,
        canopyType: tandemForm.canopyType,
        dateOfManufacture: tandemForm.dateOfManufacture,
        jumpsOnLineSet: parseBigInt(tandemForm.jumpsOnLineSet),
        jumpsOnMainRisers: parseBigInt(tandemForm.jumpsOnMainRisers),
        jumpsOnDrogueBridle: parseBigInt(tandemForm.jumpsOnDrogueBridle),
        jumpsOnLowerBridleKillLine: parseBigInt(
          tandemForm.jumpsOnLowerBridleKillLine,
        ),
        totalJumps: parseBigInt(tandemForm.totalJumps),
        image,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rig", String(rigId)] });
      setTandemOpen(false);
      toast.success("Tandem canopy saved");
    },
    onError: () => toast.error("Failed to save tandem canopy"),
  });

  const updateTandemJumps = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.updateTandemMainCanopyJumps({
        id: rigId,
        jumpsOnLineSet: parseBigInt(tandemForm.jumpsOnLineSet),
        jumpsOnMainRisers: parseBigInt(tandemForm.jumpsOnMainRisers),
        jumpsOnDrogueBridle: parseBigInt(tandemForm.jumpsOnDrogueBridle),
        jumpsOnLowerBridleKillLine: parseBigInt(
          tandemForm.jumpsOnLowerBridleKillLine,
        ),
        totalJumps: parseBigInt(tandemForm.totalJumps),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rig", String(rigId)] });
      setTandemJumpsOpen(false);
      toast.success("Tandem jump counts updated");
    },
    onError: () => toast.error("Failed to update tandem jump counts"),
  });

  const removeTandem = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.removeTandemMainCanopy(rigId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rig", String(rigId)] });
      toast.success("Tandem canopy removed");
    },
  });

  // ── Pack Job ──────────────────────────────────────────────────────────────
  const [packOpen, setPackOpen] = useState(false);
  const [packerName, setPackerName] = useState("");
  const [packDate, setPackDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [signatureData, setSignatureData] = useState("");

  const addPackJob = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.addPackJob(
        rigId,
        packerName.trim(),
        signatureData,
        packDate,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packjobs", String(rigId)] });
      queryClient.invalidateQueries({ queryKey: ["rig", String(rigId)] });
      setPackOpen(false);
      setPackerName("");
      setSignatureData("");
      toast.success("Pack job logged");
    },
    onError: () => toast.error("Failed to log pack job"),
  });

  const [deleteJobId, setDeleteJobId] = useState<bigint | null>(null);
  const deletePackJob = useMutation({
    mutationFn: async (jobId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deletePackJob(jobId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packjobs", String(rigId)] });
      toast.success("Pack job deleted");
    },
    onError: () => toast.error("Failed to delete pack job"),
  });

  // ── 50-Jump Check ────────────────────────────────────────────────────────
  const submitFiftyJumpCheck = useMutation({
    mutationFn: async (data: {
      completedBy: string;
      completedDate: string;
      signatureData: string;
      checklistData: string;
      notes: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.completeFiftyJumpCheck({
        rigId,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rig", String(rigId)] });
      queryClient.invalidateQueries({
        queryKey: ["fiftyjumpchecks", String(rigId)],
      });
      setCheckModalOpen(false);
      setCheckModalDismissed(false);
      toast.success("50-jump check completed!");
    },
    onError: () => toast.error("Failed to submit check"),
  });

  // ── CSV Export ────────────────────────────────────────────────────────────
  const exportCSV = async () => {
    if (!rig || !actor) return;
    try {
      const [components, jobs] = await Promise.all([
        actor.getRigComponents(rigId),
        actor.getPackJobs(rigId),
      ]);

      let csv = "Rig Information\n";
      csv += "Name,Owner,Total Jumps,Created Date\n";
      csv += `"${rig.name}","${rig.ownerName}",${rig.totalJumps},"${new Date(Number(rig.createdAt) / 1_000_000).toLocaleDateString()}"\n\n`;

      if (components?.harnessContainer) {
        const h = components.harnessContainer;
        csv += "Harness / Container\n";
        csv += "Manufacturer,Serial Number,Model,Date of Manufacture\n";
        csv += `"${h.manufacturer}","${h.serialNumber}","${h.model}","${h.dateOfManufacture}"\n\n`;
      }

      if (components?.aad) {
        const a = components.aad;
        csv += "AAD\n";
        csv +=
          "Manufacturer,Type,Serial Number,Date of Manufacture,End of Life,Service Date\n";
        csv += `"${a.manufacturer}","${a.aadType}","${a.serialNumber}","${a.dateOfManufacture}","${a.endOfLife}","${a.serviceDate}"\n\n`;
      }

      if (components?.reserveCanopy) {
        const r = components.reserveCanopy;
        csv += "Reserve Canopy\n";
        csv +=
          "Manufacturer,Type,Serial Number,Date of Manufacture,Date Repacked,Expiry Date,Total Jumps\n";
        csv += `"${r.manufacturer}","${r.reserveType}","${r.serialNumber}","${r.dateOfManufacture}","${r.dateRepacked}","${calcReserveExpiry(r.dateRepacked)}",${r.totalJumps}\n\n`;
      }

      if (components?.mainCanopy) {
        const m = components.mainCanopy;
        csv += "Main Canopy\n";
        csv +=
          "Manufacturer,Serial Number,Type,Date of Manufacture,Jumps on Line Set,Jumps on Main Risers,Total Jumps\n";
        csv += `"${m.manufacturer}","${m.serialNumber}","${m.canopyType}","${m.dateOfManufacture}",${m.jumpsOnLineSet},${m.jumpsOnMainRisers},${m.totalJumps}\n\n`;
      }

      if (components?.tandemCanopy) {
        const t = components.tandemCanopy;
        csv += "Tandem Main Canopy\n";
        csv +=
          "Manufacturer,Serial Number,Type,Date of Manufacture,Jumps on Line Set,Jumps on Main Risers,Jumps on Drogue/Bridle,Jumps on Lower Bridle/Kill Line,Total Jumps\n";
        csv += `"${t.manufacturer}","${t.serialNumber}","${t.canopyType}","${t.dateOfManufacture}",${t.jumpsOnLineSet},${t.jumpsOnMainRisers},${t.jumpsOnDrogueBridle},${t.jumpsOnLowerBridleKillLine},${t.totalJumps}\n\n`;
      }

      if (jobs.length > 0) {
        csv += "Jump / Pack Log\n";
        csv += "Date,Packer Name\n";
        for (const j of jobs) {
          csv += `"${j.packDate}","${j.packerName}"\n`;
        }
      }

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${rig.name.replace(/\s+/g, "-")}-rig-data.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported");
    } catch {
      toast.error("Failed to export CSV");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoading || !rig) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div
          className="flex justify-center items-center py-24"
          data-ocid="rig.loading_state"
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back + Rig Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            className="gap-2 mb-4 -ml-2"
            onClick={onBack}
            data-ocid="rig.link"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div
            className="bg-white rounded-xl border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <div>
              <h1 className="text-2xl font-bold text-foreground">{rig.name}</h1>
              <p className="text-muted-foreground">{rig.ownerName}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end gap-2 flex-1 sm:flex-none">
                <div className="flex items-center gap-3">
                  <div
                    className="px-4 py-2 rounded-xl text-white font-bold text-lg"
                    style={{ backgroundColor: "#2E6F9E" }}
                  >
                    {Number(rig.totalJumps).toLocaleString()} jumps
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditRigOpen(true)}
                    data-ocid="rig.edit_button"
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                </div>
                {/* 50-Jump Check Progress */}
                <div className="w-full sm:w-64">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground font-medium">
                      50-jump check: {Math.min(jumpsSince, 50)} / 50
                    </span>
                    {checkRequired ? (
                      <Badge
                        className="text-xs bg-red-600 hover:bg-red-600 text-white cursor-pointer animate-pulse"
                        onClick={() => setCheckModalOpen(true)}
                        data-ocid="fiftyjump.open_modal_button"
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        CHECK REQUIRED
                      </Badge>
                    ) : jumpsSince >= 40 ? (
                      <Badge className="text-xs bg-amber-500 hover:bg-amber-500 text-white">
                        Due soon
                      </Badge>
                    ) : null}
                  </div>
                  <Progress
                    value={(Math.min(jumpsSince, 50) / 50) * 100}
                    className={`h-2 ${checkRequired ? "[&>div]:bg-red-500" : jumpsSince >= 40 ? "[&>div]:bg-amber-500" : "[&>div]:bg-green-500"}`}
                  />
                </div>
                {checkRequired && (
                  <Button
                    size="sm"
                    onClick={() => setCheckModalOpen(true)}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs"
                    data-ocid="fiftyjump.primary_button"
                  >
                    <ClipboardList className="w-3.5 h-3.5 mr-1" />
                    Complete 50-Jump Check
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="components">
          <TabsList className="mb-4">
            <TabsTrigger value="components" data-ocid="rig.tab">
              Components
            </TabsTrigger>
            <TabsTrigger value="jumplog" data-ocid="rig.tab">
              Jump Log
            </TabsTrigger>
            <TabsTrigger value="export" data-ocid="rig.tab">
              Export
            </TabsTrigger>
            <TabsTrigger
              value="fiftyjumpchecks"
              data-ocid="rig.tab"
              className="relative"
            >
              50-Jump Checks
              {checkRequired && (
                <span className="ml-1.5 inline-flex w-2 h-2 rounded-full bg-red-500" />
              )}
            </TabsTrigger>
          </TabsList>

          {/* Components Tab */}
          <TabsContent value="components" className="space-y-4">
            {/* Harness/Container */}
            <ComponentCard
              title="Harness / Container"
              exists={!!rig.harnessContainer}
              onAdd={openHarnessEdit}
              onEdit={openHarnessEdit}
              onRemove={() => removeHarness.mutate()}
            >
              {rig.harnessContainer && (
                <>
                  {rig.harnessContainer.image && (
                    <img
                      src={rig.harnessContainer.image.getDirectURL()}
                      alt="Harness"
                      className="w-full max-h-48 object-cover rounded-lg mb-3"
                    />
                  )}
                  <InfoRow
                    label="Manufacturer"
                    value={rig.harnessContainer.manufacturer}
                  />
                  <InfoRow
                    label="Serial Number"
                    value={rig.harnessContainer.serialNumber}
                  />
                  <InfoRow label="Model" value={rig.harnessContainer.model} />
                  <InfoRow
                    label="Date of Manufacture"
                    value={rig.harnessContainer.dateOfManufacture}
                  />
                </>
              )}
              <RiggerNotes rigId={rigId} componentType="harness" />
            </ComponentCard>

            {/* AAD */}
            <ComponentCard
              title="AAD (Automatic Activation Device)"
              exists={!!rig.aad}
              onAdd={openAadEdit}
              onEdit={openAadEdit}
              onRemove={() => removeAad.mutate()}
            >
              {rig.aad && (
                <>
                  <InfoRow label="Manufacturer" value={rig.aad.manufacturer} />
                  <InfoRow label="Type" value={rig.aad.aadType} />
                  <InfoRow label="Serial Number" value={rig.aad.serialNumber} />
                  <InfoRow
                    label="Date of Manufacture"
                    value={rig.aad.dateOfManufacture}
                  />
                  <InfoRow label="End of Life" value={rig.aad.endOfLife} />
                  <InfoRow label="Service Date" value={rig.aad.serviceDate} />
                </>
              )}
              <RiggerNotes rigId={rigId} componentType="aad" />
            </ComponentCard>

            {/* Reserve Canopy */}
            <ComponentCard
              title="Reserve Canopy"
              exists={!!rig.reserveCanopy}
              onAdd={openReserveEdit}
              onEdit={openReserveEdit}
              onRemove={() => removeReserve.mutate()}
            >
              {rig.reserveCanopy && (
                <>
                  {isReserveExpiringSoon && (
                    <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium">
                        Reserve expires{" "}
                        {getReserveExpiry(
                          rig.reserveCanopy.dateRepacked,
                          rig.reserveCanopy.expiryDate,
                        )}{" "}
                        — repack required soon!
                      </span>
                    </div>
                  )}
                  <InfoRow
                    label="Manufacturer"
                    value={rig.reserveCanopy.manufacturer}
                  />
                  <InfoRow label="Type" value={rig.reserveCanopy.reserveType} />
                  <InfoRow
                    label="Serial Number"
                    value={rig.reserveCanopy.serialNumber}
                  />
                  <InfoRow
                    label="Date of Manufacture"
                    value={rig.reserveCanopy.dateOfManufacture}
                  />
                  <InfoRow
                    label="Date Repacked"
                    value={rig.reserveCanopy.dateRepacked}
                  />
                  <InfoRow
                    label="Expiry Date"
                    value={getReserveExpiry(
                      rig.reserveCanopy.dateRepacked,
                      rig.reserveCanopy.expiryDate,
                    )}
                  />
                  <InfoRow
                    label="Total Jumps"
                    value={Number(
                      rig.reserveCanopy.totalJumps,
                    ).toLocaleString()}
                  />
                </>
              )}
              <RiggerNotes rigId={rigId} componentType="reserve" />
            </ComponentCard>

            {/* Main Canopy - only show if no tandem canopy added */}
            {!rig.tandemCanopy && (
              <ComponentCard
                title="Main Canopy"
                exists={!!rig.mainCanopy}
                onAdd={openMainEdit}
                onEdit={openMainEdit}
                onRemove={() => removeMain.mutate()}
                actions={
                  rig.mainCanopy ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (rig.mainCanopy) {
                          setMainForm({
                            manufacturer: rig.mainCanopy.manufacturer,
                            serialNumber: rig.mainCanopy.serialNumber,
                            canopyType: rig.mainCanopy.canopyType,
                            dateOfManufacture: rig.mainCanopy.dateOfManufacture,
                            jumpsOnLineSet: String(
                              rig.mainCanopy.jumpsOnLineSet,
                            ),
                            jumpsOnMainRisers: String(
                              rig.mainCanopy.jumpsOnMainRisers,
                            ),
                            totalJumps: String(rig.mainCanopy.totalJumps),
                          });
                        }
                        setMainJumpsOpen(true);
                      }}
                      data-ocid="main.edit_button"
                    >
                      Edit Jumps
                    </Button>
                  ) : undefined
                }
              >
                {rig.mainCanopy && (
                  <>
                    {rig.mainCanopy.image && (
                      <img
                        src={rig.mainCanopy.image.getDirectURL()}
                        alt="Main Canopy"
                        className="w-full max-h-48 object-cover rounded-lg mb-3"
                      />
                    )}
                    <InfoRow
                      label="Manufacturer"
                      value={rig.mainCanopy.manufacturer}
                    />
                    <InfoRow
                      label="Serial Number"
                      value={rig.mainCanopy.serialNumber}
                    />
                    <InfoRow label="Type" value={rig.mainCanopy.canopyType} />
                    <InfoRow
                      label="Date of Manufacture"
                      value={rig.mainCanopy.dateOfManufacture}
                    />
                    <InfoRow
                      label="Jumps on Line Set"
                      value={Number(
                        rig.mainCanopy.jumpsOnLineSet,
                      ).toLocaleString()}
                    />
                    <InfoRow
                      label="Jumps on Main Risers"
                      value={Number(
                        rig.mainCanopy.jumpsOnMainRisers,
                      ).toLocaleString()}
                    />
                    <InfoRow
                      label="Total Jumps"
                      value={Number(rig.mainCanopy.totalJumps).toLocaleString()}
                    />
                  </>
                )}
                <RiggerNotes rigId={rigId} componentType="main" />
              </ComponentCard>
            )}

            {/* Tandem Canopy - only show if no main canopy added */}
            {!rig.mainCanopy && (
              <ComponentCard
                title="Tandem Main Canopy"
                exists={!!rig.tandemCanopy}
                onAdd={openTandemEdit}
                onEdit={openTandemEdit}
                onRemove={() => removeTandem.mutate()}
                actions={
                  rig.tandemCanopy ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (rig.tandemCanopy) {
                          setTandemForm({
                            manufacturer: rig.tandemCanopy.manufacturer,
                            serialNumber: rig.tandemCanopy.serialNumber,
                            canopyType: rig.tandemCanopy.canopyType,
                            dateOfManufacture:
                              rig.tandemCanopy.dateOfManufacture,
                            jumpsOnLineSet: String(
                              rig.tandemCanopy.jumpsOnLineSet,
                            ),
                            jumpsOnMainRisers: String(
                              rig.tandemCanopy.jumpsOnMainRisers,
                            ),
                            jumpsOnDrogueBridle: String(
                              rig.tandemCanopy.jumpsOnDrogueBridle,
                            ),
                            jumpsOnLowerBridleKillLine: String(
                              rig.tandemCanopy.jumpsOnLowerBridleKillLine,
                            ),
                            totalJumps: String(rig.tandemCanopy.totalJumps),
                          });
                        }
                        setTandemJumpsOpen(true);
                      }}
                      data-ocid="tandem.edit_button"
                    >
                      Edit Jumps
                    </Button>
                  ) : undefined
                }
              >
                {rig.tandemCanopy && (
                  <>
                    {rig.tandemCanopy.image && (
                      <img
                        src={rig.tandemCanopy.image.getDirectURL()}
                        alt="Tandem Canopy"
                        className="w-full max-h-48 object-cover rounded-lg mb-3"
                      />
                    )}
                    <InfoRow
                      label="Manufacturer"
                      value={rig.tandemCanopy.manufacturer}
                    />
                    <InfoRow
                      label="Serial Number"
                      value={rig.tandemCanopy.serialNumber}
                    />
                    <InfoRow label="Type" value={rig.tandemCanopy.canopyType} />
                    <InfoRow
                      label="Date of Manufacture"
                      value={rig.tandemCanopy.dateOfManufacture}
                    />
                    <InfoRow
                      label="Jumps on Line Set"
                      value={Number(
                        rig.tandemCanopy.jumpsOnLineSet,
                      ).toLocaleString()}
                    />
                    <InfoRow
                      label="Jumps on Main Risers"
                      value={Number(
                        rig.tandemCanopy.jumpsOnMainRisers,
                      ).toLocaleString()}
                    />
                    <InfoRow
                      label="Jumps on Drogue/Bridle"
                      value={Number(
                        rig.tandemCanopy.jumpsOnDrogueBridle,
                      ).toLocaleString()}
                    />
                    <InfoRow
                      label="Jumps on Lower Bridle/Kill Line"
                      value={Number(
                        rig.tandemCanopy.jumpsOnLowerBridleKillLine,
                      ).toLocaleString()}
                    />
                    <InfoRow
                      label="Total Jumps"
                      value={Number(
                        rig.tandemCanopy.totalJumps,
                      ).toLocaleString()}
                    />
                  </>
                )}
                <RiggerNotes rigId={rigId} componentType="tandem" />
              </ComponentCard>
            )}
          </TabsContent>

          {/* Jump Log Tab */}
          <TabsContent value="jumplog">
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button
                  style={{ backgroundColor: "#2E6F9E" }}
                  onClick={() => setPackOpen(true)}
                  data-ocid="packlog.open_modal_button"
                >
                  Log Pack Job
                </Button>
              </div>

              {/* Pack Jobs */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Pack Jobs
                </h3>
                {packJobs.length === 0 ? (
                  <div
                    className="text-center py-10 bg-white rounded-xl border border-border text-muted-foreground"
                    data-ocid="packlog.empty_state"
                  >
                    No pack jobs recorded yet
                  </div>
                ) : (
                  <div
                    className="bg-white rounded-xl border border-border overflow-hidden"
                    style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                  >
                    <Table data-ocid="packlog.table">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Packer Name</TableHead>
                          <TableHead>Signature</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {packJobs.map((job, idx) => (
                          <TableRow
                            key={String(job.id)}
                            data-ocid={`packlog.row.${idx + 1}`}
                          >
                            <TableCell>{job.packDate}</TableCell>
                            <TableCell>{job.packerName}</TableCell>
                            <TableCell>
                              {job.signatureData?.startsWith("data:") ? (
                                <img
                                  src={job.signatureData}
                                  alt="Signature"
                                  className="h-10 w-auto border border-border rounded"
                                />
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  —
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteJobId(job.id)}
                                data-ocid={`packlog.delete_button.${idx + 1}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* 50-Jump Check Records */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  50-Jump Check Records
                </h3>
                {fiftyJumpChecks.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-xl border border-border text-muted-foreground">
                    No 50-jump checks recorded yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fiftyJumpChecks.map((check, idx) => {
                      let parsedData: {
                        sections?: Array<{
                          heading: string;
                          items: Array<{
                            label: string;
                            status: string;
                            notes: string;
                          }>;
                        }>;
                        secondSignatory?: {
                          name: string;
                          confirmedItem: string;
                        };
                      } = {};
                      try {
                        parsedData = JSON.parse(check.checklistData);
                      } catch {
                        /* ignore */
                      }
                      const allItems =
                        parsedData.sections?.flatMap((s) => s.items) ?? [];
                      const serviceableCount = allItems.filter(
                        (i) => i.status === "serviceable",
                      ).length;
                      const notServiceableCount = allItems.filter(
                        (i) => i.status === "not_serviceable",
                      ).length;
                      return (
                        <details
                          key={String(check.id)}
                          className="bg-white rounded-xl border border-border overflow-hidden"
                          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                          data-ocid={`packlog.fiftyjump.${idx + 1}`}
                        >
                          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors list-none">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <ClipboardList className="w-4 h-4 text-blue-700" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground text-sm">
                                  {check.completedDate}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  50-Jump Check — {check.completedBy}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {notServiceableCount > 0 && (
                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">
                                  {notServiceableCount} not serviceable
                                </Badge>
                              )}
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                                {serviceableCount}/{allItems.length} serviceable
                              </Badge>
                            </div>
                          </summary>
                          <div className="border-t border-border p-4 space-y-4">
                            {parsedData.sections?.map((section) => (
                              <div key={section.heading}>
                                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                                  {section.heading}
                                </p>
                                <div className="space-y-1">
                                  {section.items.map((item) => (
                                    <div
                                      key={item.label}
                                      className="flex items-start gap-2 text-sm"
                                    >
                                      {item.status === "serviceable" ? (
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                      ) : (
                                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                      )}
                                      <div>
                                        <span className="text-foreground">
                                          {item.label}
                                        </span>
                                        {item.notes && (
                                          <p className="text-xs text-muted-foreground">
                                            {item.notes}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                            {parsedData.secondSignatory && (
                              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                <p className="text-xs font-semibold text-blue-800 mb-1">
                                  Second Signatory — 3 Rings & MARD
                                </p>
                                <p className="text-sm text-blue-900">
                                  {parsedData.secondSignatory.name}
                                </p>
                                <p className="text-xs text-blue-700">
                                  {parsedData.secondSignatory.confirmedItem}
                                </p>
                              </div>
                            )}
                            {check.notes && (
                              <div className="pt-2 border-t border-border">
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Notes
                                </p>
                                <p className="text-sm text-foreground">
                                  {check.notes}
                                </p>
                              </div>
                            )}
                            {check.signatureData?.startsWith("data:") && (
                              <div className="pt-2 border-t border-border">
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Packer Signature
                                </p>
                                <img
                                  src={check.signatureData}
                                  alt="Signature"
                                  className="h-12 w-auto border border-border rounded"
                                />
                              </div>
                            )}
                          </div>
                        </details>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export">
            <div
              className="bg-white rounded-xl border border-border p-8 flex flex-col items-center gap-4"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
            >
              <Download className="w-12 h-12 text-primary" />
              <h2 className="text-xl font-bold">Export Rig Data</h2>
              <p className="text-muted-foreground text-center max-w-md">
                Download a CSV file containing all rig information, component
                details, and pack job history.
              </p>
              <Button
                style={{ backgroundColor: "#2E6F9E" }}
                className="gap-2"
                onClick={exportCSV}
                data-ocid="export.primary_button"
              >
                <Download className="w-4 h-4" />
                Export to CSV
              </Button>
            </div>
          </TabsContent>
          {/* 50-Jump Checks Tab */}
          <TabsContent value="fiftyjumpchecks">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  50-Jump Check History
                </h2>
                {checkRequired && (
                  <Button
                    onClick={() => setCheckModalOpen(true)}
                    className="bg-red-600 hover:bg-red-700 text-white gap-2"
                    data-ocid="fiftyjump.open_modal_button"
                  >
                    <ClipboardList className="w-4 h-4" />
                    Complete 50-Jump Check
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setPreviewCheckOpen(true)}
                  className="gap-2"
                  data-ocid="fiftyjump.secondary_button"
                >
                  <Eye className="w-4 h-4" />
                  Preview Form
                </Button>
              </div>
              {fiftyJumpChecks.length === 0 ? (
                <div
                  className="text-center py-12 bg-white rounded-xl border border-border text-muted-foreground"
                  data-ocid="fiftyjump.empty_state"
                >
                  No 50-jump checks recorded yet
                </div>
              ) : (
                <div className="space-y-3" data-ocid="fiftyjump.list">
                  {fiftyJumpChecks.map((check, idx) => {
                    let parsedItems: Array<{
                      label: string;
                      status: string;
                      notes: string;
                    }> = [];
                    try {
                      parsedItems =
                        JSON.parse(check.checklistData)?.items ?? [];
                    } catch {
                      /* ignore */
                    }
                    const passCount = parsedItems.filter(
                      (i) => i.status === "pass",
                    ).length;
                    const failCount = parsedItems.filter(
                      (i) => i.status === "fail",
                    ).length;
                    return (
                      <details
                        key={String(check.id)}
                        className="bg-white rounded-xl border border-border overflow-hidden"
                        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                        data-ocid={`fiftyjump.item.${idx + 1}`}
                      >
                        <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors list-none">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="font-semibold text-foreground text-sm">
                                {check.completedDate}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Completed by {check.completedBy}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {failCount > 0 && (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">
                                {failCount} fail{failCount !== 1 ? "s" : ""}
                              </Badge>
                            )}
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                              {passCount} / {parsedItems.length} pass
                            </Badge>
                          </div>
                        </summary>
                        <div className="border-t border-border p-4 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {parsedItems.map((item) => (
                              <div
                                key={item.label}
                                className="flex items-start gap-2 text-sm"
                              >
                                {item.status === "pass" ? (
                                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                )}
                                <div>
                                  <span className="text-foreground">
                                    {item.label}
                                  </span>
                                  {item.notes && (
                                    <p className="text-xs text-muted-foreground">
                                      {item.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          {check.notes && (
                            <div className="pt-2 border-t border-border">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Notes
                              </p>
                              <p className="text-sm text-foreground">
                                {check.notes}
                              </p>
                            </div>
                          )}
                          {check.signatureData?.startsWith("data:") && (
                            <div className="pt-2 border-t border-border">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Signature
                              </p>
                              <img
                                src={check.signatureData}
                                alt="Signature"
                                className="h-12 w-auto border border-border rounded"
                              />
                            </div>
                          )}
                        </div>
                      </details>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ── 50-Jump Check Modal ── */}
      {rig && (
        <FiftyJumpCheckModal
          open={checkModalOpen}
          rigName={rig.name}
          jumpsSince={jumpsSince}
          isSubmitting={submitFiftyJumpCheck.isPending}
          onSubmit={(data) => submitFiftyJumpCheck.mutate(data)}
        />
      )}

      {/* ── 50-Jump Check Preview Modal ── */}
      {rig && (
        <FiftyJumpCheckModal
          open={previewCheckOpen}
          rigName={rig.name}
          jumpsSince={jumpsSince}
          isSubmitting={false}
          onClose={() => setPreviewCheckOpen(false)}
          onSubmit={() => setPreviewCheckOpen(false)}
        />
      )}

      {/* ── Edit Rig Dialog ── */}
      <Dialog open={editRigOpen} onOpenChange={setEditRigOpen}>
        <DialogContent data-ocid="rig.dialog">
          <DialogHeader>
            <DialogTitle>Edit Rig Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Rig Name</Label>
              <Input
                value={editRigName}
                onChange={(e) => setEditRigName(e.target.value)}
                data-ocid="rig.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Owner Name</Label>
              <Input
                value={editRigOwner}
                onChange={(e) => setEditRigOwner(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Total Jumps</Label>
              <Input
                type="number"
                value={editRigJumps}
                onChange={(e) => setEditRigJumps(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditRigOpen(false)}
              data-ocid="rig.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateRig.mutate()}
              disabled={updateRig.isPending}
              style={{ backgroundColor: "#2E6F9E" }}
              data-ocid="rig.save_button"
            >
              {updateRig.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Harness Form Dialog ── */}
      <Dialog open={harnessOpen} onOpenChange={setHarnessOpen}>
        <DialogContent data-ocid="harness.dialog">
          <DialogHeader>
            <DialogTitle>
              {rig.harnessContainer ? "Edit" : "Add"} Harness / Container
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(
              [
                ["manufacturer", "Manufacturer", "text"],
                ["serialNumber", "Serial Number", "text"],
                ["model", "Model", "text"],
                ["dateOfManufacture", "Date of Manufacture", "date"],
              ] as [keyof typeof harnessForm, string, string][]
            ).map(([key, label, type]) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <Input
                  type={type}
                  value={harnessForm[key]}
                  onChange={(e) =>
                    setHarnessForm((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  data-ocid="harness.input"
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>Image (optional)</Label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setHarnessImageFile(e.target.files?.[0] ?? null)
                }
                className="text-sm"
                data-ocid="harness.upload_button"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setHarnessOpen(false)}
              data-ocid="harness.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => saveHarness.mutate()}
              disabled={saveHarness.isPending}
              style={{ backgroundColor: "#2E6F9E" }}
              data-ocid="harness.save_button"
            >
              {saveHarness.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── AAD Form Dialog ── */}
      <Dialog open={aadOpen} onOpenChange={setAadOpen}>
        <DialogContent data-ocid="aad.dialog">
          <DialogHeader>
            <DialogTitle>{rig.aad ? "Edit" : "Add"} AAD</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(
              [
                ["manufacturer", "Manufacturer", "text"],
                ["aadType", "AAD Type", "text"],
                ["serialNumber", "Serial Number", "text"],
                ["dateOfManufacture", "Date of Manufacture", "date"],
                ["endOfLife", "End of Life", "date"],
                ["serviceDate", "Service Date", "date"],
              ] as [keyof typeof aadForm, string, string][]
            ).map(([key, label, type]) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <Input
                  type={type}
                  value={aadForm[key]}
                  onChange={(e) =>
                    setAadForm((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  data-ocid="aad.input"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAadOpen(false)}
              data-ocid="aad.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => saveAad.mutate()}
              disabled={saveAad.isPending}
              style={{ backgroundColor: "#2E6F9E" }}
              data-ocid="aad.save_button"
            >
              {saveAad.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reserve Form Dialog ── */}
      <Dialog open={reserveOpen} onOpenChange={setReserveOpen}>
        <DialogContent data-ocid="reserve.dialog">
          <DialogHeader>
            <DialogTitle>
              {rig.reserveCanopy ? "Edit" : "Add"} Reserve Canopy
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(
              [
                ["manufacturer", "Manufacturer", "text"],
                ["reserveType", "Reserve Type", "text"],
                ["serialNumber", "Serial Number", "text"],
                ["dateOfManufacture", "Date of Manufacture", "date"],
                ["dateRepacked", "Date Repacked", "date"],
              ] as [keyof typeof reserveForm, string, string][]
            ).map(([key, label, type]) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <Input
                  type={type}
                  value={reserveForm[key]}
                  onChange={(e) =>
                    setReserveForm((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  data-ocid="reserve.input"
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>Total Jumps</Label>
              <Input
                type="number"
                min="0"
                value={reserveForm.totalJumps}
                onChange={(e) =>
                  setReserveForm((prev) => ({
                    ...prev,
                    totalJumps: e.target.value,
                  }))
                }
              />
            </div>
            {reserveForm.dateRepacked && (
              <p className="text-xs text-muted-foreground">
                Expiry: {calcReserveExpiry(reserveForm.dateRepacked)} (6 months)
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReserveOpen(false)}
              data-ocid="reserve.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => saveReserve.mutate()}
              disabled={saveReserve.isPending}
              style={{ backgroundColor: "#2E6F9E" }}
              data-ocid="reserve.save_button"
            >
              {saveReserve.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Main Canopy Form Dialog ── */}
      <Dialog open={mainOpen} onOpenChange={setMainOpen}>
        <DialogContent data-ocid="main.dialog">
          <DialogHeader>
            <DialogTitle>
              {rig.mainCanopy ? "Edit" : "Add"} Main Canopy
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(
              [
                ["manufacturer", "Manufacturer", "text"],
                ["serialNumber", "Serial Number", "text"],
                ["canopyType", "Canopy Type", "text"],
                ["dateOfManufacture", "Date of Manufacture", "date"],
              ] as [keyof typeof mainForm, string, string][]
            ).map(([key, label, type]) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <Input
                  type={type}
                  value={mainForm[key]}
                  onChange={(e) =>
                    setMainForm((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  data-ocid="main.input"
                />
              </div>
            ))}
            {(
              ["jumpsOnLineSet", "jumpsOnMainRisers", "totalJumps"] as const
            ).map((key) => (
              <div key={key} className="space-y-1.5">
                <Label>
                  {key === "jumpsOnLineSet"
                    ? "Jumps on Line Set"
                    : key === "jumpsOnMainRisers"
                      ? "Jumps on Main Risers"
                      : "Total Jumps"}
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={mainForm[key]}
                  onChange={(e) =>
                    setMainForm((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>Image (optional)</Label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setMainImageFile(e.target.files?.[0] ?? null)}
                className="text-sm"
                data-ocid="main.upload_button"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMainOpen(false)}
              data-ocid="main.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => saveMain.mutate()}
              disabled={saveMain.isPending}
              style={{ backgroundColor: "#2E6F9E" }}
              data-ocid="main.save_button"
            >
              {saveMain.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Main Canopy Jump Counts Dialog ── */}
      <Dialog open={mainJumpsOpen} onOpenChange={setMainJumpsOpen}>
        <DialogContent data-ocid="main.modal">
          <DialogHeader>
            <DialogTitle>Edit Main Canopy Jump Counts</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(
              ["jumpsOnLineSet", "jumpsOnMainRisers", "totalJumps"] as const
            ).map((key) => (
              <div key={key} className="space-y-1.5">
                <Label>
                  {key === "jumpsOnLineSet"
                    ? "Jumps on Line Set"
                    : key === "jumpsOnMainRisers"
                      ? "Jumps on Main Risers"
                      : "Total Jumps"}
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={mainForm[key]}
                  onChange={(e) =>
                    setMainForm((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMainJumpsOpen(false)}
              data-ocid="main.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateMainJumps.mutate()}
              disabled={updateMainJumps.isPending}
              style={{ backgroundColor: "#2E6F9E" }}
              data-ocid="main.save_button"
            >
              {updateMainJumps.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Tandem Canopy Form Dialog ── */}
      <Dialog open={tandemOpen} onOpenChange={setTandemOpen}>
        <DialogContent data-ocid="tandem.dialog">
          <DialogHeader>
            <DialogTitle>
              {rig.tandemCanopy ? "Edit" : "Add"} Tandem Main Canopy
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            {(
              [
                ["manufacturer", "Manufacturer", "text"],
                ["serialNumber", "Serial Number", "text"],
                ["canopyType", "Canopy Type", "text"],
                ["dateOfManufacture", "Date of Manufacture", "date"],
              ] as [keyof typeof tandemForm, string, string][]
            ).map(([key, label, type]) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <Input
                  type={type}
                  value={tandemForm[key]}
                  onChange={(e) =>
                    setTandemForm((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  data-ocid="tandem.input"
                />
              </div>
            ))}
            {(
              [
                ["jumpsOnLineSet", "Jumps on Line Set"],
                ["jumpsOnMainRisers", "Jumps on Main Risers"],
                ["jumpsOnDrogueBridle", "Jumps on Drogue/Bridle"],
                [
                  "jumpsOnLowerBridleKillLine",
                  "Jumps on Lower Bridle/Kill Line",
                ],
                ["totalJumps", "Total Jumps"],
              ] as [keyof typeof tandemForm, string][]
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <Input
                  type="number"
                  min="0"
                  value={tandemForm[key]}
                  onChange={(e) =>
                    setTandemForm((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>Image (optional)</Label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setTandemImageFile(e.target.files?.[0] ?? null)
                }
                className="text-sm"
                data-ocid="tandem.upload_button"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTandemOpen(false)}
              data-ocid="tandem.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => saveTandem.mutate()}
              disabled={saveTandem.isPending}
              style={{ backgroundColor: "#2E6F9E" }}
              data-ocid="tandem.save_button"
            >
              {saveTandem.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Tandem Jump Counts Dialog ── */}
      <Dialog open={tandemJumpsOpen} onOpenChange={setTandemJumpsOpen}>
        <DialogContent data-ocid="tandem.modal">
          <DialogHeader>
            <DialogTitle>Edit Tandem Canopy Jump Counts</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(
              [
                ["jumpsOnLineSet", "Jumps on Line Set"],
                ["jumpsOnMainRisers", "Jumps on Main Risers"],
                ["jumpsOnDrogueBridle", "Jumps on Drogue/Bridle"],
                [
                  "jumpsOnLowerBridleKillLine",
                  "Jumps on Lower Bridle/Kill Line",
                ],
                ["totalJumps", "Total Jumps"],
              ] as [keyof typeof tandemForm, string][]
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <Input
                  type="number"
                  min="0"
                  value={tandemForm[key]}
                  onChange={(e) =>
                    setTandemForm((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTandemJumpsOpen(false)}
              data-ocid="tandem.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateTandemJumps.mutate()}
              disabled={updateTandemJumps.isPending}
              style={{ backgroundColor: "#2E6F9E" }}
              data-ocid="tandem.save_button"
            >
              {updateTandemJumps.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Pack Job Dialog ── */}
      <Dialog open={packOpen} onOpenChange={setPackOpen}>
        <DialogContent className="max-w-lg" data-ocid="packlog.dialog">
          <DialogHeader>
            <DialogTitle>Log Pack Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Packer Name</Label>
              <Input
                value={packerName}
                onChange={(e) => setPackerName(e.target.value)}
                placeholder="Packer's full name"
                data-ocid="packlog.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pack Date</Label>
              <Input
                type="date"
                value={packDate}
                onChange={(e) => setPackDate(e.target.value)}
              />
            </div>
            <SignaturePad onSave={(url) => setSignatureData(url)} />
            {signatureData && (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <span>✓ Signature captured</span>
                <img
                  src={signatureData}
                  alt="sig"
                  className="h-8 border rounded"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPackOpen(false)}
              data-ocid="packlog.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => addPackJob.mutate()}
              disabled={
                !packerName.trim() ||
                !packDate ||
                !signatureData ||
                addPackJob.isPending
              }
              style={{ backgroundColor: "#2E6F9E" }}
              data-ocid="packlog.submit_button"
            >
              {addPackJob.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Log Pack Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={deleteJobId !== null}
        onOpenChange={(open) => !open && setDeleteJobId(null)}
      >
        <AlertDialogContent data-ocid="packlog.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pack Job?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this pack job entry? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="packlog.cancel_button"
              onClick={() => setDeleteJobId(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="packlog.confirm_button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteJobId !== null) {
                  deletePackJob.mutate(deleteJobId);
                  setDeleteJobId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
