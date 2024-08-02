// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require("electron")
import { Auth } from "./config"

contextBridge.exposeInMainWorld("api", {
	openBrowser: (url: string) => ipcRenderer.invoke("browser:open", url),
	openFile: () => ipcRenderer.invoke("dialog:openFile"),
	testCredentials: (cfg: Auth): Promise<boolean> => ipcRenderer.invoke("config:test", cfg),
})
