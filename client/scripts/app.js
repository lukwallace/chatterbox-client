// YOUR CODE HERE:
var filter = {};
var app = {};
app.friendList = {};
app.server = 'https://api.parse.com/1/classes/messages';
app.user = window.location.href.slice(68);
app.roomname = 'lobby';

app.send = function(message) {
  $.ajax({
  // This is the url you should use to communicate with the parse API server.
    url: app.server,
    type: 'POST',
    data: JSON.stringify(message),
    contentType: 'application/json',
    success: function (data) {
      console.log('chatterbox: Message sent', data);
    },
    error: function (data) {
      // See: https://developer.mozilla.org/en-US/docs/Web/API/console.error
      console.error('chatterbox: Failed to send message', data);
    }
  });
};

app.fetch = function(callback, params) {
  var base = params === undefined ? filter : $.extend(filter, params);
  var where = '&where=' + JSON.stringify(base);
  var order = '?order=-updatedAt';
  $.ajax({
    url: app.server + order + where,
    type: 'GET',
    dataType: 'json',
    success: function(data) {
      callback(data);
    },
    error: function(err) {
      console.error('chatterbox: Failed to get message', err);
    }
  });
};

app.clearMessages = function() {
  $('#chats').empty();
};

app.renderMessage = function(message) {
  var $userName = $('<a class="username" >' + message.username + '</a>' );
  $userName.click(app.handleUsernameClick.bind(null, message.username));
  var $message = $('<div></div>');
  var $text = $('<h3></h3>').text(message.text);
  var $time = $('<h3>' + message.updatedAt + '</h3>');
  $message.append($userName);
  $message.append($text);
  $message.append($time);
  $('#chats').append($message);
};

app.init = function () {
  var $button = $('.submit');
  var $textbox = $('#message');
  $('#send').on('submit', function(event) {
    event.preventDefault();
    app.handleSubmit($textbox.val());
    $textbox.val('');
  });
  app.fetch( function(obj) {
    var messages = obj.results;
    for (var i = 0; i < messages.length; i++) {
      app.renderMessage(messages[i]);
      app.renderRoom(messages[i].roomname);
    }
  });
  // app.renderRoom(app.roomname);
};

app.renderRoom = function(roomName) {
  var $newRoom = $('<option value=\"' + roomName + '\">' + roomName + '</option>');
  $('#roomSelect').append($newRoom);
};

app.handleUsernameClick = function(username) {
  app.friendList[username] = 1;
};

app.handleSubmit = function(text) {
  var message = {
    username: app.user,
    text: text,
    roomname: app.roomname
  };
  app.send(message);
};

$(document).ready(app.init);
