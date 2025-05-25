import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import axios from "axios";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// Icons
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  AlertCircle, 
  Loader2,
  Sparkles,
  ShieldCheck
} from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useUser();
  
  // Define admin credentials
  const ADMIN_EMAIL = "admin@gmail.com";
  
  // Redirect if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (user.email === ADMIN_EMAIL) {
        navigate("/admin-dashboard");
      } else {
        navigate("/");
      }
    }
  }, [isAuthenticated, loading, navigate, user, ADMIN_EMAIL]);

  const handleLogin = async () => {
    setError("");
    setIsLoading(true);
    
    if (!email || !password) {
      setError("Email and password are required");
      setIsLoading(false);
      return;
    }
    
    try {
      // Direct axios call instead of apiService
      const response = await axios.post(
        "https://research-project-theta.vercel.app/api/auth/login",
        { email, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      const data = response.data;
      
      // Store token in localStorage
      localStorage.setItem("token", data.token);
      
      // Store user data in localStorage
      const userData = data.user;
      localStorage.setItem("userEmail", userData.email);
      localStorage.setItem("userName", userData.name || userData.email);
      localStorage.setItem("userId", userData.id || userData._id);
      
      // Store existing stress data if available
      if (userData.stressLevel) {
        localStorage.setItem("stressLevel", userData.stressLevel);
      }
      if (userData.stressProbability !== undefined) {
        localStorage.setItem("stressProbability", userData.stressProbability.toString());
      }
      
      console.log("Login successful, user data stored:", {
        email: userData.email,
        name: userData.name,
        stressLevel: userData.stressLevel,
        stressProbability: userData.stressProbability
      });
      
      // Force page reload to refresh UserContext
      window.location.href = email === ADMIN_EMAIL ? "/admin-dashboard" : "/";
      
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-blue-200/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-200/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200/15 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Main card */}
        <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg mx-auto">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-slate-900 mb-2">
              Welcome Back
            </CardTitle>
            <p className="text-slate-600">Sign in to your account to continue your learning journey</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error message */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Form */}
            <div className="space-y-6">
              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 h-12 bg-white/60 backdrop-blur-sm border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 pr-12 h-12 bg-white/60 backdrop-blur-sm border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 hover:bg-transparent"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Login button */}
              <Button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="h-5 w-5" />
                    <span>Sign In</span>
                  </div>
                )}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">New to platform?</span>
              </div>
            </div>

            {/* Sign up link */}
            <div className="text-center">
              <p className="text-slate-600">
                Don't have an account?{" "}
                <Button 
                  variant="link"
                  onClick={() => navigate("/signup")}
                  className="text-blue-600 hover:text-blue-700 font-semibold p-0 h-auto"
                >
                  Sign Up
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo credentials info */}
        <Card className="mt-6 backdrop-blur-sm bg-blue-50/90 border-blue-200/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-blue-800">Demo Credentials</h3>
            </div>
            <div className="text-xs text-blue-700 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-medium">Admin:</span>
                <span className="font-mono bg-white/50 px-2 py-1 rounded">admin@gmail.com / 12345678</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;