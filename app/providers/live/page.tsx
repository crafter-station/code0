import Header from "@/components/Header";
import { ProviderStatesDisplay } from "@/components/provider-states-display";

export default function ProvidersLivePage() {
	return (
		<div className="min-h-screen bg-background">
			<Header />
			<ProviderStatesDisplay />
		</div>
	);
}
