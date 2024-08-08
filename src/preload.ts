// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require("electron")
import { Auth, Config, Store } from "./smugmug/config"
import { AccountAnalysisResponse } from "./smugmug/types"

contextBridge.exposeInMainWorld("api", {
	openBrowser: (url: string) => ipcRenderer.invoke("browser:open", url),
	openFile: () => ipcRenderer.invoke("dialog:openFile"),
	testCredentials: (cfg: Auth): Promise<boolean> => ipcRenderer.invoke("config:test", cfg),
	analyzeAccount: (cfg: Config): Promise<AccountAnalysisResponse> => ipcRenderer.invoke("account:analyze", cfg),
	analyzeStore: (cfg: Store): Promise<string> => ipcRenderer.invoke("store:analyze", cfg),
})
