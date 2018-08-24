window.addEventListener('load', () => {

    const chatTemplate = Handlebars.compile($('#chat-template').html());
    const chatContentTemplate = Handlebars.compile($('#chat-content-template').html());
    const chatEl = $('#chat');
    const formEl = $('.form');
    const messages = [];
    let username;

    var socket = io.connect('http://localhost:8080');

    socket.on('connectionReady', function (sessionId) {
        console.log("session");
        console.log(sessionId);
      });

      const updateChatMessages = () => {
        const html = chatContentTemplate({ messages });
        const chatContentEl = $('#chat-content');
        chatContentEl.html(html);
        // automatically scroll downwards
        const scrollHeight = chatContentEl.prop('scrollHeight');
        chatContentEl.animate({ scrollTop: scrollHeight }, 'slow');
      };
    
      // Post Local Message
      const postMessage = (message) => {
        const chatMessage = {
          username,
          message,
          postedOn: new Date().toLocaleString('en-GB'),
        };
        // Send to all peers
        webrtc.sendToAll('chat', chatMessage);
        // Update messages locally
        messages.push(chatMessage);
        $('#post-message').val('');
        updateChatMessages();
      };
    
      // Display Chat Interface
      const showChatRoom = (room) => {
        formEl.hide();
        const html = chatTemplate({ room });
        chatEl.html(html);
        const postForm = $('form');
        postForm.form({
          message: 'empty',
        });
        $('#post-btn').on('click', () => {
          const message = $('#post-message').val();
          postMessage(message);
        });
        $('#post-message').on('keyup', (event) => {
          if (event.keyCode === 13) {
            const message = $('#post-message').val();
            postMessage(message);
          }
        });
      };
    
      // Register new Chat Room
      const createRoom = (roomName) => {
        // eslint-disable-next-line no-console
        console.info(`Creating new room: ${roomName}`);
        webrtc.createRoom(roomName, (err, name) => {
          formEl.form('clear');
          showChatRoom(name);
          postMessage(`${username} created chatroom`);
        });
      };
    
      // Join existing Chat Room
      const joinRoom = (roomName) => {
        // eslint-disable-next-line no-console
        console.log(`Joining Room: ${roomName}`);
        webrtc.joinRoom(roomName);
        showChatRoom(roomName);
        postMessage(`${username} joined chatroom`);
      };
    
      // Receive message from remote user
      webrtc.connection.on('message', (data) => {
        if (data.type === 'chat') {
          const message = data.payload;
          messages.push(message);
          updateChatMessages();
        }
      });

});    