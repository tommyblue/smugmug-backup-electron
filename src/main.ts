import { app, BrowserWindow, dialog, ipcMain, shell } from "electron"
import path from "path"
import { Account, AccountAnalysisResponse } from "./smugmug/account"
import { Backup } from "./smugmug/backup"
import { Config, Store } from "./smugmug/config"
import { analyzeStore, StoreAnalysisResponse } from "./smugmug/store"

let mainWindow: BrowserWindow | null

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
	app.quit()
}

const createWindow = () => {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		icon: "../icons/icon.png",
		width: 1600,
		height: 1000,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
		},
	})

	// and load the index.html of the app.
	if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
	} else {
		mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
	}

	// Open the DevTools.
	if (process.env?.NODE_ENV === "development") {
		mainWindow.webContents.openDevTools()
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit()
	}
})

app.on("activate", () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow()
	}
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.handle("browser:open", async (event, url: string) => {
	shell.openExternal(url)
})

ipcMain.handle("dialog:openFile", async event => {
	if (!mainWindow) return

	const result = await dialog.showOpenDialog(mainWindow, {
		properties: ["openDirectory", "createDirectory"],
	})
	return result.filePaths
})

ipcMain.handle("config:test", async (_: Electron.IpcMainInvokeEvent, cfg: Config): Promise<boolean> => {
	return new Account(cfg).testCredentials()
})

let AccountInstance: Account | null = null

ipcMain.handle(
	"account:analyze",
	async (_: Electron.IpcMainInvokeEvent, cfg: Config): Promise<AccountAnalysisResponse> => {
		if (!AccountInstance) {
			AccountInstance = new Account(cfg)
		}
		return AccountInstance.analyze()
	}
)

ipcMain.handle("account:analyze-stop", async () => {
	if (AccountInstance) {
		AccountInstance.stop()
	}
})

ipcMain.handle("store:analyze", async (_: Electron.IpcMainInvokeEvent, cfg: Store): Promise<StoreAnalysisResponse> => {
	return analyzeStore(cfg)
})

let BackupInstance: Backup | null = null

ipcMain.handle("backup:run", async (_: Electron.IpcMainInvokeEvent, cfg: Config) => {
	const logger = (msg: string) => {
		mainWindow!.webContents.send("log", msg)
	}
	const progressFn = (total: number, progress: number) => {
		mainWindow!.webContents.send("download-progress", total, progress)
	}
	BackupInstance = new Backup(cfg, logger, progressFn)
	mainWindow?.webContents.send("log", "Starting backup")
	return BackupInstance.Run()
})

ipcMain.handle("backup:stop", async () => {
	if (BackupInstance) {
		BackupInstance.stop()
	}
})
