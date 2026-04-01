import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function AppHeader() {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();

  const principal = identity?.getPrincipal().toString();
  const shortPrincipal = principal
    ? `${principal.slice(0, 5)}...${principal.slice(-3)}`
    : null;

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img
              src="/assets/tss-logo-019d3d28-9c54-77ff-b4bd-a8d25c649de9.jpg"
              alt="The Skydive School"
              className="h-12 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span
                className="text-2xl font-bold tracking-widest"
                style={{ color: "#2E6F9E", letterSpacing: "0.2em" }}
              >
                RIG MANAGER
              </span>
            </div>
            {identity ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {shortPrincipal}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clear}
                  className="gap-1.5 border-[#2E6F9E] text-[#2E6F9E] hover:bg-[#2E6F9E] hover:text-white"
                  data-ocid="header.toggle"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={login}
                disabled={isLoggingIn}
                className="gap-1.5"
                style={{ backgroundColor: "#2E6F9E" }}
                data-ocid="header.toggle"
              >
                <LogIn className="w-3.5 h-3.5" />
                {isLoggingIn ? "Logging in..." : "Login"}
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* Brand stripe */}
      <div className="flex h-1.5">
        <div className="flex-1" style={{ backgroundColor: "#1B3FA6" }} />
        <div className="flex-1" style={{ backgroundColor: "#3B82C4" }} />
        <div className="flex-1" style={{ backgroundColor: "#F4D35E" }} />
        <div className="flex-1" style={{ backgroundColor: "#F39C3D" }} />
        <div className="flex-1" style={{ backgroundColor: "#D85A4A" }} />
        <div className="flex-1" style={{ backgroundColor: "#8B1A1A" }} />
      </div>
    </header>
  );
}
