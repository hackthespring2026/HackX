"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Building2,
    MapPin,
    Sparkles,
    ArrowRight,
    Loader2,
    X,
    Plus,
    Camera,
    User,
    Heart,
    Compass,
    Lightbulb,
    CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { CityPicker } from "@/components/CityPicker";

const INTERESTS = [
    "Urban Planning",
    "Sustainability",
    "Public Transit",
    "Cycling",
    "Arts & Culture",
    "Education",
    "Tech & Innovation",
    "Community Safety",
    "Housing",
    "Parks & Green Spaces",
    "Local Business",
    "Public Health",
];

export default function OnboardingPage() {
    const router = useRouter();
    const createProfile = useMutation(api.users.createProfile);
    const generateUploadUrl = useMutation(api.users.generateUploadUrl);

    const { data: session } = authClient.useSession();
    const userName = session?.user?.name || "There";

    const [city, setCity] = useState<{
        name: string;
        country: string;
        state?: string;
        lat: number;
        lon: number;
    } | null>(null);
    const [bio, setBio] = useState("");
    const [interests, setInterests] = useState<string[]>([]);
    const [customInterest, setCustomInterest] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Avatar state
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toggleInterest = (interest: string) => {
        setInterests((prev) =>
            prev.includes(interest)
                ? prev.filter((i) => i !== interest)
                : [...prev, interest]
        );
    };

    const addCustomInterest = () => {
        const trimmed = customInterest.trim();
        if (trimmed && !interests.includes(trimmed)) {
            setInterests([...interests, trimmed]);
            setCustomInterest("");
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be under 5MB");
            return;
        }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    // Completion calculation
    const completion = useMemo(() => {
        let score = 0;
        let total = 3;
        if (city) score++;
        if (interests.length > 0) score++;
        if (bio.trim() || avatarFile) score++;
        return Math.round((score / total) * 100);
    }, [city, bio, interests, avatarFile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!city) {
            toast.error("Please select your city");
            return;
        }
        if (interests.length === 0) {
            toast.error("Pick at least one interest");
            return;
        }

        setIsSubmitting(true);
        try {
            let imageUrl: string | undefined;

            // Upload avatar if provided
            if (avatarFile) {
                const uploadUrl = await generateUploadUrl();
                const result = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": avatarFile.type },
                    body: avatarFile,
                });
                const { storageId } = await result.json();
                imageUrl = storageId;
            }

            await createProfile({
                city: {
                    name: city.name,
                    country: city.country,
                    state: city.state,
                    lat: city.lat,
                    lon: city.lon,
                },
                bio: bio.trim() || undefined,
                interests,
                imageUrl,
                isPublic: true, // Default to public on signup
            });
            toast.success("You're all set!");
            router.push("/");
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-5 bg-background text-foreground">
            {/* LEFT — Brand panel (takes 2/5 of the screen) */}
            <div className="hidden lg:flex lg:col-span-2 flex-col justify-between p-10 xl:p-14 bg-primary text-primary-foreground relative overflow-hidden">
                {/* Subtle pattern overlay */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />

                <div className="relative z-10">
                    <div className="flex items-center gap-2.5 mb-16">
                        <div className="w-8 h-8 bg-primary-foreground/15 rounded-lg flex items-center justify-center">
                            <Building2 className="w-4.5 h-4.5" />
                        </div>
                        <span className="font-semibold text-lg tracking-tight">
                            CityHub
                        </span>
                    </div>

                    {/* Progress indicator */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-foreground/10 text-primary-foreground/80 text-xs font-medium mb-6">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Step 2 of 2
                    </div>

                    <h1 className="text-3xl xl:text-4xl font-bold tracking-tight mb-4 leading-tight">
                        You&apos;re almost
                        <br />
                        there, {userName}!
                    </h1>
                    <p className="text-primary-foreground/70 text-base max-w-xs leading-relaxed">
                        Complete your profile to unlock the full civic
                        experience and connect with your community.
                    </p>

                    {/* Feature pills */}
                    <div className="mt-10 space-y-3">
                        <div className="flex items-center gap-3 text-sm text-primary-foreground/80">
                            <div className="w-8 h-8 rounded-lg bg-primary-foreground/10 flex items-center justify-center shrink-0">
                                <Compass className="w-4 h-4" />
                            </div>
                            <span>Find communities matching your interests</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-primary-foreground/80">
                            <div className="w-8 h-8 rounded-lg bg-primary-foreground/10 flex items-center justify-center shrink-0">
                                <Heart className="w-4 h-4" />
                            </div>
                            <span>
                                Connect with neighbors who care like you do
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-primary-foreground/80">
                            <div className="w-8 h-8 rounded-lg bg-primary-foreground/10 flex items-center justify-center shrink-0">
                                <Lightbulb className="w-4 h-4" />
                            </div>
                            <span>
                                Get personalized recommendations & updates
                            </span>
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <p className="text-sm text-primary-foreground/60">
                            Profile completion
                        </p>
                        <span className="text-sm font-bold text-primary-foreground">
                            {completion}%
                        </span>
                    </div>
                    <div className="h-2 bg-primary-foreground/15 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary-foreground/90 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${completion}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* RIGHT — Onboarding form (takes 3/5) */}
            <div className="lg:col-span-3 flex items-center justify-center p-6 sm:p-10 lg:p-16">
                <div className="w-full max-w-lg">
                    {/* Mobile brand */}
                    <div className="lg:hidden flex items-center gap-2 mb-10">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-semibold text-lg tracking-tight">
                            CityHub
                        </span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-1.5 tracking-tight">
                            Set up your profile
                        </h2>
                        <p className="text-muted-foreground">
                            Tell us about your city and what you care about.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Avatar upload */}
                        <div className="space-y-2">
                            <Label>
                                Profile photo{" "}
                                <span className="text-muted-foreground font-normal">
                                    (optional)
                                </span>
                            </Label>
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className="relative w-16 h-16 rounded-full bg-muted border-2 border-dashed border-border hover:border-primary/40 transition-colors flex items-center justify-center overflow-hidden group"
                                >
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-7 h-7 text-muted-foreground" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                                        <Camera className="w-4 h-4 text-white" />
                                    </div>
                                </button>
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        {avatarPreview
                                            ? "Looking good!"
                                            : "Upload a photo"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        JPG, PNG under 5MB
                                    </p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        {/* City */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                Your City
                            </Label>
                            <CityPicker
                                value={city}
                                onChange={setCity}
                                placeholder="Search for your city..."
                            />
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                            <Label>
                                Bio{" "}
                                <span className="text-muted-foreground font-normal">
                                    (optional)
                                </span>
                            </Label>
                            <Textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="What drives you? What do you want to improve in your city?"
                                className="resize-none min-h-20"
                            />
                        </div>

                        {/* Interests */}
                        <div className="space-y-3">
                            <Label className="flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                                Interests
                                <span className="text-muted-foreground font-normal ml-1">
                                    — pick at least one
                                </span>
                            </Label>

                            <div className="flex flex-wrap gap-2">
                                {INTERESTS.map((interest) => {
                                    const selected =
                                        interests.includes(interest);
                                    return (
                                        <button
                                            key={interest}
                                            type="button"
                                            onClick={() =>
                                                toggleInterest(interest)
                                            }
                                            className={cn(
                                                "px-3 py-1.5 rounded-full text-sm border transition-colors",
                                                selected
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                                            )}
                                        >
                                            {interest}
                                        </button>
                                    );
                                })}

                                {/* Custom interests that aren't in the predefined list */}
                                {interests
                                    .filter((i) => !INTERESTS.includes(i))
                                    .map((interest) => (
                                        <button
                                            key={interest}
                                            type="button"
                                            onClick={() =>
                                                toggleInterest(interest)
                                            }
                                            className="px-3 py-1.5 rounded-full text-sm border bg-primary text-primary-foreground border-primary transition-colors flex items-center gap-1"
                                        >
                                            {interest}
                                            <X className="w-3 h-3" />
                                        </button>
                                    ))}
                            </div>

                            {/* Custom interest input */}
                            <div className="flex gap-2 mt-1">
                                <Input
                                    value={customInterest}
                                    onChange={(e) =>
                                        setCustomInterest(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            addCustomInterest();
                                        }
                                    }}
                                    placeholder="Add your own..."
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={addCustomInterest}
                                    disabled={!customInterest.trim()}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            className="w-full h-10"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    Get Started
                                    <ArrowRight className="w-4 h-4 ml-1.5" />
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
