// YOUR CODE HERE:
var filter = {};
var defaultRoom = 'lobby';
var app = {};
app.friendList = {};
app.server = 'https://api.parse.com/1/classes/messages';
app.user = window.location.href.slice(window.location.href.indexOf('username=') + 9);
app.roomList = {};

app.send = function(message, callback) {
  $.ajax({
  // This is the url you should use to communicate with the parse API server.
    url: app.server,
    type: 'POST',
    data: JSON.stringify(message),
    contentType: 'application/json',
    success: function (data) {
      console.log('chatterbox: Message sent', data);
      callback();
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

app.renderMessage = function(message, mode) {
  var $userName = $('<a class="username" ></a>' );
  $userName.text(message.username);
  $userName.click(app.handleUsernameClick.bind(null, $userName.text()));
  var $message = $('<div></div>');
  $message.addClass('chat');
  var $text = $('<h3></h3>').text(message.text);
  var $time = $('<h3></h3>').text(message.updatedAt);
  var $room = $('<h3></h3>').text(message.roomname);
  $message.append($userName);
  $message.append($text);
  $message.append($time);
  $message.append($room);
  if ( mode ) {
    $('#chats').prepend($message);
  } else {
    $('#chats').append($message);
  }
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
    app.renderRoom(defaultRoom);
    var messages = obj.results;
    for (var i = 0; i < messages.length; i++) {
      if (messages[i].roomname === defaultRoom) {
        app.renderMessage(messages[i]);
      }
      app.renderRoom(messages[i].roomname);
    }
  });
};

app.changeRoom = function(value) {
  app.clearMessages();
  filter = {roomname: value};
  app.fetch(function(obj) {
    for (var i = 0; i < obj.results.length; i++) {
      app.renderMessage(obj.results[i]);
    }
  });
};

app.renderRoom = function(roomName) {
  if (!(roomName in app.roomList)) {
    var $newRoom = $('<option></option>');
    var $pocket = $('<span></span>').text(roomName);
    var escaped = $pocket.text(roomName).html();
    $newRoom.attr('value', escaped);
    $newRoom.text(roomName);
    $('#roomSelect').append($newRoom);
    app.roomList[roomName] = 1;
  }
};

app.handleUsernameClick = function(username) {
  $('.username').each(function () {
    if ($(this).text() === username) {
      $(this).toggleClass('friend');
    }
  });
  app.friendList[username] = 1;
};

app.handleSubmit = function(text) {
  var message = {
    username: app.user,
    text: text,
    roomname: filter.roomname || defaultRoom
  };
  app.send(message, app.refresh);
};

app.refresh = function() {
  var currentTime = $('#chats :first :nth-child(3)').text();
  var params = {updatedAt: {$gt: currentTime}};
  app.fetch( function(obj) {
    var messages = obj.results;
    for (var i = 0; i < messages.length; i++) {
      app.renderMessage(messages[i], true);
    }
  }, params);
};

$(document).ready(app.init);
