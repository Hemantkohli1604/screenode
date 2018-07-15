const electron = require('electron');
const url = require('url');
const path = require('path');
const ipc = electron.ipcMain;

const {app,BrowserWindow} = electron;
let mainWindow;
let prefWindow;

app.setPath("userData", __dirname + "/saved_recordings");

app.on('ready',function(){
	mainWindow = new BrowserWindow({width: 1024,hieght: 768,backgroundColor: '#3F5A6C',icon: 'avatar.png'});
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname,'mainWindow.html'),
		protocol: 'file:',
		slashes: true
	}));
	mainWindow.openDevTools()

	prefWindow = new BrowserWindow({width: 512,hieght: 325,backgroundColor: '#3D637C',show: false,parent: mainWindow,modal: true});
	prefWindow.loadURL(url.format({
		pathname: path.join(__dirname,'prefWindow.html'),
		protocol: 'file:',
		slashes: true
	}));
/*	
	ipc.on('show-pref', function(){
		prefWindow.show()
	}) 

	ipc.on('hide-pref', function(){
		prefWindow.hide()
	})
*/	

	ipc.on('toggle-pref',function(){
		if (prefWindow.isVisible())
			prefWindow.hide()
		else
		prefWindow.show()
	})
	
	mainWindow.on('closed', function(){
		mainWindow = null
	})
	prefWindow.on('closed', function(){
		prefWindow = null
	})
});

app.on('window-all-closed', function(){
	if(process.platform !== 'darwin'){
	app.quit();
	}
  })