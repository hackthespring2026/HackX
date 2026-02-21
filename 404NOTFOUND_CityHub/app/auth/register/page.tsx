"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterValues } from "@/schema/auth";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import Link from "next/link";

export default function RegisterPage() {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    });

    function onSubmit(data: RegisterValues) {
        startTransition(async () => {
            try {
                await authClient.signUp.email(
                    {
                        email: data.email,
                        password: data.password,
                        name: data.name,
                        role: "user",
                    },
                    {
                        onSuccess: () => {
                            toast.success("Account created!");
                            router.push("/onboarding");
                        },
                        onError: (ctx) => {
                            toast.error(
                                ctx.error.message || "Something went wrong"
                            );
                        },
                    }
                );
            } catch {
                toast.error("An unexpected error occurred");
            }
        });
    }

    return (
        <div className="w-full">
            <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                    Step 1 of 2
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-1.5 tracking-tight">
                    Create your account
                </h2>
                <p className="text-muted-foreground">
                    Join your city&apos;s civic platform.
                </p>
            </div>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-5"
                    suppressHydrationWarning
                >
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <Label>Full Name</Label>
                                <FormControl>
                                    <Input
                                        placeholder="Your name"
                                        autoComplete="name"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <Label>Email</Label>
                                <FormControl>
                                    <Input
                                        type="email"
                                        placeholder="you@example.com"
                                        autoComplete="email"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <Label>Password</Label>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="Min. 8 characters"
                                        autoComplete="new-password"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        className="w-full h-10"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                Create Account
                                <ArrowRight className="w-4 h-4 ml-1.5" />
                            </>
                        )}
                    </Button>
                </form>
            </Form>

            <p className="text-center text-sm text-muted-foreground mt-8">
                Already have an account?{" "}
                <Link
                    href="/auth/login"
                    className="text-primary hover:underline underline-offset-4 font-medium"
                >
                    Sign in
                </Link>
            </p>
        </div>
    );
}
