// src/app/(dashboard)/settings/page.tsx
// Settings page - profile, preferences, account

"use client";

import { useState, useSyncExternalStore } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { cn } from "@/lib/utils";
import { User, Lock, Shield, Moon, Sun, Monitor, Save } from "lucide-react";
import { z } from "zod";

const defaultPreferences = {
  emailNotifications: true,
  analysisAutoSave: true,
};

const preferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  analysisAutoSave: z.boolean().optional(),
});

function subscribeToStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getStoredPreferences() {
  return typeof window === "undefined"
    ? ""
    : window.localStorage.getItem("preferences") ?? "";
}

function parsePreferences(value: string) {
  try {
    const parsed = preferencesSchema.safeParse(JSON.parse(value));
    return parsed.success
      ? { ...defaultPreferences, ...parsed.data }
      : defaultPreferences;
  } catch (error) {
    if (error instanceof SyntaxError) return defaultPreferences;
    throw error;
  }
}

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Profile state
  const [name, setName] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Preferences state
  const storedPreferences = useSyncExternalStore(
    subscribeToStorage,
    getStoredPreferences,
    () => ""
  );
  const [emailNotificationsOverride, setEmailNotifications] = useState<boolean | null>(null);
  const [analysisAutoSaveOverride, setAnalysisAutoSave] = useState<boolean | null>(null);
  const preferences = parsePreferences(storedPreferences);
  const emailNotifications = emailNotificationsOverride ?? preferences.emailNotifications;
  const analysisAutoSave = analysisAutoSaveOverride ?? preferences.analysisAutoSave;
  const email = session?.user?.email ?? "";

  const savePreferences = () => {
    localStorage.setItem(
      "preferences",
      JSON.stringify({ emailNotifications, analysisAutoSave })
    );
    showMessage("success", "Preferences saved");
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name?.trim() || null }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      await update();
      showMessage("success", "Profile updated successfully");
    } catch (error) {
      showMessage("error", error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showMessage("error", "Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      showMessage("error", "Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to change password");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showMessage("success", "Password changed successfully");
    } catch (error) {
      showMessage("error", error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile, preferences, and account settings.
        </p>
      </div>

      {message && (
        <div
          className={cn(
            "p-4 rounded-md text-sm flex items-center gap-2 animate-fade-in",
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          )}
        >
          {message.type === "success" ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          {message.text}
        </div>
      )}

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-brand" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>Manage your personal information and display name.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={name ?? session?.user?.name ?? ""}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="gap-2">
              <Save className="h-4 w-4" />
              {isLoading ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-brand" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>Change your password to keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" disabled={isLoading || !currentPassword || !newPassword} className="gap-2">
              <Save className="h-4 w-4" />
              {isLoading ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Preferences Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand" />
            <CardTitle>Preferences</CardTitle>
          </div>
          <CardDescription>Customize your ShouldISay experience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme */}
          <div className="space-y-4">
            <Label>Appearance</Label>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      "relative p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2",
                      theme === option.value
                        ? "border-brand bg-brand-muted"
                        : "border-border hover:border-brand-border hover:bg-accent"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="font-medium text-sm">{option.label}</span>
                    {theme === option.value && (
                      <div className="absolute top-2 right-2 h-5 w-5 bg-brand text-brand-foreground rounded-full flex items-center justify-center">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Notifications */}
          <div className="space-y-4">
            <Label>Notifications</Label>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="space-y-0.5">
                  <span className="font-medium">Email Notifications</span>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about your analyses and account
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-brand focus:ring-brand"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div className="space-y-0.5">
                  <span className="font-medium">Auto-save Analyses</span>
                  <p className="text-sm text-muted-foreground">
                    Automatically save analysis drafts as you type
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={analysisAutoSave}
                  onChange={(e) => setAnalysisAutoSave(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-brand focus:ring-brand"
                />
              </label>
            </div>
          </div>

          <Button onClick={savePreferences} className="gap-2" variant="outline">
            <Save className="h-4 w-4" />
            Save Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Account Section */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </div>
          <CardDescription>Irreversible actions. Proceed with caution.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <Button variant="destructive" onClick={() => alert("Account deletion not yet implemented")}>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}