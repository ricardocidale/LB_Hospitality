import { useState } from "react";
import Layout from "@/components/Layout";
import { useGlobalAssumptions } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { GlassButton } from "@/components/ui/glass-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/financialEngine";
import {
  usePropertySearch,
  useProspectiveFavorites,
  useSaveFavorite,
  useDeleteFavorite,
  useUpdateFavoriteNotes,
  useSavedSearches,
  useCreateSavedSearch,
  useDeleteSavedSearch,
  type PropertyFinderSearchParams,
  type PropertyFinderResult,
  type SavedProspectiveProperty,
  type SavedSearchData,
} from "@/lib/api";
import {
  Search, Heart, HeartOff, ExternalLink, Bed, Bath, Ruler, Trees,
  MapPin, Loader2, AlertCircle, Building2, StickyNote, X, ChevronLeft, ChevronRight,
  Bookmark, BookmarkX, Play, Save, Trash2, Image,
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

function PropertyResultsTable({
  results,
  savedExternalIds,
  favorites,
  onSave,
  onRemove,
  isSaving,
}: {
  results: PropertyFinderResult[];
  savedExternalIds: Set<string>;
  favorites: SavedProspectiveProperty[];
  onSave: (property: PropertyFinderResult) => void;
  onRemove: (id: number) => void;
  isSaving: boolean;
}) {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  return (
    <div className="relative rounded-2xl overflow-hidden" data-testid="table-search-results">
      <div className="absolute inset-0 bg-gradient-to-br from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e] rounded-2xl" />
      <div className="absolute inset-0 bg-white/[0.03] rounded-2xl" />
      <div className="absolute inset-0 rounded-2xl border border-white/10" />
      <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative max-h-[560px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#2d4a5e]/95 backdrop-blur-sm border-b border-white/10">
              <th className="text-left text-white/50 text-xs font-medium px-4 py-3 w-10"></th>
              <th className="text-left text-white/50 text-xs font-medium px-4 py-3">Property</th>
              <th className="text-right text-white/50 text-xs font-medium px-4 py-3">Price</th>
              <th className="text-center text-white/50 text-xs font-medium px-4 py-3">Beds</th>
              <th className="text-center text-white/50 text-xs font-medium px-4 py-3">Baths</th>
              <th className="text-right text-white/50 text-xs font-medium px-4 py-3">Sq Ft</th>
              <th className="text-right text-white/50 text-xs font-medium px-4 py-3">Lot (Acres)</th>
              <th className="text-center text-white/50 text-xs font-medium px-4 py-3">Type</th>
              <th className="text-center text-white/50 text-xs font-medium px-4 py-3 w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {results.map((property, idx) => {
              const isSaved = savedExternalIds.has(property.externalId);
              const savedProp = favorites.find((f) => f.externalId === property.externalId);
              return (
                <tr
                  key={property.externalId}
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${idx % 2 === 0 ? "bg-white/[0.02]" : ""}`}
                  data-testid={`row-property-${property.externalId}`}
                >
                  <td className="px-4 py-3">
                    {property.imageUrl ? (
                      <button
                        onClick={() => setExpandedImage(expandedImage === property.externalId ? null : property.externalId)}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                        data-testid={`btn-image-${property.externalId}`}
                      >
                        <Image className="w-4 h-4 text-[#9FBCA4]" />
                      </button>
                    ) : (
                      <Building2 className="w-4 h-4 text-white/20" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#9FBCA4] mt-0.5 flex-shrink-0" />
                        <span className="text-white/90 text-sm leading-snug" data-testid={`text-address-${property.externalId}`}>
                          {property.address}
                        </span>
                      </div>
                      {expandedImage === property.externalId && property.imageUrl && (
                        <div className="mt-2 rounded-lg overflow-hidden max-w-[200px]">
                          <img
                            src={property.imageUrl}
                            alt={property.address}
                            className="w-full h-auto rounded-lg"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-[#FFF9F5] font-semibold" data-testid={`text-price-${property.externalId}`}>
                      {property.price ? formatMoney(property.price) : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-white/70" data-testid={`text-beds-${property.externalId}`}>
                    {property.beds ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-white/70" data-testid={`text-baths-${property.externalId}`}>
                    {property.baths ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-white/70" data-testid={`text-sqft-${property.externalId}`}>
                    {property.sqft ? property.sqft.toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right" data-testid={`text-acres-${property.externalId}`}>
                    {property.lotSizeAcres ? (
                      <span className="text-[#9FBCA4] font-medium">{property.lotSizeAcres}</span>
                    ) : (
                      <span className="text-white/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {property.propertyType ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/50 border border-white/10">
                        {PropertyTypeLabel(property.propertyType)}
                      </span>
                    ) : (
                      <span className="text-white/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={isSaved && savedProp ? () => onRemove(savedProp.id) : () => onSave(property)}
                        disabled={isSaving}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        title={isSaved ? "Remove from saved" : "Save property"}
                        data-testid={`btn-favorite-${property.externalId}`}
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        ) : isSaved ? (
                          <Heart className="w-4 h-4 text-[#F4795B] fill-[#F4795B]" />
                        ) : (
                          <Heart className="w-4 h-4 text-white/40 hover:text-[#F4795B]" />
                        )}
                      </button>
                      {property.listingUrl && (
                        <a
                          href={property.listingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                          title="View listing"
                          data-testid={`link-listing-${property.externalId}`}
                        >
                          <ExternalLink className="w-4 h-4 text-[#9FBCA4]" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SavedPropertiesTable({
  favorites,
  onRemove,
  onUpdateNotes,
  isRemoving,
}: {
  favorites: SavedProspectiveProperty[];
  onRemove: (id: number) => void;
  onUpdateNotes: (id: number, notes: string) => void;
  isRemoving: boolean;
}) {
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [notesText, setNotesText] = useState("");

  const startEditing = (prop: SavedProspectiveProperty) => {
    setEditingNotesId(prop.id);
    setNotesText(prop.notes || "");
  };

  const saveNotes = (id: number) => {
    onUpdateNotes(id, notesText);
    setEditingNotesId(null);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden" data-testid="table-saved-properties">
      <div className="absolute inset-0 bg-gradient-to-br from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e] rounded-2xl" />
      <div className="absolute inset-0 bg-white/[0.03] rounded-2xl" />
      <div className="absolute inset-0 rounded-2xl border border-white/10" />
      <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative max-h-[560px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#2d4a5e]/95 backdrop-blur-sm border-b border-white/10">
              <th className="text-left text-white/50 text-xs font-medium px-4 py-3">Property</th>
              <th className="text-right text-white/50 text-xs font-medium px-4 py-3">Price</th>
              <th className="text-center text-white/50 text-xs font-medium px-4 py-3">Beds</th>
              <th className="text-center text-white/50 text-xs font-medium px-4 py-3">Baths</th>
              <th className="text-right text-white/50 text-xs font-medium px-4 py-3">Sq Ft</th>
              <th className="text-right text-white/50 text-xs font-medium px-4 py-3">Lot (Acres)</th>
              <th className="text-left text-white/50 text-xs font-medium px-4 py-3">Notes</th>
              <th className="text-center text-white/50 text-xs font-medium px-4 py-3">Saved</th>
              <th className="text-center text-white/50 text-xs font-medium px-4 py-3 w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {favorites.map((property, idx) => (
              <tr
                key={property.id}
                className={`border-b border-white/5 hover:bg-white/5 transition-colors ${idx % 2 === 0 ? "bg-white/[0.02]" : ""}`}
                data-testid={`row-saved-${property.id}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#9FBCA4] mt-0.5 flex-shrink-0" />
                    <span className="text-white/90 text-sm leading-snug">{property.address}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-[#FFF9F5] font-semibold">
                    {property.price ? formatMoney(property.price) : "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-white/70">{property.beds ?? "—"}</td>
                <td className="px-4 py-3 text-center text-white/70">{property.baths ?? "—"}</td>
                <td className="px-4 py-3 text-right text-white/70">
                  {property.sqft ? property.sqft.toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {property.lotSizeAcres ? (
                    <span className="text-[#9FBCA4] font-medium">{property.lotSizeAcres}</span>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </td>
                <td className="px-4 py-3 max-w-[200px]">
                  {editingNotesId === property.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        value={notesText}
                        onChange={(e) => setNotesText(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-white/10 border border-white/15 text-white/90 text-xs focus:outline-none focus:border-[#9FBCA4]/40"
                        placeholder="Add notes..."
                        data-testid={`input-notes-${property.id}`}
                        onKeyDown={(e) => e.key === "Enter" && saveNotes(property.id)}
                      />
                      <button
                        onClick={() => saveNotes(property.id)}
                        className="p-1 rounded hover:bg-white/10 text-[#9FBCA4]"
                        data-testid={`btn-save-notes-${property.id}`}
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingNotesId(null)}
                        className="p-1 rounded hover:bg-white/10 text-white/40"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditing(property)}
                      className="text-xs text-white/40 hover:text-white/70 truncate block w-full text-left"
                      title={property.notes || "Click to add notes"}
                      data-testid={`btn-edit-notes-${property.id}`}
                    >
                      {property.notes || <span className="italic">Add notes...</span>}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-white/40 text-xs">
                  {new Date(property.savedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {property.listingUrl && (
                      <a
                        href={property.listingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        title="View listing"
                        data-testid={`link-saved-listing-${property.id}`}
                      >
                        <ExternalLink className="w-4 h-4 text-[#9FBCA4]" />
                      </a>
                    )}
                    <button
                      onClick={() => onRemove(property.id)}
                      disabled={isRemoving}
                      className="p-1.5 rounded-lg hover:bg-red-900/30 transition-colors"
                      title="Remove property"
                      data-testid={`btn-remove-saved-${property.id}`}
                    >
                      {isRemoving ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-[#F4795B]/70 hover:text-[#F4795B]" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PropertyFinder() {
  const { data: global } = useGlobalAssumptions();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"search" | "savedSearches" | "saved">("search");
  const [searchParams, setSearchParams] = useState<PropertyFinderSearchParams | null>(null);
  const [formData, setFormData] = useState({
    location: "",
    priceMin: "",
    priceMax: "",
    bedsMin: "",
    lotSizeMin: "1",
    propertyType: "any",
  });
  const [saveSearchName, setSaveSearchName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const { data: searchData, isLoading: isSearching, error: searchError } = usePropertySearch(searchParams);
  const { data: favorites = [], isLoading: isFavoritesLoading } = useProspectiveFavorites();
  const { data: savedSearches = [], isLoading: isSavedSearchesLoading } = useSavedSearches();
  const saveFavorite = useSaveFavorite();
  const deleteFavorite = useDeleteFavorite();
  const updateNotes = useUpdateFavoriteNotes();
  const createSavedSearch = useCreateSavedSearch();
  const deleteSavedSearch = useDeleteSavedSearch();

  const savedExternalIds = new Set(favorites.map((f) => f.externalId));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location.trim()) {
      toast({ title: "Location required", description: "Enter a city, state or zip code to search.", variant: "destructive" });
      return;
    }
    setSearchParams({
      location: formData.location.trim(),
      priceMin: formData.priceMin || undefined,
      priceMax: formData.priceMax || undefined,
      bedsMin: formData.bedsMin || undefined,
      lotSizeMin: formData.lotSizeMin || undefined,
      propertyType: formData.propertyType !== "any" ? formData.propertyType : undefined,
    });
  };

  const handlePageChange = (newOffset: number) => {
    if (searchParams) {
      setSearchParams({ ...searchParams, offset: String(newOffset) });
    }
  };

  const handleSave = (property: PropertyFinderResult) => {
    saveFavorite.mutate(property, {
      onSuccess: () => toast({ title: "Saved", description: "Property added to your saved list." }),
      onError: () => toast({ title: "Error", description: "Failed to save property.", variant: "destructive" }),
    });
  };

  const handleRemove = (id: number) => {
    deleteFavorite.mutate(id, {
      onSuccess: () => toast({ title: "Removed", description: "Property removed from saved list." }),
      onError: () => toast({ title: "Error", description: "Failed to remove property.", variant: "destructive" }),
    });
  };

  const handleUpdateNotes = (id: number, notes: string) => {
    updateNotes.mutate({ id, notes }, {
      onSuccess: () => toast({ title: "Notes saved" }),
      onError: () => toast({ title: "Error", description: "Failed to save notes.", variant: "destructive" }),
    });
  };

  const handleSaveSearch = () => {
    if (!saveSearchName.trim()) {
      toast({ title: "Name required", description: "Give your search a name to save it.", variant: "destructive" });
      return;
    }
    if (!formData.location.trim()) {
      toast({ title: "Location required", description: "Enter a location before saving the search.", variant: "destructive" });
      return;
    }
    createSavedSearch.mutate({
      name: saveSearchName.trim(),
      location: formData.location.trim(),
      priceMin: formData.priceMin || undefined,
      priceMax: formData.priceMax || undefined,
      bedsMin: formData.bedsMin || undefined,
      lotSizeMin: formData.lotSizeMin || undefined,
      propertyType: formData.propertyType !== "any" ? formData.propertyType : undefined,
    }, {
      onSuccess: () => {
        toast({ title: "Search saved", description: `"${saveSearchName}" has been saved.` });
        setSaveSearchName("");
        setShowSaveDialog(false);
      },
      onError: () => toast({ title: "Error", description: "Failed to save search.", variant: "destructive" }),
    });
  };

  const handleLoadSearch = (search: SavedSearchData) => {
    setFormData({
      location: search.location,
      priceMin: search.priceMin || "",
      priceMax: search.priceMax || "",
      bedsMin: search.bedsMin || "",
      lotSizeMin: search.lotSizeMin || "1",
      propertyType: search.propertyType || "any",
    });
    setSearchParams({
      location: search.location,
      priceMin: search.priceMin || undefined,
      priceMax: search.priceMax || undefined,
      bedsMin: search.bedsMin || undefined,
      lotSizeMin: search.lotSizeMin || undefined,
      propertyType: search.propertyType || undefined,
    });
    setActiveTab("search");
    toast({ title: "Search loaded", description: `Running "${search.name}" search...` });
  };

  const handleDeleteSearch = (id: number) => {
    deleteSavedSearch.mutate(id, {
      onSuccess: () => toast({ title: "Deleted", description: "Saved search removed." }),
      onError: () => toast({ title: "Error", description: "Failed to delete search.", variant: "destructive" }),
    });
  };

  const isNoApiKey = searchError?.message?.includes("RapidAPI key not configured");

  return (
    <Layout>
      <div className="p-4 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
        <PageHeader
          title="Property Finder"
          subtitle="Search for large homes and B&Bs with conversion potential"
        />

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === "search"
                ? "bg-[#9FBCA4]/20 text-[#9FBCA4] border border-[#9FBCA4]/30"
                : "text-gray-500 hover:text-gray-700 border border-transparent"
            }`}
            data-testid="tab-search"
          >
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4" /> Search
            </span>
          </button>
          <button
            onClick={() => setActiveTab("savedSearches")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === "savedSearches"
                ? "bg-[#9FBCA4]/20 text-[#9FBCA4] border border-[#9FBCA4]/30"
                : "text-gray-500 hover:text-gray-700 border border-transparent"
            }`}
            data-testid="tab-saved-searches"
          >
            <span className="flex items-center gap-2">
              <Bookmark className="w-4 h-4" /> Saved Searches ({savedSearches.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === "saved"
                ? "bg-[#9FBCA4]/20 text-[#9FBCA4] border border-[#9FBCA4]/30"
                : "text-gray-500 hover:text-gray-700 border border-transparent"
            }`}
            data-testid="tab-saved"
          >
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4" /> Saved Properties ({favorites.length})
            </span>
          </button>
        </div>

        {activeTab === "search" && (
          <div className="space-y-6">
            <form onSubmit={handleSearch} data-testid="form-search">
              <div className="relative rounded-2xl p-5">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e] rounded-2xl" />
                <div className="absolute inset-0 bg-white/[0.03] rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl border border-white/10" />
                <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <div className="relative space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-2">
                      <Label className="text-white/70 text-xs mb-1 block">Location (City, State or Zip)</Label>
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g. Hudson, NY or 12534"
                        className="bg-white/10 border-white/15 text-white placeholder-white/30 focus:border-[#9FBCA4]/40"
                        data-testid="input-location"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70 text-xs mb-1 block">Min Price</Label>
                      <Input
                        type="number"
                        value={formData.priceMin}
                        onChange={(e) => setFormData({ ...formData, priceMin: e.target.value })}
                        placeholder="$500,000"
                        className="bg-white/10 border-white/15 text-white placeholder-white/30 focus:border-[#9FBCA4]/40"
                        data-testid="input-price-min"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70 text-xs mb-1 block">Max Price</Label>
                      <Input
                        type="number"
                        value={formData.priceMax}
                        onChange={(e) => setFormData({ ...formData, priceMax: e.target.value })}
                        placeholder="$5,000,000"
                        className="bg-white/10 border-white/15 text-white placeholder-white/30 focus:border-[#9FBCA4]/40"
                        data-testid="input-price-max"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-white/70 text-xs mb-1 block">Min Bedrooms</Label>
                      <Input
                        type="number"
                        value={formData.bedsMin}
                        onChange={(e) => setFormData({ ...formData, bedsMin: e.target.value })}
                        placeholder="5+"
                        className="bg-white/10 border-white/15 text-white placeholder-white/30 focus:border-[#9FBCA4]/40"
                        data-testid="input-beds-min"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70 text-xs mb-1 block">Min Lot Size (acres)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={formData.lotSizeMin}
                        onChange={(e) => setFormData({ ...formData, lotSizeMin: e.target.value })}
                        placeholder="1"
                        className="bg-white/10 border-white/15 text-white placeholder-white/30 focus:border-[#9FBCA4]/40"
                        data-testid="input-lot-size-min"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70 text-xs mb-1 block">Property Type</Label>
                      <Select
                        value={formData.propertyType}
                        onValueChange={(v) => setFormData({ ...formData, propertyType: v })}
                      >
                        <SelectTrigger
                          className="bg-white/10 border-white/15 text-white focus:border-[#9FBCA4]/40"
                          data-testid="select-property-type"
                        >
                          <SelectValue placeholder="Any type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any Type</SelectItem>
                          <SelectItem value="single_family">Single Family</SelectItem>
                          <SelectItem value="multi_family">Multi-Family</SelectItem>
                          <SelectItem value="farm">Farm / Ranch</SelectItem>
                          <SelectItem value="land">Land</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {formData.location.trim() && (
                        <>
                          {showSaveDialog ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={saveSearchName}
                                onChange={(e) => setSaveSearchName(e.target.value)}
                                placeholder="Search name..."
                                className="bg-white/10 border-white/15 text-white placeholder-white/30 focus:border-[#9FBCA4]/40 w-48 h-9 text-sm"
                                data-testid="input-search-name"
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSaveSearch())}
                              />
                              <GlassButton
                                variant="primary"
                                size="sm"
                                type="button"
                                onClick={handleSaveSearch}
                                disabled={createSavedSearch.isPending}
                                data-testid="btn-confirm-save-search"
                              >
                                {createSavedSearch.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              </GlassButton>
                              <button
                                type="button"
                                onClick={() => { setShowSaveDialog(false); setSaveSearchName(""); }}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowSaveDialog(true)}
                              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-[#9FBCA4] transition-colors"
                              data-testid="btn-save-search"
                            >
                              <Bookmark className="w-3.5 h-3.5" /> Save This Search
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    <GlassButton
                      variant="primary"
                      type="submit"
                      disabled={isSearching}
                      data-testid="btn-search"
                    >
                      {isSearching ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</>
                      ) : (
                        <><Search className="w-4 h-4" /> Search Properties</>
                      )}
                    </GlassButton>
                  </div>
                </div>
              </div>
            </form>

            {isNoApiKey && (
              <div className="relative rounded-2xl p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e] rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl border border-[#F4795B]/30" />
                <div className="relative flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-[#F4795B] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-[#FFF9F5] font-semibold mb-1">API Key Required</h3>
                    <p className="text-white/70 text-sm mb-3">
                      To search real estate listings, you need a free RapidAPI key. Sign up at{" "}
                      <a href="https://rapidapi.com/apidojo/api/realty-in-us" target="_blank" rel="noopener noreferrer" className="text-[#9FBCA4] underline">
                        rapidapi.com
                      </a>
                      , subscribe to the "Realty in US" API (free tier: 100 requests/month), then add your key as <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">RAPIDAPI_KEY</code> in the Secrets tab.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {searchError && !isNoApiKey && (
              <div className="relative rounded-2xl p-4">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e] rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl border border-[#F4795B]/30" />
                <div className="relative flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-[#F4795B]" />
                  <p className="text-white/80 text-sm">{searchError.message}</p>
                </div>
              </div>
            )}

            {searchData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {searchData.total.toLocaleString()} properties found
                  </p>
                  {searchData.total > 20 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(Math.max(0, searchData.offset - 20))}
                        disabled={searchData.offset === 0}
                        className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-30 hover:bg-gray-100 transition-colors"
                        data-testid="btn-prev-page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-gray-500">
                        {searchData.offset + 1}-{Math.min(searchData.offset + 20, searchData.total)} of {searchData.total.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handlePageChange(searchData.offset + 20)}
                        disabled={searchData.offset + 20 >= searchData.total}
                        className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-30 hover:bg-gray-100 transition-colors"
                        data-testid="btn-next-page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {searchData.results.length === 0 ? (
                  <div className="relative rounded-2xl p-12 text-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e] rounded-2xl" />
                    <div className="absolute inset-0 rounded-2xl border border-white/10" />
                    <div className="relative space-y-3">
                      <Building2 className="w-12 h-12 text-white/20 mx-auto" />
                      <p className="text-white/50">No properties found matching your criteria.</p>
                      <p className="text-white/30 text-sm">Try adjusting your filters or searching a different location.</p>
                    </div>
                  </div>
                ) : (
                  <PropertyResultsTable
                    results={searchData.results}
                    savedExternalIds={savedExternalIds}
                    favorites={favorites}
                    onSave={handleSave}
                    onRemove={handleRemove}
                    isSaving={saveFavorite.isPending || deleteFavorite.isPending}
                  />
                )}
              </div>
            )}

            {!searchData && !searchError && !isSearching && (
              <div className="relative rounded-2xl p-16 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e] rounded-2xl opacity-50" />
                <div className="absolute inset-0 rounded-2xl border border-white/5" />
                <div className="relative space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#9FBCA4]/10 flex items-center justify-center mx-auto">
                    <Search className="w-8 h-8 text-[#9FBCA4]/40" />
                  </div>
                  <div>
                    <p className="text-gray-400 font-medium">Search for Properties</p>
                    <p className="text-gray-500 text-sm mt-1">
                      Enter a location above to find large homes and estates with {(global?.propertyLabel || "boutique hotel").toLowerCase()} conversion potential.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "savedSearches" && (
          <div className="space-y-4">
            {isSavedSearchesLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[#9FBCA4]" />
              </div>
            ) : savedSearches.length === 0 ? (
              <div className="relative rounded-2xl p-16 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e] rounded-2xl opacity-50" />
                <div className="absolute inset-0 rounded-2xl border border-white/5" />
                <div className="relative space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#9FBCA4]/10 flex items-center justify-center mx-auto">
                    <Bookmark className="w-8 h-8 text-[#9FBCA4]/40" />
                  </div>
                  <div>
                    <p className="text-gray-400 font-medium">No Saved Searches</p>
                    <p className="text-gray-500 text-sm mt-1">
                      Save a search from the Search tab to quickly re-run it later.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden" data-testid="table-saved-searches">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e] rounded-2xl" />
                <div className="absolute inset-0 bg-white/[0.03] rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl border border-white/10" />
                <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <div className="relative max-h-[560px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-[#2d4a5e]/95 backdrop-blur-sm border-b border-white/10">
                        <th className="text-left text-white/50 text-xs font-medium px-4 py-3">Name</th>
                        <th className="text-left text-white/50 text-xs font-medium px-4 py-3">Location</th>
                        <th className="text-right text-white/50 text-xs font-medium px-4 py-3">Price Range</th>
                        <th className="text-center text-white/50 text-xs font-medium px-4 py-3">Min Beds</th>
                        <th className="text-right text-white/50 text-xs font-medium px-4 py-3">Min Lot (Acres)</th>
                        <th className="text-center text-white/50 text-xs font-medium px-4 py-3">Type</th>
                        <th className="text-center text-white/50 text-xs font-medium px-4 py-3">Saved</th>
                        <th className="text-center text-white/50 text-xs font-medium px-4 py-3 w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedSearches.map((search, idx) => (
                        <tr
                          key={search.id}
                          className={`border-b border-white/5 hover:bg-white/5 transition-colors ${idx % 2 === 0 ? "bg-white/[0.02]" : ""}`}
                          data-testid={`row-saved-search-${search.id}`}
                        >
                          <td className="px-4 py-3">
                            <span className="text-white/90 font-medium">{search.name}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#9FBCA4] flex-shrink-0" />
                              <span className="text-white/70">{search.location}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-white/70">
                            {search.priceMin || search.priceMax ? (
                              <>
                                {search.priceMin ? `$${Number(search.priceMin).toLocaleString()}` : "Any"}
                                {" — "}
                                {search.priceMax ? `$${Number(search.priceMax).toLocaleString()}` : "Any"}
                              </>
                            ) : (
                              <span className="text-white/30">Any</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-white/70">
                            {search.bedsMin || <span className="text-white/30">Any</span>}
                          </td>
                          <td className="px-4 py-3 text-right text-white/70">
                            {search.lotSizeMin ? (
                              <span className="text-[#9FBCA4]">{search.lotSizeMin}</span>
                            ) : (
                              <span className="text-white/30">Any</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {search.propertyType ? (
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/50 border border-white/10">
                                {PropertyTypeLabel(search.propertyType)}
                              </span>
                            ) : (
                              <span className="text-white/30">Any</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-white/40 text-xs">
                            {new Date(search.savedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <GlassButton
                                variant="primary"
                                size="sm"
                                onClick={() => handleLoadSearch(search)}
                                data-testid={`btn-run-search-${search.id}`}
                              >
                                <Play className="w-3.5 h-3.5" /> Run
                              </GlassButton>
                              <button
                                onClick={() => handleDeleteSearch(search.id)}
                                disabled={deleteSavedSearch.isPending}
                                className="p-1.5 rounded-lg hover:bg-red-900/30 transition-colors"
                                title="Delete search"
                                data-testid={`btn-delete-search-${search.id}`}
                              >
                                {deleteSavedSearch.isPending ? (
                                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4 text-[#F4795B]/70 hover:text-[#F4795B]" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "saved" && (
          <div className="space-y-4">
            {isFavoritesLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[#9FBCA4]" />
              </div>
            ) : favorites.length === 0 ? (
              <div className="relative rounded-2xl p-16 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e] rounded-2xl opacity-50" />
                <div className="absolute inset-0 rounded-2xl border border-white/5" />
                <div className="relative space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#9FBCA4]/10 flex items-center justify-center mx-auto">
                    <Heart className="w-8 h-8 text-[#9FBCA4]/40" />
                  </div>
                  <div>
                    <p className="text-gray-400 font-medium">No Saved Properties</p>
                    <p className="text-gray-500 text-sm mt-1">
                      Search for properties and click the heart icon to save them here for later review.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <SavedPropertiesTable
                favorites={favorites}
                onRemove={handleRemove}
                onUpdateNotes={handleUpdateNotes}
                isRemoving={deleteFavorite.isPending}
              />
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
