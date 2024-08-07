import { app, BrowserWindow, dialog, ipcMain, shell } from "electron"
import { renderString } from "nunjucks"
import path from "path"
import {
	AlbumImageType,
	AlbumsImagesResponse,
	AlbumsResponse,
	AlbumType,
	CurrentUserResponse,
	makeApiCall,
	UserResponse,
} from "./api"
import { Auth, Config } from "./config"
import { AccountAnalysisResponse } from "./types"

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

ipcMain.handle("account:analyze", async (event, cfg: Config): Promise<AccountAnalysisResponse> => {
	let url = baseUrl + "/api/v2!authuser"
	let currentUser: string
	try {
		const res = await makeApiCall<CurrentUserResponse>(url, cfg.auth)
		if (res.Code !== 200) {
			console.log("account:analyze wrong response:", res)
			return { IsValid: false }
		}
		currentUser = res.Response.User.NickName
	} catch (err) {
		console.error("account:analyze error:", err)
		return { IsValid: false }
	}

	let userAlbumsURI: string
	url = baseUrl + "/api/v2/user/" + currentUser
	try {
		const res = await makeApiCall<UserResponse>(url, cfg.auth)
		if (res.Code !== 200) {
			console.log("account:analyze wrong response:", res)
			return { IsValid: false }
		}
		userAlbumsURI = res.Response.User.Uris.UserAlbums.Uri
	} catch (err) {
		console.error("account:analyze error:", err)
		return { IsValid: false }
	}

	const albums = await getAlbums(cfg.auth, userAlbumsURI)

	let numImages = 0
	for (const album of albums) {
		const images = await getAlbumImages(cfg, album.Uris.AlbumImages.Uri, album.UrlPath)
		numImages += images.length
	}
	return { IsValid: true, Content: { Albums: albums.length, Images: numImages } }
})

async function getAlbums(cfg: Auth, firstURI: string): Promise<AlbumType[]> {
	let uri = firstURI
	let albums: AlbumType[] = []

	while (uri) {
		const res = await makeApiCall<AlbumsResponse>(baseUrl + uri, cfg)
		if (res.Code !== 200) {
			console.log("getAlbums wrong response:", res)
			throw new Error("Invalid credentials")
		}

		albums.push(...res.Response.Album)
		if (!res.Response.Pages.NextPage) {
			break
		}
		uri = res.Response.Pages.NextPage
	}

	return albums
}

async function getAlbumImages(cfg: Config, firstURI: string, albumPath: string): Promise<AlbumImageType[]> {
	let uri = firstURI
	let images: AlbumImageType[] = []

	while (uri) {
		const res = await makeApiCall<AlbumsImagesResponse>(baseUrl + uri, cfg.auth)
		if (res.Code !== 200) {
			console.log("getAlbumImages wrong response:", res)
			throw new Error("Invalid credentials")
		}

		// If the album is empty, a.Response.AlbumImage is missing instead of an empty array (weird...)
		if (!res.Response.AlbumImage) {
			console.log("album is empty: ", albumPath)

			break
		}

		// Loop over response in inject the albumPath and then append to the images
		for (const img of res.Response.AlbumImage) {
			img.AlbumPath = albumPath

			const fname = buildFilename(img, cfg.store.file_names)
			if (!fname) {
				console.log("cannot build image filename")
			}
			img.builtFilename = fname
			images.push(img)
		}
		if (!res.Response.Pages.NextPage) {
			break
		}
		uri = res.Response.Pages.NextPage
	}

	return images
}

function buildFilename(img: AlbumImageType, templateString: string): string {
	const replacementVars = {
		FileName: img.FileName,
		ImageKey: img.ImageKey,
		ArchivedMD5: img.ArchivedMD5,
		UploadKey: img.UploadKey,
	}

	return renderString(templateString, replacementVars)
}
