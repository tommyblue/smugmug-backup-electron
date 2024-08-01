import React from "react"
import { Config, defaultConfig } from "../config"

export default function useConfig() {
	const [config, setConfig] = React.useState<Config>(() => {
		const cfg = localStorage.getItem("config")
		if (cfg === null) {
			localStorage.setItem("config", JSON.stringify(defaultConfig))
			return defaultConfig
		}
		return JSON.parse(cfg)
	})

	React.useEffect(() => {
		const cfg = localStorage.getItem("config")
		if (cfg) {
			setConfig(JSON.parse(cfg))
		}
	}, [])

	function handleSetConfig(newConfig: Config) {
		setConfig(prevConfig => {
			const updatedConfig = { ...prevConfig, ...newConfig }
			return updatedConfig
		})
		localStorage.setItem("config", JSON.stringify(newConfig))
	}

	return { config, setConfig: handleSetConfig }
}
