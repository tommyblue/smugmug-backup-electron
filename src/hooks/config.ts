import React from "react"
import { Config, defaultConfig } from "../config"

export default function useConfig() {
	const [config, setConfig] = React.useState<Config>(() => {
		localStorage.setItem("config", JSON.stringify(defaultConfig))
		return defaultConfig
	})

	React.useEffect(() => {
		const cfg = localStorage.getItem("config")
		if (cfg) {
			setConfig(JSON.parse(cfg))
		}
	}, [])

	return { config, setConfig }
}
