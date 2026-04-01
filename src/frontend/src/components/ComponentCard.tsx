import { Button } from "@/components/ui/button";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

interface ComponentCardProps {
  title: string;
  children?: ReactNode;
  exists: boolean;
  onAdd?: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
  actions?: ReactNode;
}

export default function ComponentCard({
  title,
  children,
  exists,
  onAdd,
  onEdit,
  onRemove,
  actions,
}: ComponentCardProps) {
  if (!exists) {
    return (
      <div
        className="bg-white border border-border rounded-xl shadow-sm overflow-hidden"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <div className="p-4">
          <Button
            variant="outline"
            className="w-full border-2 border-dashed border-border rounded-xl p-4 flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            onClick={onAdd}
            data-ocid="component.open_modal_button"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add {title}</span>
          </Button>
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white border border-border rounded-xl shadow-sm overflow-hidden"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <div className="flex gap-2">
          {actions}
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              data-ocid="component.edit_button"
            >
              <Pencil className="w-3.5 h-3.5 mr-1" />
              Edit
            </Button>
          )}
          {onRemove && (
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={onRemove}
              data-ocid="component.delete_button"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Remove
            </Button>
          )}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
