const {app, BrowserWindow, ipcMain, dialog, session} = require('electron')
const url = require('url')
const path = require('path')
const {download} = require("electron-dl");
const {DOMAIN} = require('./js/const.js')

let win

function createWindow(){

	// This defines the application window
	win = new BrowserWindow({
		minWidth: 1024, 
		minHeight: 800,
		//maxWidth: 1400,
		width: 1024,
		height: 800, 
		icon: 'graphics/GryphEnergySmall.png'
	})
	
	// These declaritions initalize the window and define what to do on close
	win.loadURL(url.format({
    	pathname: path.join(__dirname, 'index.html'),
    	protocol: 'file:',
    	slashes: true
	}))

	win.on('closed', () => {
		win = null
	})

	// This is a handler for downloading recording files
	ipcMain.on("download", (event, info) => {
        download(win, info.url, info.properties)
            .then(dl => win.webContents.send("download complete", dl.getSavePath()))
    });


	// This is a handler for setting a cookie
    ipcMain.on("setCookie", (event, info) =>{
    	session.defaultSession.cookies.set({
	        url: 'http://' + DOMAIN, //the url of the cookie.
	        name: info.name, // a name to identify it.
	        value: info.data, // the value that you want to save
	        expirationDate: info.exptime,
    	}, (error) => {
    		if (error) console.error(error)
    	})
    });

    // This is a handler for accessing the JWT cookie
    ipcMain.on("authCookie", (event, info) => {
    	variable = session.defaultSession.cookies.get({
    		name: "jwt"
    	}, (error, cookies) => {
    		win.webContents.send("authCookieReturn", cookies)
    	});

    });
}

// These declarations start the application,
// tell it when to quit, and what to do on activate
app.on('ready', createWindow)

app.on('window-all-closed', () => {
	if(process.platform !== 'darwin'){
		app.quit()
	}
})

app.on('activate', () => {
	if(win === null){
		createWindow()
	}
})