import React from "react"
import { useTranslation } from "react-i18next"
import { Config, defaultConfig } from "./config"
import ConfigPage from "./pages/Configuration"

const App = () => {
	const { t } = useTranslation()

	const [config, setConfig] = React.useState<Config | null>(null)

	React.useEffect(() => {
		if (config === null) {
			console.log("setting default config")
			setConfig(defaultConfig)
			localStorage.setItem("config", JSON.stringify(defaultConfig))
		}
	}, [config])

	React.useEffect(() => {
		const cfg = localStorage.getItem("config")
		if (cfg) {
			console.log("config from local storage:", JSON.parse(cfg))
			setConfig(JSON.parse(cfg))
		}
	}, [])

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
