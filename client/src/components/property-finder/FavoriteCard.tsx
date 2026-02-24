import { formatMoney } from "@/lib/financialEngine";
import type { SavedProspectiveProperty } from "@/lib/api";
import {
  ExternalLink, Bed, Bath, Ruler, Trees,
  MapPin, Loader2, StickyNote, X, Save, Trash2,
} from "lucide-react";

function PropertyTypeLabel(type: string | null): string {
  if (!type) return "";
  const map: Record<string, string> = {
    single_family: "Single Family",
    multi_family: "Multi-Family",
    farm: "Farm / Ranch",
    land: "Land",
  };
  return map[type] || type;
}

export function FavoriteCard({
  property,
  onRemove,
  onUpdateNotes,
  isRemoving,
  editingNotesId,
  notesText,
  onStartEditing,
  onNotesChange,
  onSaveNotes,
  onCancelEditing,
}: {
  property: SavedProspectiveProperty;
  onRemove: (id: number) => void;
  onUpdateNotes: (id: number, notes: string) => void;
  isRemoving: boolean;
  editingNotesId: number | null;
  notesText: string;
  onStartEditing: (prop: SavedProspectiveProperty) => void;
  onNotesChange: (value: string) => void;
  onSaveNotes: (id: number) => void;
  onCancelEditing: () => void;
}) {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
      data-testid={`row-saved-${property.id}`}
    >
      <div className="h-0.5 bg-gradient-to-r from-primary to-primary/30" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span className="text-gray-900 font-medium text-sm leading-snug">{property.address}</span>
          </div>
          <button
            onClick={() => onRemove(property.id)}
            disabled={isRemoving}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
            title="Remove property"
            data-testid={`btn-remove-saved-${property.id}`}
          >
            {isRemoving ? (
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 text-[#F4795B]/70 hover:text-[#F4795B]" />
            )}
          </button>
        </div>

        <p className="text-xl font-bold text-gray-900 mb-3">
          {property.price ? formatMoney(property.price) : "—"}
        </p>

        <div className="flex flex-wrap items-center gap-4 py-2.5 px-3 bg-primary/5 rounded-xl border border-primary/10">
          <div className="flex items-center gap-1.5">
            <Bed className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm text-gray-700">{property.beds ?? "—"} beds</span>
          </div>
          <div className="w-px h-4 bg-primary/20" />
          <div className="flex items-center gap-1.5">
            <Bath className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm text-gray-700">{property.baths ?? "—"} baths</span>
          </div>
          <div className="w-px h-4 bg-primary/20" />
          <div className="flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm text-gray-700">{property.sqft ? property.sqft.toLocaleString() : "—"} sqft</span>
          </div>
          <div className="w-px h-4 bg-primary/20" />
          <div className="flex items-center gap-1.5">
            <Trees className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-semibold text-secondary">{property.lotSizeAcres ?? "—"} acres</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          {property.propertyType ? (
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-secondary border border-primary/20">
              {PropertyTypeLabel(property.propertyType)}
            </span>
          ) : <span />}
          {property.listingUrl && (
            <a
              href={property.listingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:text-secondary flex items-center gap-1"
              data-testid={`link-saved-listing-${property.id}`}
            >
              View Listing <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Saved {new Date(property.savedAt).toLocaleDateString()}</span>
          </div>
          {editingNotesId === property.id ? (
            <div className="flex items-center gap-2">
              <input
                value={notesText}
                onChange={(e) => onNotesChange(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                placeholder="Add notes..."
                data-testid={`input-notes-${property.id}`}
                onKeyDown={(e) => e.key === "Enter" && onSaveNotes(property.id)}
              />
              <button
                onClick={() => onSaveNotes(property.id)}
                className="p-1.5 rounded-lg hover:bg-primary/10 text-primary"
                data-testid={`btn-save-notes-${property.id}`}
              >
                <Save className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onCancelEditing}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onStartEditing(property)}
              className="text-xs text-gray-400 hover:text-gray-600 truncate block w-full text-left"
              title={property.notes || "Click to add notes"}
              data-testid={`btn-edit-notes-${property.id}`}
            >
              <StickyNote className="w-3 h-3 inline mr-1" />
              {property.notes || <span className="italic">Add notes...</span>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
