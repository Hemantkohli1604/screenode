const electron = require('electron')
const {remote} = electron
const ipc = electron.ipcRenderer
const {Menu}  = remote.require('electron')
const {desktopCapturer}  = require('electron')

const mainMenuTemplate = [
	{
        label:'Electron',
        submenu: [
            {
                label: 'Share Screen',
                click: function (){
                    ipc.send('toggle-pref')
                }
            }
        ]    
	}
]

const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
Menu.setApplicationMenu(mainMenu);

//Page View

$(document).ready(function (e) {
    $('button#showPage2Btn').hide();
    $('button#showPage4Btn').hide();
    $('button#showPage3Btn').hide();
    //$('button#showPage4Btn').hide();
    function showView(viewName) {
        $('.view').hide();
        $('#' + viewName).show();      
  }
  
    $('[data-launch-view]').click(function (e) {
        e.preventDefault();
        var viewName = $(this).attr('data-launch-view');
        console.log(viewName)
        if (viewName === 'page2'){
          $('button#showPage2Btn').hide();
          $('button#showPage4Btn').hide();
          $('button#showPage3Btn').show(); 
          //toggle();
          showView(viewName);
        } 
        showView(viewName);
    });
  });

// Form Element  
  const formEl = $('.form');
  formEl.form({
    fields: {
      roomName: 'empty',
      username: 'empty',
    },
  });

  $('.submit').on('click', (event) => {
    if (!formEl.form('is valid')) {
      return false;
    }
    username = $('#username').val();
    const roomName = $('#roomName').val().toLowerCase();
    if (event.target.id === 'create-btn') {
      //createRoom(roomName);
      $('button#showPage2Btn').show();
    } else {
      //joinRoom(roomName);
      $('button#showPage4Btn').show();
    }
    return false;
  });