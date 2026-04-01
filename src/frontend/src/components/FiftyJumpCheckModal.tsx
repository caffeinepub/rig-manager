import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import SignaturePad from "./SignaturePad";

const CHECKLIST_ITEMS = [
  "Closing loop condition",
  "Main closing pin condition",
  "Reserve closing pin condition",
  "Pilot chute condition (mesh, fabric, kill line)",
  "Bridle condition",
  "Main deployment bag condition",
  "Risers condition (wear, stitching)",
  "Harness webbing condition (wear, stitching)",
  "Container fabric condition (wear, grommets)",
  "Cutaway handle and pocket",
  "Reserve handle and pocket",
  "AAD status (cables, unit)",
  "Reserve packing card up to date",
  "Logbook entry completed",
];

type ItemStatus = "pass" | "fail" | null;

interface CheckItem {
  label: string;
  status: ItemStatus;
  notes: string;
}

interface Props {
  open: boolean;
  rigName: string;
  jumpsSince: number;
  isSubmitting: boolean;
  onSubmit: (data: {
    completedBy: string;
    completedDate: string;
    signatureData: string;
    checklistData: string;
    notes: string;
  }) => void;
}

export default function FiftyJumpCheckModal({
  open,
  rigName,
  jumpsSince,
  isSubmitting,
  onSubmit,
}: Props) {
  const [items, setItems] = useState<CheckItem[]>(
    CHECKLIST_ITEMS.map((label) => ({ label, status: null, notes: "" })),
  );
  const [completedBy, setCompletedBy] = useState("");
  const [completedDate, setCompletedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [signature, setSignature] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");

  const allMarked = items.every((i) => i.status !== null);
  const canSubmit = allMarked && signature && completedBy.trim();

  const setStatus = (idx: number, status: ItemStatus) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, status } : item)),
    );
  };

  const setItemNotes = (idx: number, notes: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, notes } : item)),
    );
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      completedBy: completedBy.trim(),
      completedDate,
      signatureData: signature,
      checklistData: JSON.stringify({
        items: items.map((i) => ({
          label: i.label,
          status: i.status,
          notes: i.notes,
        })),
      }),
      notes: generalNotes,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        /* non-dismissable */
      }}
    >
      <DialogContent
        className="max-w-2xl w-full"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        data-ocid="fiftyjump.dialog"
      >
        {/* No X close button — intentionally non-dismissable */}
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                50-Jump Check Required — {rigName}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {jumpsSince} jumps since last check. Complete all items to
                continue.
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-3">
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={item.label}
                className="rounded-lg border border-border bg-muted/30 p-3"
                data-ocid={`fiftyjump.item.${idx + 1}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-medium text-foreground flex-1 pt-0.5">
                    {item.label}
                  </span>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setStatus(idx, "pass")}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                        item.status === "pass"
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-white text-green-700 border-green-300 hover:bg-green-50"
                      }`}
                      data-ocid={`fiftyjump.checkbox.${idx + 1}`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Pass
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus(idx, "fail")}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                        item.status === "fail"
                          ? "bg-red-600 text-white border-red-600"
                          : "bg-white text-red-700 border-red-300 hover:bg-red-50"
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Fail
                    </button>
                  </div>
                </div>
                {item.status === "fail" && (
                  <Input
                    className="mt-2 text-sm"
                    placeholder="Describe the issue..."
                    value={item.notes}
                    onChange={(e) => setItemNotes(idx, e.target.value)}
                    data-ocid={`fiftyjump.input.${idx + 1}`}
                  />
                )}
              </div>
            ))}

            <div className="border-t border-border pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="completedBy">
                    Completed By (Rigger Name)
                  </Label>
                  <Input
                    id="completedBy"
                    value={completedBy}
                    onChange={(e) => setCompletedBy(e.target.value)}
                    placeholder="Rigger name"
                    data-ocid="fiftyjump.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="completedDate">Date</Label>
                  <Input
                    id="completedDate"
                    type="date"
                    value={completedDate}
                    onChange={(e) => setCompletedDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="Additional observations or notes..."
                  className="resize-none"
                  rows={3}
                  data-ocid="fiftyjump.textarea"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Rigger Signature</Label>
                <div className="border border-border rounded-lg overflow-hidden">
                  <SignaturePad onSave={(url) => setSignature(url)} />
                </div>
                {signature && (
                  <img
                    src={signature}
                    alt="Signature"
                    className="h-10 w-auto border border-border rounded mt-1"
                  />
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {items.filter((i) => i.status !== null).length} / {items.length}{" "}
            items marked
          </p>
          <Button
            disabled={!canSubmit || isSubmitting}
            onClick={handleSubmit}
            style={{ backgroundColor: canSubmit ? "#2E6F9E" : undefined }}
            data-ocid="fiftyjump.submit_button"
          >
            {isSubmitting ? "Submitting..." : "Submit 50-Jump Check"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
