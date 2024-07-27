import React from "react"
import { useTranslation } from "react-i18next"
import Button from "./components/nextui/Button"
import { Config, defaultConfig } from "./config"

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
				<h1 className="text-3xl font-bold underline">Hello world!</h1>
				<Button
					text={t("Click me!")}
					onClick={() => {
						alert("clicked!")
					}}
				/>
			</div>
		</main>
	)
}

export default App
