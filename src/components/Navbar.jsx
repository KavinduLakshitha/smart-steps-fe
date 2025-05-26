import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Icons
import { 
  Sparkles, 
  User, 
  LogOut, 
  BookOpen, 
  ChevronDown,
  Menu,
  X
} from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Get initials for avatar
  const getAvatarInitials = () => {
    if (user && user.name) {
      return user.name
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user && user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    window.location.reload();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Check if user is admin
  const isAdmin = user && user.email === "admin@gmail.com";

  // Handle logo click based on user role
  const handleLogoClick = () => {
    if (isAdmin) {
      navigate("/admin-dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <>
      {/* Main Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div 
              className="flex items-center space-x-2 cursor-pointer group"
              onClick={handleLogoClick}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 shadow-lg mx-auto p-2">
                {/* Replace Sparkles with logo image */}
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to a placeholder if logo fails to load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                {/* Fallback text if image fails */}
                <span className="text-white font-bold text-lg hidden">SS</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">Smart Steps</span>
                <span className="text-xs text-gray-500 hidden sm:block">Learn. Grow. Excel.</span>                
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {isAuthenticated ? (
                <>
                  {/* Admin Dashboard Button - Only visible for admin */}
                  {!isAdmin && (
                    <Button
                    variant="ghost"
                    onClick={() => navigate("/filtered")}
                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Your Plan
                  </Button>
                  )}                                 

                  {/* User Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="flex items-center space-x-2 hover:bg-gray-100 px-3 py-2 rounded-lg"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold">
                            {getAvatarInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium text-gray-900">
                            {user?.name || "User"}
                          </span>
                          <span className="text-xs text-gray-500 hidden lg:block">
                            {user?.email}
                          </span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user?.name || "User"}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user?.email}
                          </p>
                          {isAdmin && (
                            <Badge variant="outline" className="mt-1 w-fit text-xs bg-red-50 text-red-700 border-red-200">
                              Admin Account
                            </Badge>
                          )}
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />                      
                      {!isAdmin && (
                      <>
                      <DropdownMenuItem
                          onClick={() => navigate("/profile")}
                          className="cursor-pointer"
                        >
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </DropdownMenuItem>                        
                          <DropdownMenuSeparator /></>
                      )}
                      <DropdownMenuItem 
                        onClick={handleLogout}
                        className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button 
                  onClick={() => navigate("/login")}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  Login
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile Menu */}
      <div className={`
        fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-lg md:hidden transform transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
      `}>
        <div className="container mx-auto px-4 py-4 space-y-4">
          {isAuthenticated ? (
            <>
              {/* User Info */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold">
                    {getAvatarInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {user?.name || "User"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {user?.email}
                  </span>
                  {isAdmin && (
                    <Badge variant="outline" className="mt-1 w-fit text-xs bg-red-50 text-red-700 border-red-200">
                      Admin Account
                    </Badge>
                  )}
                </div>
              </div>

              {/* Mobile Menu Items */}
              <div className="space-y-2">
                {/* Admin Dashboard - Only visible for admin */}
                {isAdmin && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      navigate("/admin-dashboard");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <BookOpen className="h-4 w-4 mr-3" />
                    Admin Dashboard
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  onClick={() => {
                    navigate("/filtered");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                >
                  <BookOpen className="h-4 w-4 mr-3" />
                  Course Materials
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => {
                    navigate("/profile");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                >
                  <User className="h-4 w-4 mr-3" />
                  Profile
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => {
                    navigate("/dashboard");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                >
                  <BookOpen className="h-4 w-4 mr-3" />
                  Dashboard
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <Button 
              onClick={() => {
                navigate("/login");
                setIsMobileMenuOpen(false);
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Login
            </Button>
          )}
        </div>
      </div>

      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className="h-16"></div>
    </>
  );
};

export default Navbar;