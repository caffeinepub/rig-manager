import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import RigDetail from "./pages/RigDetail";

type View = { name: "dashboard" } | { name: "rig-detail"; rigId: bigint };

export default function App() {
  const [view, setView] = useState<View>({ name: "dashboard" });

  const navigateToRig = (rigId: bigint) =>
    setView({ name: "rig-detail", rigId });
  const navigateToDashboard = () => setView({ name: "dashboard" });

  return (
    <div className="min-h-screen bg-background">
      {view.name === "dashboard" && <Dashboard onSelectRig={navigateToRig} />}
      {view.name === "rig-detail" && (
        <RigDetail rigId={view.rigId} onBack={navigateToDashboard} />
      )}
      <Toaster />
    </div>
  );
}
