import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Smartphone } from "lucide-react";

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset link sent! Check your email.");
        setMode('login');
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Logged in successfully!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account!");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Smartphone className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">MobileShop Manager</CardTitle>
          <CardDescription>
            {mode === 'login' ? "Sign in to manage your shop" : mode === 'signup' ? "Create your account" : "Reset your password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {mode !== 'forgot' && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : mode === 'login' ? "Sign In" : mode === 'signup' ? "Sign Up" : "Send Reset Link"}
            </Button>
          </form>

          {mode === 'login' && (
            <div className="mt-3 text-center">
              <button type="button" onClick={() => setMode('forgot')} className="text-xs text-primary underline-offset-4 hover:underline">
                Forgot Password?
              </button>
            </div>
          )}

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {mode === 'login' ? "Don't have an account?" : mode === 'signup' ? "Already have an account?" : "Remember your password?"}{" "}
            <button type="button" onClick={() => setMode(mode === 'signup' ? 'login' : mode === 'forgot' ? 'login' : 'signup')} className="text-primary underline-offset-4 hover:underline">
              {mode === 'signup' ? "Sign In" : mode === 'forgot' ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
