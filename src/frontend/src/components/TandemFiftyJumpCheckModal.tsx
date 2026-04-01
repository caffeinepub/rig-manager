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
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Loader2,
  X,
  XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import SignaturePad from "./SignaturePad";

const SECTIONS = [
  {
    heading: "Drogue/Main",
    items: [
      "Drogue chute handle secure",
      "Drogue chute fabric, mesh and seams intact",
      "Drogue kill line calibrated correctly +-5mm and bridle free of damage (Should be 150mm)",
      "Pin smooth and securely attached to bridle",
      "Disc assembly tight, free of sharp edges, cover in good repair",
      "Top grommet and bag not warped",
      "Stow band loops securely stitched",
      "Bridle attachment point to canopy secure",
      "No fabric damage or broken stitching",
      "Cross port vents not ripped",
      "Stitching on line attachment points and cascades secure",
      "No damage to lines, especially steering lines at cascades and brake locking loops",
      "No damage to slider material",
      "Slider grommets not warped, bent or worn through",
      "Connector links correctly assembled and not worn",
    ],
  },
  {
    heading: "Risers/Toggles",
    items: [
      "No corrosion on any hardware",
      "Stitching and webbing serviceable",
      "Brake line excess keepers serviceable",
      "Toggles securely knotted",
      "Toggle keepers serviceable",
    ],
  },
  {
    heading: "3 Rings Maintenance",
    items: [
      "Disconnect RSL, remove cutaway cables and wipe clean with silicone spray",
      "Flex and massage webbing before reconnecting",
      "3 Rings correctly attached and RSL connected",
      "Cutaway cables correctly routed through the MARD system",
    ],
    requiresSecondSignatory: true,
  },
  {
    heading: "Harness/Container",
    items: [
      "No fabric damage or broken stitching",
      "All flaps are secure, grommets not deformed",
      "Reserve cable swage (ball on end of cable) secure",
      "Emergency handles securely held in place",
      "BOC secure and undamaged",
      "Main closing loop serviceable",
      "Reserve closing loop secure and not frayed",
    ],
  },
];

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
  onClose?: () => void;
  onSubmit: (data: {
    completedBy: string;
    completedDate: string;
    signatureData: string;
    checklistData: string;
    notes: string;
  }) => void;
}

function compressImage(
  file: File,
  maxDim = 1200,
  quality = 0.8,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context unavailable"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function TandemFiftyJumpCheckModal({
  open,
  rigName,
  jumpsSince,
  isSubmitting,
  onClose,
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
  const [noteImages, setNoteImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageFiles = async (files: FileList) => {
    if (!files.length) return;
    setUploadingImages(true);
    const results: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const dataUrl = await compressImage(file);
        results.push(dataUrl);
      } catch {
        // skip failed images silently
      }
    }
    setNoteImages((prev) => [...prev, ...results]);
    setUploadingImages(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    setNoteImages((prev) => prev.filter((_, i) => i !== idx));
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
        noteImages,
      }),
      notes: generalNotes,
    });
  };

  const isPreview = !!onClose;

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val && isPreview && onClose) onClose();
      }}
    >
      <DialogContent
        className="max-w-2xl w-full"
        onPointerDownOutside={(e) => {
          if (!isPreview) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (!isPreview) e.preventDefault();
        }}
        data-ocid="tandem_fiftyjump.dialog"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {isPreview
                  ? `Tandem Main Canopy — 50-Jump Check Preview — ${rigName}`
                  : `Tandem Main Canopy — 50-Jump Check Required — ${rigName}`}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isPreview
                  ? "Preview only — fill in to see how the form works."
                  : `${jumpsSince} jumps since last check. Complete all items to continue.`}
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
                          data-ocid={`tandem_fiftyjump.item.${idx + 1}`}
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
                                data-ocid={`tandem_fiftyjump.checkbox.${idx + 1}`}
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
                              data-ocid={`tandem_fiftyjump.input.${idx + 1}`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

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
                          htmlFor="tandemSecondSignatoryName"
                          className="text-blue-900"
                        >
                          Second Signatory Name
                        </Label>
                        <Input
                          id="tandemSecondSignatoryName"
                          value={secondSignatoryName}
                          onChange={(e) =>
                            setSecondSignatoryName(e.target.value)
                          }
                          placeholder="Name of second signatory"
                          data-ocid="tandem_fiftyjump.second_signatory_name"
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

            <div className="border-t border-border pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="tandemCompletedBy">
                    Performed By (Packer Name)
                  </Label>
                  <Input
                    id="tandemCompletedBy"
                    value={completedBy}
                    onChange={(e) => setCompletedBy(e.target.value)}
                    placeholder="Packer name"
                    data-ocid="tandem_fiftyjump.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tandemCompletedDate">Date</Label>
                  <Input
                    id="tandemCompletedDate"
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
                  data-ocid="tandem_fiftyjump.textarea"
                />
              </div>

              {/* Damage Photos */}
              <div className="space-y-2">
                <Label>Damage Photos (optional)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) handleImageFiles(e.target.files);
                  }}
                  data-ocid="tandem_fiftyjump.upload_button"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border bg-muted/20 hover:bg-muted/40 text-sm text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
                  data-ocid="tandem_fiftyjump.dropzone"
                >
                  {uploadingImages ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  {uploadingImages ? "Processing images..." : "Add Photos"}
                </button>

                {noteImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {noteImages.map((src, idx) => (
                      <div key={src.slice(0, 40)} className="relative group">
                        <img
                          src={src}
                          alt={`Damage ${idx + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          aria-label="Remove photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Packer Signature</Label>
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
          <div className="flex items-center gap-3">
            {isPreview && (
              <Button
                variant="outline"
                onClick={onClose}
                data-ocid="tandem_fiftyjump.close_button"
              >
                Close Preview
              </Button>
            )}
            {!isPreview && (
              <p className="text-xs text-muted-foreground">
                {items.filter((i) => i.status !== null).length} / {items.length}{" "}
                items marked
              </p>
            )}
          </div>
          <Button
            disabled={!canSubmit || isSubmitting}
            onClick={handleSubmit}
            style={{ backgroundColor: canSubmit ? "#2E6F9E" : undefined }}
            data-ocid="tandem_fiftyjump.submit_button"
          >
            {isSubmitting ? "Submitting..." : "Submit 50-Jump Check"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
