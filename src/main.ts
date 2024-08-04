import { app, BrowserWindow, dialog, ipcMain, shell } from "electron"
import path from "path"
import { Auth } from "./config"
import Oauth from "./oauth"

const baseUrl = "https://api.smugmug.com/api/v2"

let mainWindow: BrowserWindow | null

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
	app.quit()
}

const createWindow = () => {
	// Create the browser window.
	mainWindow = new BrowserWindow({
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
	mainWindow.webContents.openDevTools()
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

ipcMain.handle("config:test", async (event, cfg: Auth) => {
	const url = baseUrl + "!authuser"
	const oauth = new Oauth(cfg.api_key, cfg.api_secret, cfg.user_token, cfg.user_secret)
	const h = oauth.authorizationHeader(url)

	let res = false
	await fetch(url, {
		headers: {
			Accept: "application/json",
			Authorization: h,
		},
	})
		.then(res => res.json())
		.then(json => {
			if (json.Code !== 200) {
				console.log("config:test wrong response:", json)
				res = false
				return
			}
			res = true
		})
		.catch(err => {
			console.error("config:test error:", err)
			res = false
		})

	return res
})
