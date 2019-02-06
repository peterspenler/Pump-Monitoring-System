const {app, BrowserWindow, ipcMain} = require('electron')
const url = require('url')
const path = require('path')
const {download} = require("electron-dl");
const { dialog } = require('electron')
const { session } = require('electron')
//require('./login.js')

let win

function createWindow(){

	win = new BrowserWindow({
		minWidth: 1024, 
		minHeight: 800,
		width: 1024,
		height: 800, 
		icon: 'graphics/GryphEnergySmall.png'
	})

	//win.setResizable(false)
	
	win.loadURL(url.format({
    	pathname: path.join(__dirname, 'index.html'),
    	protocol: 'file:',
    	slashes: true
	}))

	win.on('closed', () => {
		win = null
	})

	ipcMain.on("download", (event, info) => {
        download(win, info.url, info.properties)
            .then(dl => win.webContents.send("download complete", dl.getSavePath()))
    });

    ipcMain.on("setCookie", (event, info) =>{
    	session.defaultSession.cookies.set({
	        url: "http://localhost:5000", //the url of the cookie.
	        name: info.name, // a name to identify it.
	        value: info.data, // the value that you want to save
	        expirationDate: info.exptime,
    	}, (error) => {
    		if (error) console.error(error)
    	})
    });

    ipcMain.on("authCookie", (event, info) => {
    	variable = session.defaultSession.cookies.get({
    		name: "jwt"
    	}, (error, cookies) => {
    		win.webContents.send("authCookieReturn", cookies)
    	});

    });
}

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