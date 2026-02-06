import { useState } from "react";
import Layout from "@/components/Layout";
import { useGlobalAssumptions } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
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

function PropertyCard({
  property,
  isSaved,
  isSaving,
  onToggleFavorite,
  expandedImage,
  onToggleImage,
}: {
  property: PropertyFinderResult;
  isSaved: boolean;
  isSaving: boolean;
  onToggleFavorite: () => void;
  expandedImage: string | null;
  onToggleImage: (id: string) => void;
}) {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
      data-testid={`row-property-${property.externalId}`}
    >
      <div className="h-0.5 bg-gradient-to-r from-[#9FBCA4] to-[#9FBCA4]/30" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-[#9FBCA4] mt-0.5 flex-shrink-0" />
            <span className="text-gray-900 font-medium text-sm leading-snug" data-testid={`text-address-${property.externalId}`}>
              {property.address}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {property.imageUrl && (
              <button
                onClick={() => onToggleImage(property.externalId)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                data-testid={`btn-image-${property.externalId}`}
              >
                <Image className="w-4 h-4 text-[#9FBCA4]" />
              </button>
            )}
            <button
              onClick={onToggleFavorite}
              disabled={isSaving}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title={isSaved ? "Remove from saved" : "Save property"}
              data-testid={`btn-favorite-${property.externalId}`}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              ) : isSaved ? (
                <Heart className="w-4 h-4 text-[#F4795B] fill-[#F4795B]" />
              ) : (
                <Heart className="w-4 h-4 text-gray-300 hover:text-[#F4795B]" />
              )}
            </button>
          </div>
        </div>

        {expandedImage === property.externalId && property.imageUrl && (
          <div className="mb-3 rounded-xl overflow-hidden">
            <img
              src={property.imageUrl}
              alt={property.address}
              className="w-full h-auto rounded-xl"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}

        <p className="text-xl font-bold text-gray-900 mb-3" data-testid={`text-price-${property.externalId}`}>
          {property.price ? formatMoney(property.price) : "—"}
        </p>

        <div className="flex flex-wrap items-center gap-4 py-2.5 px-3 bg-[#9FBCA4]/5 rounded-xl border border-[#9FBCA4]/10">
          <div className="flex items-center gap-1.5">
            <Bed className="w-3.5 h-3.5 text-[#9FBCA4]" />
            <span className="text-sm text-gray-700" data-testid={`text-beds-${property.externalId}`}>{property.beds ?? "—"} beds</span>
          </div>
          <div className="w-px h-4 bg-[#9FBCA4]/20" />
          <div className="flex items-center gap-1.5">
            <Bath className="w-3.5 h-3.5 text-[#9FBCA4]" />
            <span className="text-sm text-gray-700" data-testid={`text-baths-${property.externalId}`}>{property.baths ?? "—"} baths</span>
          </div>
          <div className="w-px h-4 bg-[#9FBCA4]/20" />
          <div className="flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5 text-[#9FBCA4]" />
            <span className="text-sm text-gray-700" data-testid={`text-sqft-${property.externalId}`}>{property.sqft ? property.sqft.toLocaleString() : "—"} sqft</span>
          </div>
          <div className="w-px h-4 bg-[#9FBCA4]/20" />
          <div className="flex items-center gap-1.5">
            <Trees className="w-3.5 h-3.5 text-[#9FBCA4]" />
            <span className="text-sm font-semibold text-[#257D41]" data-testid={`text-acres-${property.externalId}`}>{property.lotSizeAcres ?? "—"} acres</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          {property.propertyType ? (
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#9FBCA4]/10 text-[#257D41] border border-[#9FBCA4]/20">
              {PropertyTypeLabel(property.propertyType)}
            </span>
          ) : <span />}
          {property.listingUrl && (
            <a
              href={property.listingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#9FBCA4] hover:text-[#257D41] flex items-center gap-1"
              data-testid={`link-listing-${property.externalId}`}
            >
              View Listing <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function FavoriteCard({
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
      <div className="h-0.5 bg-gradient-to-r from-[#9FBCA4] to-[#9FBCA4]/30" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-[#9FBCA4] mt-0.5 flex-shrink-0" />
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

        <div className="flex flex-wrap items-center gap-4 py-2.5 px-3 bg-[#9FBCA4]/5 rounded-xl border border-[#9FBCA4]/10">
          <div className="flex items-center gap-1.5">
            <Bed className="w-3.5 h-3.5 text-[#9FBCA4]" />
            <span className="text-sm text-gray-700">{property.beds ?? "—"} beds</span>
          </div>
          <div className="w-px h-4 bg-[#9FBCA4]/20" />
          <div className="flex items-center gap-1.5">
            <Bath className="w-3.5 h-3.5 text-[#9FBCA4]" />
            <span className="text-sm text-gray-700">{property.baths ?? "—"} baths</span>
          </div>
          <div className="w-px h-4 bg-[#9FBCA4]/20" />
          <div className="flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5 text-[#9FBCA4]" />
            <span className="text-sm text-gray-700">{property.sqft ? property.sqft.toLocaleString() : "—"} sqft</span>
          </div>
          <div className="w-px h-4 bg-[#9FBCA4]/20" />
          <div className="flex items-center gap-1.5">
            <Trees className="w-3.5 h-3.5 text-[#9FBCA4]" />
            <span className="text-sm font-semibold text-[#257D41]">{property.lotSizeAcres ?? "—"} acres</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          {property.propertyType ? (
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#9FBCA4]/10 text-[#257D41] border border-[#9FBCA4]/20">
              {PropertyTypeLabel(property.propertyType)}
            </span>
          ) : <span />}
          {property.listingUrl && (
            <a
              href={property.listingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#9FBCA4] hover:text-[#257D41] flex items-center gap-1"
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
                className="flex-1 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-[#9FBCA4] focus:ring-1 focus:ring-[#9FBCA4]/20"
                placeholder="Add notes..."
                data-testid={`input-notes-${property.id}`}
                onKeyDown={(e) => e.key === "Enter" && onSaveNotes(property.id)}
              />
              <button
                onClick={() => onSaveNotes(property.id)}
                className="p-1.5 rounded-lg hover:bg-[#9FBCA4]/10 text-[#9FBCA4]"
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
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [notesText, setNotesText] = useState("");

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

  const startEditing = (prop: SavedProspectiveProperty) => {
    setEditingNotesId(prop.id);
    setNotesText(prop.notes || "");
  };

  const saveNotes = (id: number) => {
    handleUpdateNotes(id, notesText);
    setEditingNotesId(null);
  };

  const isNoApiKey = searchError?.message?.includes("RapidAPI key not configured");

  return (
    <Layout>
      <div className="p-4 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
        <PageHeader
          title="Property Finder"
          subtitle="Discover estates and grand homes with timeless conversion potential"
          variant="light"
        />

        {savedSearches.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" data-testid="table-saved-searches">
            <span className="text-xs text-gray-400 mr-1">
              <Bookmark className="w-3.5 h-3.5 inline mr-1" />
              Saved:
            </span>
            {savedSearches.map((search) => (
              <div
                key={search.id}
                className="inline-flex items-center gap-1.5 bg-[#9FBCA4]/10 text-[#257D41] border border-[#9FBCA4]/20 rounded-full px-3 py-1.5 text-xs font-medium"
                data-testid={`row-saved-search-${search.id}`}
              >
                <button
                  onClick={() => handleLoadSearch(search)}
                  className="hover:underline"
                  data-testid={`btn-run-search-${search.id}`}
                >
                  {search.name}
                </button>
                <button
                  onClick={() => handleDeleteSearch(search.id)}
                  disabled={deleteSavedSearch.isPending}
                  className="p-0.5 rounded-full hover:bg-[#9FBCA4]/20 transition-colors"
                  title="Delete search"
                  data-testid={`btn-delete-search-${search.id}`}
                >
                  {deleteSavedSearch.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSearch} data-testid="form-search">
          <div className="bg-white rounded-2xl shadow-sm border border-[#9FBCA4]/20 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#9FBCA4] via-[#7aaa8a] to-[#9FBCA4]" />
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <Label className="text-gray-700 font-medium text-xs mb-1 block">Location (City, State or Zip)</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Hudson, NY or 12534"
                    className="bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#9FBCA4] focus:ring-[#9FBCA4]/20"
                    data-testid="input-location"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium text-xs mb-1 block">Min Price</Label>
                  <Input
                    type="number"
                    value={formData.priceMin}
                    onChange={(e) => setFormData({ ...formData, priceMin: e.target.value })}
                    placeholder="$500,000"
                    className="bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#9FBCA4] focus:ring-[#9FBCA4]/20"
                    data-testid="input-price-min"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium text-xs mb-1 block">Max Price</Label>
                  <Input
                    type="number"
                    value={formData.priceMax}
                    onChange={(e) => setFormData({ ...formData, priceMax: e.target.value })}
                    placeholder="$5,000,000"
                    className="bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#9FBCA4] focus:ring-[#9FBCA4]/20"
                    data-testid="input-price-max"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-700 font-medium text-xs mb-1 block">Min Bedrooms</Label>
                  <Input
                    type="number"
                    value={formData.bedsMin}
                    onChange={(e) => setFormData({ ...formData, bedsMin: e.target.value })}
                    placeholder="5+"
                    className="bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#9FBCA4] focus:ring-[#9FBCA4]/20"
                    data-testid="input-beds-min"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium text-xs mb-1 block">Min Lot Size (acres)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.lotSizeMin}
                    onChange={(e) => setFormData({ ...formData, lotSizeMin: e.target.value })}
                    placeholder="1"
                    className="bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#9FBCA4] focus:ring-[#9FBCA4]/20"
                    data-testid="input-lot-size-min"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium text-xs mb-1 block">Property Type</Label>
                  <Select
                    value={formData.propertyType}
                    onValueChange={(v) => setFormData({ ...formData, propertyType: v })}
                  >
                    <SelectTrigger
                      className="bg-gray-50 border-gray-200 text-gray-900 focus:border-[#9FBCA4] focus:ring-[#9FBCA4]/20"
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
                            className="bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#9FBCA4] focus:ring-[#9FBCA4]/20 w-48 h-9 text-sm"
                            data-testid="input-search-name"
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSaveSearch())}
                          />
                          <button
                            type="button"
                            onClick={handleSaveSearch}
                            disabled={createSavedSearch.isPending}
                            className="p-2 rounded-lg bg-[#9FBCA4] hover:bg-[#8aab93] text-white transition-colors"
                            data-testid="btn-confirm-save-search"
                          >
                            {createSavedSearch.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowSaveDialog(false); setSaveSearchName(""); }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowSaveDialog(true)}
                          className="flex items-center gap-1.5 text-xs text-[#9FBCA4] hover:text-[#7aaa8a] transition-colors"
                          data-testid="btn-save-search"
                        >
                          <Bookmark className="w-3.5 h-3.5" /> Save This Search
                        </button>
                      )}
                    </>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="bg-[#9FBCA4] hover:bg-[#8aab93] text-white font-semibold px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                  data-testid="btn-search"
                >
                  {isSearching ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</>
                  ) : (
                    <><Search className="w-4 h-4" /> Search Properties</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {isNoApiKey && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#9FBCA4]/20 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#F4795B] via-[#F4795B]/60 to-[#F4795B]" />
            <div className="p-6 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-[#F4795B] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-gray-900 font-semibold mb-1">API Key Required</h3>
                <p className="text-gray-600 text-sm mb-3">
                  To search real estate listings, you need a free RapidAPI key. Sign up at{" "}
                  <a href="https://rapidapi.com/apidojo/api/realty-in-us" target="_blank" rel="noopener noreferrer" className="text-[#9FBCA4] hover:text-[#7aaa8a] underline">
                    rapidapi.com
                  </a>
                  , subscribe to the "Realty in US" API (free tier: 100 requests/month), then add your key as <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs text-gray-800">RAPIDAPI_KEY</code> in the Secrets tab.
                </p>
              </div>
            </div>
          </div>
        )}

        {searchError && !isNoApiKey && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#F4795B]/30 overflow-hidden">
            <div className="h-0.5 bg-[#F4795B]/40" />
            <div className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-[#F4795B]" />
              <p className="text-gray-700 text-sm">{searchError.message}</p>
            </div>
          </div>
        )}

        {isSearching && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#9FBCA4]" />
          </div>
        )}

        {searchData && (
          <div className="space-y-4" data-testid="table-search-results">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {searchData.total.toLocaleString()} properties found
              </p>
              {searchData.total > 20 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(Math.max(0, searchData.offset - 20))}
                    disabled={searchData.offset === 0}
                    className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
                    data-testid="btn-prev-page"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="text-xs text-gray-500">
                    {searchData.offset + 1}-{Math.min(searchData.offset + 20, searchData.total)} of {searchData.total.toLocaleString()}
                  </span>
                  <button
                    onClick={() => handlePageChange(searchData.offset + 20)}
                    disabled={searchData.offset + 20 >= searchData.total}
                    className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
                    data-testid="btn-next-page"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
            </div>

            {searchData.results.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-[#9FBCA4]/20 p-12 text-center">
                <div className="h-0.5 bg-gradient-to-r from-[#9FBCA4]/20 to-transparent mb-8 -mt-8 -mx-12 rounded-t-2xl" />
                <Building2 className="w-12 h-12 text-[#9FBCA4]/30 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No properties found matching your criteria.</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or searching a different location.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {searchData.results.map((property) => {
                  const isSaved = savedExternalIds.has(property.externalId);
                  const savedProp = favorites.find((f) => f.externalId === property.externalId);
                  return (
                    <PropertyCard
                      key={property.externalId}
                      property={property}
                      isSaved={isSaved}
                      isSaving={saveFavorite.isPending || deleteFavorite.isPending}
                      onToggleFavorite={isSaved && savedProp ? () => handleRemove(savedProp.id) : () => handleSave(property)}
                      expandedImage={expandedImage}
                      onToggleImage={(id) => setExpandedImage(expandedImage === id ? null : id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!searchData && !searchError && !isSearching && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#9FBCA4]/10 p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#9FBCA4]/10 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-[#9FBCA4]/40" />
            </div>
            <p className="text-gray-600 font-medium">Search for Properties</p>
            <p className="text-gray-400 text-sm mt-1">
              Enter a location above to find large homes and estates with {(global?.propertyLabel || "boutique hotel").toLowerCase()} conversion potential.
            </p>
          </div>
        )}

        <div className="mt-10" data-testid="table-saved-properties">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-[#9FBCA4]/40 to-transparent" />
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#F4795B]" />
              <h2 className="text-lg font-display font-bold text-gray-900">Your Favorites</h2>
              <span className="text-sm text-gray-400">({favorites.length})</span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-[#9FBCA4]/40 to-transparent" />
          </div>

          {isFavoritesLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#9FBCA4]" />
            </div>
          ) : favorites.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-[#9FBCA4]/10 p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-[#9FBCA4]/10 flex items-center justify-center mx-auto mb-3">
                <Heart className="w-7 h-7 text-[#9FBCA4]/30" />
              </div>
              <p className="text-gray-500 font-medium">No Saved Properties</p>
              <p className="text-gray-400 text-sm mt-1">
                Search for properties and click the heart icon to save them here for later review.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {favorites.map((property) => (
                <FavoriteCard
                  key={property.id}
                  property={property}
                  onRemove={handleRemove}
                  onUpdateNotes={handleUpdateNotes}
                  isRemoving={deleteFavorite.isPending}
                  editingNotesId={editingNotesId}
                  notesText={notesText}
                  onStartEditing={startEditing}
                  onNotesChange={setNotesText}
                  onSaveNotes={saveNotes}
                  onCancelEditing={() => setEditingNotesId(null)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
