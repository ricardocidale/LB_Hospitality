import { useState } from "react";
import Layout from "@/components/Layout";
import { useGlobalAssumptions } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
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
  Search, Heart, AlertCircle, Building2, Loader2,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  SearchResultCard,
  FavoriteCard,
  SearchForm,
  SavedSearchBar,
  type SearchFormData,
} from "@/components/property-finder";

export default function PropertyFinder() {
  const { data: global } = useGlobalAssumptions();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState<PropertyFinderSearchParams | null>(null);
  const [formData, setFormData] = useState<SearchFormData>({
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

        <SavedSearchBar
          savedSearches={savedSearches}
          onLoadSearch={handleLoadSearch}
          onDeleteSearch={handleDeleteSearch}
          isDeletePending={deleteSavedSearch.isPending}
        />

        <SearchForm
          formData={formData}
          setFormData={setFormData}
          isSearching={isSearching}
          onSubmit={handleSearch}
          showSaveDialog={showSaveDialog}
          setShowSaveDialog={setShowSaveDialog}
          saveSearchName={saveSearchName}
          setSaveSearchName={setSaveSearchName}
          onSaveSearch={handleSaveSearch}
          isSaveSearchPending={createSavedSearch.isPending}
        />

        {isNoApiKey && (
          <div className="bg-white rounded-2xl shadow-sm border border-primary/20 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#F4795B] via-[#F4795B]/60 to-[#F4795B]" />
            <div className="p-6 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-[#F4795B] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-gray-900 font-semibold mb-1">API Key Required</h3>
                <p className="text-gray-600 text-sm mb-3">
                  To search real estate listings, you need a free RapidAPI key. Sign up at{" "}
                  <a href="https://rapidapi.com/apidojo/api/realty-in-us" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-[#7aaa8a] underline">
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
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
              <div className="bg-white rounded-2xl shadow-sm border border-primary/20 p-12 text-center">
                <div className="h-0.5 bg-gradient-to-r from-primary/20 to-transparent mb-8 -mt-8 -mx-12 rounded-t-2xl" />
                <Building2 className="w-12 h-12 text-primary/30 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No properties found matching your criteria.</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or searching a different location.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {searchData.results.map((property) => {
                  const isSaved = savedExternalIds.has(property.externalId);
                  const savedProp = favorites.find((f) => f.externalId === property.externalId);
                  return (
                    <SearchResultCard
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
          <div className="bg-white rounded-2xl shadow-sm border border-primary/10 p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-primary/40" />
            </div>
            <p className="text-gray-600 font-medium">Search for Properties</p>
            <p className="text-gray-400 text-sm mt-1">
              Enter a location above to find large homes and estates with {(global?.propertyLabel || "boutique hotel").toLowerCase()} conversion potential.
            </p>
          </div>
        )}

        <div className="mt-10" data-testid="table-saved-properties">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-primary/40 to-transparent" />
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#F4795B]" />
              <h2 className="text-lg font-display font-bold text-gray-900">Your Favorites</h2>
              <span className="text-sm text-gray-400">({favorites.length})</span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-primary/40 to-transparent" />
          </div>

          {isFavoritesLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : favorites.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-primary/10 p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Heart className="w-7 h-7 text-primary/30" />
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
