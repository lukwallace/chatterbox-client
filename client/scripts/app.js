// YOUR CODE HERE:
var filter = {};
var defaultRoom = 'lobby';
var app = {};
app.friendList = {};
app.server = 'https://api.parse.com/1/classes/messages';
app.user = window.location.href.slice(window.location.href.indexOf('username=') + 9);
app.roomList = {};
var refreshing = false;
var latestMessageTimeStamp;

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
  console.log(params);
  console.log(filter);
  var base = params === undefined ? filter : $.extend(filter, params);
  var where = '&where=' + JSON.stringify(base);
  var order = '?order=-updatedAt';
  $.ajax({
    url: app.server + order + where,
    type: 'GET',
    dataType: 'json',
    success: function(data) {
      console.log(data);
      latestMessageTimeStamp = data.results[0] ? data.results[0].updatedAt : latestMessageTimeStamp;
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
  if (app.friendList[$userName.text()]) {
    $userName.addClass('friend');
  }
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
  var temp = $('#main').offset();
  $('#chats').css('margin-top', 272);
  $('#main').css('position', 'fixed').css('top', 0).css('left', temp.left);

  $(window).scroll(function() {
    // console.log($(window).scrollTop());
    if ($(window).scrollTop() === 0 && !refreshing) {
      $(window).scrollTop(5);
      console.log('refreshing...');
      app.refresh();
    }
  });

  
  $('#send').on('submit', function(event) {
    event.preventDefault();
    if ($('#message').val() !== '') {
      app.handleSubmit($('#message').val());
      $('#message').val('');
    }
  });
  
  app.fetch( function(obj) {
    app.renderRoom('New Room...');
    var messages = obj.results;
    for (var i = 0; i < messages.length; i++) {
      if (messages[i].roomname === defaultRoom) {
        app.renderMessage(messages[i]);
      }
      app.renderRoom(messages[i].roomname);
    }

    $('#roomSelect').val(defaultRoom);
  });
};

app.changeRoom = function(value, event) {
  if ($('#roomSelect').prop('selectedIndex') === 0) {
    var newRoomName = prompt('Give a new room name...');
    if (newRoomName) {
      app.renderRoom(newRoomName);
      filter = {roomname: newRoomName};
      $('#roomSelect').val(newRoomName);
      app.clearMessages();
    }
  } else {
    refreshing = true;
    app.clearMessages();
    filter = {roomname: value};
    app.fetch(function(obj) {
      for (var i = 0; i < obj.results.length; i++) {
        app.renderMessage(obj.results[i]);
      }
      refreshing = false;
    });
  }
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
  app.friendList[username] = !app.friendList[username];
  $('.username').each(function () {
    if ($(this).text() === username) {
      $(this).toggleClass('friend');
    }
  });
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
  refreshing = true;
  // var currentTime = $('#chats :first :nth-child(3)').text();
  // if (currentTime === '') {
  //   ;
  // }
  var params = {updatedAt: {$gt: latestMessageTimeStamp}};
  app.fetch( function(obj) {
    var messages = obj.results;
    for (var i = messages.length - 1; i > -1; i--) {
      app.renderMessage(messages[i], true);
    }
    refreshing = false;
  }, params);
};

$(document).ready(app.init);
