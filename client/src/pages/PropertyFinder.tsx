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
  type PropertyFinderSearchParams,
  type PropertyFinderResult,
  type SavedProspectiveProperty,
} from "@/lib/api";
import {
  Search, Heart, HeartOff, ExternalLink, Bed, Bath, Ruler, Trees,
  MapPin, Loader2, AlertCircle, Building2, StickyNote, X, ChevronLeft, ChevronRight,
} from "lucide-react";

function PropertyCard({
  property,
  isSaved,
  savedId,
  onSave,
  onRemove,
  isSaving,
}: {
  property: PropertyFinderResult;
  isSaved: boolean;
  savedId?: number;
  onSave: () => void;
  onRemove: () => void;
  isSaving: boolean;
}) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden group"
      data-testid={`card-property-${property.externalId}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e] rounded-2xl" />
      <div className="absolute inset-0 bg-white/[0.03] rounded-2xl" />
      <div className="absolute inset-0 rounded-2xl border border-white/10" />

      <div className="relative">
        {property.imageUrl ? (
          <div className="h-48 overflow-hidden">
            <img
              src={property.imageUrl}
              alt={property.address}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2d4a5e] via-transparent to-transparent" />
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center bg-white/5">
            <Building2 className="w-12 h-12 text-white/20" />
          </div>
        )}

        <button
          onClick={isSaved ? onRemove : onSave}
          disabled={isSaving}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 hover:bg-black/60 transition-all"
          data-testid={`btn-favorite-${property.externalId}`}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : isSaved ? (
            <Heart className="w-4 h-4 text-[#F4795B] fill-[#F4795B]" />
          ) : (
            <Heart className="w-4 h-4 text-white/70 hover:text-[#F4795B]" />
          )}
        </button>
      </div>

      <div className="relative p-4 space-y-3">
        {property.price && (
          <p className="text-xl font-bold text-[#FFF9F5]" data-testid={`text-price-${property.externalId}`}>
            {formatMoney(property.price)}
          </p>
        )}

        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-[#9FBCA4] mt-0.5 flex-shrink-0" />
          <p className="text-sm text-white/80 leading-snug" data-testid={`text-address-${property.externalId}`}>
            {property.address}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-white/60">
          {property.beds && (
            <span className="flex items-center gap-1" data-testid={`text-beds-${property.externalId}`}>
              <Bed className="w-3.5 h-3.5" /> {property.beds} bed
            </span>
          )}
          {property.baths && (
            <span className="flex items-center gap-1" data-testid={`text-baths-${property.externalId}`}>
              <Bath className="w-3.5 h-3.5" /> {property.baths} bath
            </span>
          )}
          {property.sqft && (
            <span className="flex items-center gap-1" data-testid={`text-sqft-${property.externalId}`}>
              <Ruler className="w-3.5 h-3.5" /> {property.sqft.toLocaleString()} sqft
            </span>
          )}
          {property.lotSizeAcres && (
            <span className="flex items-center gap-1 text-[#9FBCA4]" data-testid={`text-acres-${property.externalId}`}>
              <Trees className="w-3.5 h-3.5" /> {property.lotSizeAcres} acres
            </span>
          )}
        </div>

        {property.propertyType && (
          <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/50 border border-white/10">
            {property.propertyType}
          </span>
        )}

        {property.listingUrl && (
          <a
            href={property.listingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#9FBCA4] hover:text-[#9FBCA4]/80 transition-colors"
            data-testid={`link-listing-${property.externalId}`}
          >
            <ExternalLink className="w-3.5 h-3.5" /> View Full Listing
          </a>
        )}
      </div>
    </div>
  );
}

function SavedPropertyCard({
  property,
  onRemove,
  onUpdateNotes,
  isRemoving,
}: {
  property: SavedProspectiveProperty;
  onRemove: () => void;
  onUpdateNotes: (notes: string) => void;
  isRemoving: boolean;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const [notesText, setNotesText] = useState(property.notes || "");

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      data-testid={`card-saved-${property.id}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e] rounded-2xl" />
      <div className="absolute inset-0 bg-white/[0.03] rounded-2xl" />
      <div className="absolute inset-0 rounded-2xl border border-white/10" />

      <div className="relative">
        {property.imageUrl ? (
          <div className="h-40 overflow-hidden">
            <img
              src={property.imageUrl}
              alt={property.address}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2d4a5e] via-transparent to-transparent" />
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center bg-white/5">
            <Building2 className="w-10 h-10 text-white/20" />
          </div>
        )}

        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 hover:bg-black/60 transition-all"
            data-testid={`btn-notes-${property.id}`}
          >
            <StickyNote className="w-4 h-4 text-white/70" />
          </button>
          <button
            onClick={onRemove}
            disabled={isRemoving}
            className="p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 hover:bg-red-900/60 transition-all"
            data-testid={`btn-remove-saved-${property.id}`}
          >
            {isRemoving ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <HeartOff className="w-4 h-4 text-[#F4795B]" />
            )}
          </button>
        </div>
      </div>

      <div className="relative p-4 space-y-3">
        {property.price && (
          <p className="text-lg font-bold text-[#FFF9F5]">{formatMoney(property.price)}</p>
        )}

        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-[#9FBCA4] mt-0.5 flex-shrink-0" />
          <p className="text-sm text-white/80 leading-snug">{property.address}</p>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-white/60">
          {property.beds && (
            <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {property.beds} bed</span>
          )}
          {property.baths && (
            <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {property.baths} bath</span>
          )}
          {property.sqft && (
            <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> {property.sqft.toLocaleString()} sqft</span>
          )}
          {property.lotSizeAcres && (
            <span className="flex items-center gap-1 text-[#9FBCA4]"><Trees className="w-3.5 h-3.5" /> {property.lotSizeAcres} acres</span>
          )}
        </div>

        {showNotes && (
          <div className="space-y-2">
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Add notes about this property..."
              className="w-full h-20 p-2 rounded-lg bg-white/10 border border-white/15 text-white/90 text-sm placeholder-white/30 resize-none focus:outline-none focus:border-[#9FBCA4]/40"
              data-testid={`input-notes-${property.id}`}
            />
            <GlassButton
              variant="primary"
              size="sm"
              onClick={() => onUpdateNotes(notesText)}
              data-testid={`btn-save-notes-${property.id}`}
            >
              Save Notes
            </GlassButton>
          </div>
        )}

        {!showNotes && property.notes && (
          <p className="text-xs text-white/40 italic truncate">{property.notes}</p>
        )}

        {property.listingUrl && (
          <a
            href={property.listingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#9FBCA4] hover:text-[#9FBCA4]/80 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View Full Listing
          </a>
        )}

        <p className="text-[10px] text-white/30">
          Saved {new Date(property.savedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

export default function PropertyFinder() {
  const { data: global } = useGlobalAssumptions();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"search" | "saved">("search");
  const [searchParams, setSearchParams] = useState<PropertyFinderSearchParams | null>(null);
  const [formData, setFormData] = useState({
    location: "",
    priceMin: "",
    priceMax: "",
    bedsMin: "",
    lotSizeMin: "1",
    propertyType: "any",
  });

  const { data: searchData, isLoading: isSearching, error: searchError } = usePropertySearch(searchParams);
  const { data: favorites = [], isLoading: isFavoritesLoading } = useProspectiveFavorites();
  const saveFavorite = useSaveFavorite();
  const deleteFavorite = useDeleteFavorite();
  const updateNotes = useUpdateFavoriteNotes();

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
            onClick={() => setActiveTab("saved")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === "saved"
                ? "bg-[#9FBCA4]/20 text-[#9FBCA4] border border-[#9FBCA4]/30"
                : "text-gray-500 hover:text-gray-700 border border-transparent"
            }`}
            data-testid="tab-saved"
          >
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4" /> Saved ({favorites.length})
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

                  <div className="flex justify-end">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {searchData.results.map((property) => {
                      const isSaved = savedExternalIds.has(property.externalId);
                      const savedProp = favorites.find((f) => f.externalId === property.externalId);
                      return (
                        <PropertyCard
                          key={property.externalId}
                          property={property}
                          isSaved={isSaved}
                          savedId={savedProp?.id}
                          onSave={() => handleSave(property)}
                          onRemove={() => savedProp && handleRemove(savedProp.id)}
                          isSaving={saveFavorite.isPending || deleteFavorite.isPending}
                        />
                      );
                    })}
                  </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {favorites.map((property) => (
                  <SavedPropertyCard
                    key={property.id}
                    property={property}
                    onRemove={() => handleRemove(property.id)}
                    onUpdateNotes={(notes) => handleUpdateNotes(property.id, notes)}
                    isRemoving={deleteFavorite.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
