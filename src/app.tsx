import { useTranslation } from "react-i18next"
import AnalysisPage from "./pages/Analysis"
import ConfigPage from "./pages/Configuration"
import StoreAnalysisPage from "./pages/Store"

const App = () => {
	const { t } = useTranslation()

	return (
		<main className="dark text-foreground bg-background h-screen">
			<div className="container mx-auto columns-2 font-display">
				{<ConfigPage />}
				{<AnalysisPage />}
				{<StoreAnalysisPage />}
			</div>
		</main>
	)
}

export default App
