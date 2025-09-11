import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Upload, 
  BarChart3, 
  Settings, 
  Shield,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Panel", icon: BarChart3 },
    { path: "/upload", label: "Yükleme", icon: Upload },
    { path: "/documents", label: "Belgeler", icon: FileText },
    { path: "/search", label: "Arama", icon: Search },
    { path: "/settings", label: "Ayarlar", icon: Settings },
  ];

  return (
    <nav className="bg-gradient-card border-b border-border shadow-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-insurance-navy">
              Sigorta OCR
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "flex items-center space-x-2 transition-smooth",
                      isActive 
                        ? "bg-gradient-primary text-primary-foreground shadow-card" 
                        : "text-insurance-gray hover:text-insurance-navy hover:bg-insurance-light-gray"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              className="border-insurance-blue text-insurance-blue hover:bg-insurance-light-blue"
            >
              Profil
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;