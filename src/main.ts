import { app, BrowserWindow, dialog, ipcMain, shell } from "electron"
import path from "path"
import { AlbumsResponse, AlbumType, CurrentUserResponse, makeApiCall, UserResponse } from "./api"
import { Auth } from "./config"

const baseUrl = "https://api.smugmug.com"

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

ipcMain.handle("config:test", async (event, cfg: Auth): Promise<boolean> => {
	const url = baseUrl + "/api/v2!authuser"
	try {
		const res = await makeApiCall<CurrentUserResponse>(url, cfg)
		if (res.Code !== 200) {
			console.log("config:test wrong response:", res)
			return false
		}
		return true
	} catch (err) {
		console.error("config:test error:", err)
		return false
	}
})

type AccountAnalysisResponse = {
	IsValid: boolean
	Content: string
}

ipcMain.handle("account:analyze", async (event, cfg: Auth): Promise<AccountAnalysisResponse> => {
	let url = baseUrl + "/api/v2!authuser"
	let currentUser: string
	try {
		const res = await makeApiCall<CurrentUserResponse>(url, cfg)
		if (res.Code !== 200) {
			console.log("account:analyze wrong response:", res)
			return { IsValid: false, Content: "Invalid credentials" }
		}
		currentUser = res.Response.User.NickName
	} catch (err) {
		console.error("account:analyze error:", err)
		return { IsValid: false, Content: "Invalid credentials" }
	}

	let userAlbumsURI: string
	url = baseUrl + "/api/v2/user/" + currentUser
	try {
		const res = await makeApiCall<UserResponse>(url, cfg)
		if (res.Code !== 200) {
			console.log("account:analyze wrong response:", res)
			return { IsValid: false, Content: "Invalid credentials" }
		}
		userAlbumsURI = res.Response.User.Uris.UserAlbums.Uri
	} catch (err) {
		console.error("account:analyze error:", err)
		return { IsValid: false, Content: "Invalid credentials" }
	}

	const albums = await getAlbums(cfg, userAlbumsURI)

	return { IsValid: true, Content: JSON.stringify(albums) }
})

async function getAlbums(cfg: Auth, firstURI: string): Promise<AlbumType[]> {
	let uri = firstURI
	let albums: AlbumType[] = []

	while (uri !== "") {
		console.log("getAlbums uri:", uri)
		const res = await makeApiCall<AlbumsResponse>(baseUrl + uri, cfg)
		if (res.Code !== 200) {
			console.log("getAlbums wrong response:", res)
			throw new Error("Invalid credentials")
		}

		albums.push(...res.Response.Album)
		if (res.Response.Pages.NextPage === undefined) {
			break
		}
		uri = res.Response.Pages.NextPage
	}

	return albums
}
