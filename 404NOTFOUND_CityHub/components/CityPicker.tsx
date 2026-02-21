"use client";

import { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MapPin, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface City {
    name: string;
    country: string;
    state?: string;
    lat: number;
    lon: number;
    displayName?: string;
}

interface CityPickerProps {
    value: City | null;
    onChange: (city: City | null) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function CityPicker({
    value,
    onChange,
    placeholder = "Search for your city...",
    disabled = false,
}: CityPickerProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [cities, setCities] = useState<City[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const searchCities = useAction(api.cities.searchCities);

    // Debounced search
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setCities([]);
            setShowDropdown(false);
            return;
        }

        setShowDropdown(true);
        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await searchCities({ query: searchQuery });
                setCities(results);
            } catch (error) {
                console.error("Error searching cities:", error);
                setCities([]);
            } finally {
                setIsSearching(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [searchQuery, searchCities]);

    const displayValue = value
        ? `${value.name}${value.state ? `, ${value.state}` : ""}, ${value.country}`
        : searchQuery;

    const handleSelect = (city: City) => {
        onChange(city);
        const display = `${city.name}${city.state ? `, ${city.state}` : ""}, ${city.country}`;
        setSearchQuery(display);
        setShowDropdown(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);
        if (!val) {
            onChange(null);
        }
    };

    return (
        <div className="relative w-full">
            <Input
                value={displayValue}
                onChange={handleInputChange}
                onFocus={() => {
                    if (searchQuery.length >= 2) {
                        setShowDropdown(true);
                    }
                }}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full"
            />

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute z-50 w-full mt-2 bg-popover text-popover-foreground rounded-sm border border-border shadow-md max-h-72 overflow-y-auto">
                    {isSearching ? (
                        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Searching cities...
                        </div>
                    ) : cities.length === 0 ? (
                        <div className="text-center py-6 text-sm text-muted-foreground">
                            {searchQuery.length < 2
                                ? "Type at least 2 characters to search"
                                : "No cities found. Try a different search."}
                        </div>
                    ) : (
                        <div className="py-1">
                            {cities.map((city, index) => (
                                <button
                                    key={`${city.name}-${city.country}-${index}`}
                                    type="button"
                                    onClick={() => handleSelect(city)}
                                    className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                                >
                                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-medium text-sm">
                                            {city.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {city.state
                                                ? `${city.state}, ${city.country}`
                                                : city.country}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Click outside to close */}
            {showDropdown && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                />
            )}
        </div>
    );
}
