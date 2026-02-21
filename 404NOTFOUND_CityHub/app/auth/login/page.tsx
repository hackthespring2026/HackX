"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginValues } from "@/schema/auth";
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

export default function LoginPage() {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    function onSubmit(data: LoginValues) {
        startTransition(async () => {
            try {
                await authClient.signIn.email(
                    {
                        email: data.email,
                        password: data.password,
                    },
                    {
                        onSuccess: () => {
                            toast.success("Welcome back!");
                            router.push("/");
                        },
                        onError: (ctx) => {
                            toast.error(
                                ctx.error.message || "Invalid credentials"
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
                <h2 className="text-2xl font-bold text-foreground mb-1.5 tracking-tight">
                    Welcome back
                </h2>
                <p className="text-muted-foreground">
                    Sign in to continue to your city.
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
                                        placeholder="••••••••"
                                        autoComplete="current-password"
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
                                Sign In
                                <ArrowRight className="w-4 h-4 ml-1.5" />
                            </>
                        )}
                    </Button>
                </form>
            </Form>

            <p className="text-center text-sm text-muted-foreground mt-8">
                New here?{" "}
                <Link
                    href="/auth/register"
                    className="text-primary hover:underline underline-offset-4 font-medium"
                >
                    Create an account
                </Link>
            </p>
        </div>
    );
}
