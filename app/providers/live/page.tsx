import { ProviderStatesDisplay } from "@/components/provider-states-display";
import Header from "@/components/Header";

export default function ProvidersLivePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ProviderStatesDisplay />
    </div>
  );
}