import { Button } from "@/components/ui/button";
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

const SECTIONS = [
  {
    heading: "Main Canopy",
    items: [
      "Pilot chute handle/fabric/seams",
      "Pin smooth and attached to bridle",
      "Kill line/bridle serviceable",
      "Deployment bag material/grommets/rubber band loops serviceable",
      "Bridle/Canopy attachment secure",
      "Canopy fabric and stitching intact",
      "Line attachments, cascades and brake locking loops serviceable",
      "Slider material and grommets serviceable",
      "Soft links correctly assembled and serviceable",
    ],
  },
  {
    heading: "Risers and Toggles",
    items: [
      "All rings free of corrosion",
      "Stitching and webbing serviceable",
      "Brake line excess keepers serviceable",
      "Toggle keepers serviceable",
    ],
  },
  {
    heading: "3 Rings Maintenance",
    items: [
      "Disconnect RSL, remove cutaway and clean cables with silicone spray",
      "Flex and massage webbing",
      "3 Rings correctly attached and RSL connected",
      "Cutaway cable routed through MARD",
    ],
    requiresSecondSignatory: true,
  },
  {
    heading: "Harness and Container",
    items: [
      "Fabric and stitching serviceable",
      "Flaps and grommets, reserve cable and swage secure",
      "Emergency handles secure",
      "BOC secure and undamaged",
      "Main closing loop serviceable",
      "Reserve closing loop secure",
    ],
  },
];

// Flatten items with section metadata for state management
const ALL_ITEMS = SECTIONS.flatMap((s) =>
  s.items.map((label) => ({ label, section: s.heading })),
);

type ItemStatus = "serviceable" | "not_serviceable" | null;

interface CheckItem {
  label: string;
  section: string;
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
    ALL_ITEMS.map((i) => ({ ...i, status: null, notes: "" })),
  );
  const [completedBy, setCompletedBy] = useState("");
  const [completedDate, setCompletedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [signature, setSignature] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  const [secondSignatoryName, setSecondSignatoryName] = useState("");
  const [secondSignature, setSecondSignature] = useState("");

  const allMarked = items.every((i) => i.status !== null);
  const canSubmit =
    allMarked &&
    signature &&
    completedBy.trim() &&
    secondSignatoryName.trim() &&
    secondSignature;

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
        sections: SECTIONS.map((s) => ({
          heading: s.heading,
          items: items
            .filter((i) => i.section === s.heading)
            .map((i) => ({ label: i.label, status: i.status, notes: i.notes })),
        })),
        secondSignatory: {
          name: secondSignatoryName.trim(),
          signatureData: secondSignature,
          confirmedItem: "3 Rings and MARD system reconnected correctly",
        },
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
          <div className="space-y-6">
            {SECTIONS.map((section) => {
              const sectionItems = items.filter(
                (i) => i.section === section.heading,
              );
              return (
                <div key={section.heading}>
                  {/* Section heading */}
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
                      {section.heading}
                    </h3>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <div className="space-y-2">
                    {sectionItems.map((item) => {
                      const idx = items.findIndex(
                        (i) =>
                          i.label === item.label && i.section === item.section,
                      );
                      return (
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
                                onClick={() => setStatus(idx, "serviceable")}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                                  item.status === "serviceable"
                                    ? "bg-green-600 text-white border-green-600"
                                    : "bg-white text-green-700 border-green-300 hover:bg-green-50"
                                }`}
                                data-ocid={`fiftyjump.checkbox.${idx + 1}`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Serviceable
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setStatus(idx, "not_serviceable")
                                }
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                                  item.status === "not_serviceable"
                                    ? "bg-red-600 text-white border-red-600"
                                    : "bg-white text-red-700 border-red-300 hover:bg-red-50"
                                }`}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Not Serviceable
                              </button>
                            </div>
                          </div>
                          {item.status === "not_serviceable" && (
                            <Input
                              className="mt-2 text-sm"
                              placeholder="Describe the issue..."
                              value={item.notes}
                              onChange={(e) =>
                                setItemNotes(idx, e.target.value)
                              }
                              data-ocid={`fiftyjump.input.${idx + 1}`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Second signatory block for 3 Rings section */}
                  {section.requiresSecondSignatory && (
                    <div className="mt-4 rounded-lg border-2 border-blue-300 bg-blue-50 p-4 space-y-3">
                      <p className="text-sm font-semibold text-blue-800">
                        Second Signatory — 3 Rings &amp; MARD Reconnection
                      </p>
                      <p className="text-xs text-blue-700">
                        A second qualified person must confirm the 3 Rings and
                        MARD system has been reconnected correctly.
                      </p>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="secondSignatoryName"
                          className="text-blue-900"
                        >
                          Second Signatory Name
                        </Label>
                        <Input
                          id="secondSignatoryName"
                          value={secondSignatoryName}
                          onChange={(e) =>
                            setSecondSignatoryName(e.target.value)
                          }
                          placeholder="Name of second signatory"
                          data-ocid="fiftyjump.second_signatory_name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-blue-900">
                          Second Signatory Signature
                        </Label>
                        <div className="border border-blue-300 rounded-lg overflow-hidden bg-white">
                          <SignaturePad
                            onSave={(url) => setSecondSignature(url)}
                          />
                        </div>
                        {secondSignature && (
                          <img
                            src={secondSignature}
                            alt="Second Signature"
                            className="h-10 w-auto border border-border rounded mt-1"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Primary signatory & notes */}
            <div className="border-t border-border pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="completedBy">
                    Performed By (Rigger Name)
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
