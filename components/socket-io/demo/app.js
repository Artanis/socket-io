(function(document) {
  'use strict';

  var app = document.querySelector('#app');

  app.TYPING_DELAY = 400;
  app.https = window.location.protocol === 'https:';
  app.signedIn = false;
  app.messages = [];
  app.typing = [];

  var escapeHtml = function(untrustedStr) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(untrustedStr));
    return div.innerHTML;
  };

  // Communicate with chat.socket.io
  //
  // * `add user` - login
  // * `new message` - send chat message
  // * `typing` - client is typing
  // * `stop typing` - client has stopped typing, or has sent his message

  app.signIn = function() {
    app.inputNickname.validate();

    if(!app.inputNickname.invalid) {
      // tell server the user's name
      app.$.chatserver.send('add user', escapeHtml(app.nickname));

      // set input label
      app.chatMessageLabel = 'Chatting as '+ app.nickname;

      // close splash/login dialog and show the chat ui
      app.$.splash.close();
      app.signedIn = true;

      app.$.chatlogNewest.scrollIntoView();
    }
  };

  app.send = function() {
    if(app.signedIn && app.newMessage) {
      // Sanitize the input string.
      var sanitizedMessage = escapeHtml(app.newMessage);
      app.set('newMessage', '');

      // Broadcast it.
      app.$.chatserver.send('new message', sanitizedMessage);

      // we don't get it back, so add it manually
      app.handleNewMessage({
        timeStamp: new Date()
      }, {
        username: app.nickname,
        message: sanitizedMessage
      });
    }
  };

  app.handleClientTyping = function(e, detail) {
    if(app.signedIn) {
      if(app._typingTimeout !== undefined) {
        window.clearTimeout(app._typingTimeout);
      }

      app.$.chatserver.send('typing');
      app._typingTimeout = window.setTimeout(function() {
        app.$.chatserver.send('stop typing');
        delete app._typingTimeout;
      }, app.TYPING_DELAY);
    }
  };

  // Handle socket-io events:
  //
  // * `login` - this user has logged in
  // * `user joined` - another user has logged in
  // * `user left` - another user has logged off
  // * `new message` - another user has sent a message
  // * `typing` - another user is typing
  // * `stop typing` - another user has stopped typing

  app.handleLogin = function(e, detail) {
    // console.log(
    //   "login",
    //   new Date(e.timeStamp).toLocaleString(),
    //   "there are now "+detail.numUsers+" participants"
    // );
  };

  app.handleUserJoined = function(e, detail) {
    // console.log(
    //   "user joined",
    //   new Date(e.timeStamp).toLocaleString(),
    //   detail.username
    // );
  };

  app.handlerUserLeft = function(e, detail) {
    // console.log(
    //   "user left",
    //   new Date(e.timeStamp).toLocaleString(),
    //   detail.username
    // );
  };

  app.handleNewMessage = function(e, detail) {
    var log = app.$.chatLog;
    var keepScroll = log.scrollTop + log.clientHeight >= log.scrollHeight;
    var message = {
      name: escapeHtml(detail.username),
      message: escapeHtml(detail.message),
      timestamp: new Date(e.timeStamp),
    };

    // console.log('new message', message);
    app.push('messages', message);

    // Scroll to new bottom (if *at* bottom)
    if(!keepScroll) {
      app.$.chatlogNewest.scrollIntoView();
    }
  };

  app.handleTyping = function(e, detail) {
    var time = new Date(e.timeStamp);
    var user = detail.username;

    // console.log("typing", time.toLocaleString(), user);
    if(!app.typing.includes(user)) {
      app.push('typing', user);
    }
  };

  app.handleStopTyping = function(e, detail) {
    // console.log(
    //   "stop typing",
    //   new Date(e.timeStamp).toLocaleString(),
    //   detail.username
    // );
    app.splice('typing', app.typing.indexOf(detail.username), 1);
  };

  app.addEventListener('dom-change', function () {
    app.$.splash.open();
    app.inputNickname = app.$.inputNickname;
    app.inputMessage = app.$.inputMessage;
  });

})(document);
