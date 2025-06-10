
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { signInWithGoogle, signUpWithEmail, signInWithEmail, currentUser, loading, isAuthenticating } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("login");
  const [currentYear, setCurrentYear] = useState<number | null>(null);


  useEffect(() => {
    if (!loading && currentUser) {
      router.push('/');
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      // onSuccess, router.push('/') is handled in AuthContext
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google. Please try again.');
      toast({ variant: "destructive", title: "Google Sign-In Failed", description: err.message });
    }
  };

  const handleEmailPasswordSubmit = async (event: FormEvent<HTMLFormElement>, type: 'login' | 'signup') => {
    event.preventDefault();
    setError(null);

    if (type === 'signup') {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        toast({ variant: "destructive", title: "Signup Error", description: "Passwords do not match." });
        return;
      }
      if (!displayName.trim()) {
        setError("Display Name is required.");
        toast({ variant: "destructive", title: "Signup Error", description: "Display Name is required." });
        return;
      }
    }


    try {
      if (type === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName);
      }
      // onSuccess, router.push('/') is handled in AuthContext
    } catch (err: any) {
      let friendlyMessage = 'An unexpected error occurred. Please try again.';
      if (err.code) {
        switch (err.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            friendlyMessage = 'Invalid email or password.';
            break;
          case 'auth/email-already-in-use':
            friendlyMessage = 'This email address is already in use.';
            break;
          case 'auth/weak-password':
            friendlyMessage = 'Password is too weak. It should be at least 6 characters.';
            break;
          default:
            friendlyMessage = err.message || friendlyMessage;
        }
      }
      setError(friendlyMessage);
      toast({ variant: "destructive", title: `${type === 'login' ? 'Login' : 'Signup'} Failed`, description: friendlyMessage });
    }
  };
  
  if (loading || (!loading && currentUser)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/30 via-background to-background p-4">
      <div className="flex items-center gap-3 mb-8 text-primary">
        <Shield className="h-10 w-10 sm:h-12 sm:w-12" />
        <h1 className="text-3xl sm:text-4xl font-headline font-bold">Amateur Stats Hub</h1>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Welcome Back!</CardTitle>
              <CardDescription>Sign in to access your league stats.</CardDescription>
            </CardHeader>
            <form onSubmit={(e) => handleEmailPasswordSubmit(e, 'login')}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isAuthenticating} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isAuthenticating} />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                {error && activeTab === 'login' && (
                  <div className="w-full flex items-center p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md">
                    <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="break-words">{error}</span>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isAuthenticating}>
                  {isAuthenticating ? <Loader2 className="animate-spin" /> : 'Login'}
                </Button>
                <p className="text-sm text-muted-foreground">or</p>
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isAuthenticating}>
                  {isAuthenticating ? <Loader2 className="animate-spin" /> : <>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                    Sign in with Google
                  </> }
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Create an Account</CardTitle>
              <CardDescription>Join Amateur Stats Hub today.</CardDescription>
            </CardHeader>
             <form onSubmit={(e) => handleEmailPasswordSubmit(e, 'signup')}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-displayName">Display Name</Label>
                  <Input id="signup-displayName" type="text" placeholder="Your Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required disabled={isAuthenticating} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isAuthenticating} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" placeholder="•••••••• (min. 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isAuthenticating} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input id="confirm-password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isAuthenticating} />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                 {error && activeTab === 'signup' && (
                   <div className="w-full flex items-center p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md">
                    <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="break-words">{error}</span>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isAuthenticating}>
                  {isAuthenticating ? <Loader2 className="animate-spin" /> : 'Create Account'}
                </Button>
                 <p className="text-sm text-muted-foreground">or</p>
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isAuthenticating}>
                   {isAuthenticating ? <Loader2 className="animate-spin" /> : <>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                    Sign up with Google
                  </> }
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
       <footer className="text-center py-8 text-sm text-muted-foreground">
        {currentYear !== null ? <p>&copy; {currentYear} Amateur Stats Hub. All rights reserved.</p> : <p>&copy; Amateur Stats Hub. All rights reserved.</p>}
      </footer>
    </div>
  );
}
