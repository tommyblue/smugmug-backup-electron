import React from "react"
import Button from "./components/nextui/Button"
import { Config, defaultConfig } from "./config"

const App = () => {
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
		<div className="container mx-auto columns-2 font-display">
			<h1 className="text-3xl font-bold underline">Hello world!</h1>
			<Button
				text="Click me!"
				onClick={() => {
					alert("clicked!")
				}}
			/>
		</div>
	)
}

export default App
