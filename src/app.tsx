import { useTranslation } from "react-i18next"
import ConfigPage from "./pages/Configuration"

const App = () => {
	const { t } = useTranslation()

	return (
		<main className="dark text-foreground bg-background h-screen">
			<div className="container mx-auto columns-2 font-display">
				<h1 className="text-3xl font-bold underline">{t("Hello world!")}</h1>
				{<ConfigPage />}
			</div>
		</main>
	)
}

export default App
