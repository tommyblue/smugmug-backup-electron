// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require("electron")
import { AccountAnalysisResponse } from "./smugmug/account"
import { BackupResponse } from "./smugmug/backup"
import { Config, Store } from "./smugmug/config"

contextBridge.exposeInMainWorld("api", {
	openBrowser: (url: string) => ipcRenderer.invoke("browser:open", url),
	openFile: () => ipcRenderer.invoke("dialog:openFile"),
	testCredentials: (cfg: Config): Promise<boolean> => ipcRenderer.invoke("config:test", cfg),
	analyzeAccount: (cfg: Config): Promise<AccountAnalysisResponse> => ipcRenderer.invoke("account:analyze", cfg),
	makeBackup: (cfg: Config): Promise<BackupResponse> => ipcRenderer.invoke("backup:run", cfg),
	analyzeStore: (cfg: Store): Promise<string> => ipcRenderer.invoke("store:analyze", cfg),
})

contextBridge.exposeInMainWorld("comms", {
	logMessage: (callback: (msg: string) => void) => ipcRenderer.on("log", (_event, value: string) => callback(value)),
	// logMessage: (callback: (msg: string) => void) => ipcRenderer.on("log", (_event, value) => callback(value)),
	downloadProgress: (callback: (total: number, progress: number) => void) =>
		ipcRenderer.on("download-progress", (_event, total: number, progress: number) => callback(total, progress)),
})
