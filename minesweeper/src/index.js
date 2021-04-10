import React from 'react';
import ReactDOM from 'react-dom';
import Board from './components/Board';
import $ from 'jquery';
import './index.css';

//const clientSource = require('./Client')

class Game extends React.Component {
  state = {
    height: 8,
    width: 8,
    mines: 10,
  };

  render() {
    const { height, width, mines } = this.state;
    return (
      <div className="game">
        <Board height={height} width={width} mines={mines} minesLocation={this.props.minesLoc} />
      </div>
    );
  }
}

function startGame(minesLocation){
  ReactDOM.render(<Game minesLoc={minesLocation} />, document.getElementById("root"));
}
function clearGame(){
  ReactDOM.render(<p> </p>, document.getElementById("root"));
}
//ReactDOM.render(<button onClick={startGame}>Start Game</button>, document.getElementById("gameButton"));

$ ( function () {

  // for better performance - to avoid searching in DOM
  var content = $('#content');
  var input = $('#input');
  var status = $('#status');
  var varGameButton = $('#gameButton');
  var varUserButton = $('#userButton');
  var varNewGameButton = $('#newGameButton');
  // my name sent to the server
  var myName = false;
  var minesLoc = [];


  // if user is running mozilla then use it's built-in WebSocket
  window.WebSocket = window.WebSocket || window.MozWebSocket;

  // if browser doesn't support WebSocket, just show some notification and exit
  if (!window.WebSocket) {
      content.html($('<p>', { text: 'Sorry, but your browser doesn\'t '
                                  + 'support WebSockets.'} ));
      input.hide();
      $('span').hide();
      return;
  }

  // open connection
  var connection = new WebSocket('ws://127.0.0.1:1337');

  var userButton = document.getElementById("userButton");
  userButton.addEventListener("click", userButtonClick);
  var gameButton = document.getElementById("gameButton");
  gameButton.addEventListener("click", gameButtonClick);
  var newGameButton = document.getElementById("newGameButton");
  newGameButton.addEventListener("click", newGameButtonClick);

  function gameButtonClick() {
    startGame(minesLoc);
    //connection.send('mines');
    varGameButton.attr('disabled', 'disabled');
    varNewGameButton.removeAttr('disabled');
  };
  function newGameButtonClick() {
    clearGame();

    //startGame(minesLoc);
    connection.send('mines');
    varGameButton.removeAttr('disabled');
    varNewGameButton.attr('disabled', 'disabled');
  };
  function userButtonClick() {
      var msg = document.getElementById("input").value;
      if (!msg) {
          return;
      }
      // send the message as an ordinary text
      connection.send(msg);
      
      document.getElementById("input").value = "";
      
      // disable the input field to make the user wait until server
      // sends back response
      input.attr('disabled', 'disabled');

      // we know that the first message sent from a user their name
      if (myName === false) {
          myName = msg;
      }
     status.text('Button Clicked');
     varUserButton.attr('disabled', 'disabled');
     varGameButton.removeAttr('disabled');
  };

  connection.onopen = function () {
      // first we want users to enter their names
      input.removeAttr('disabled');
      status.text('Choose name:');
  };

  connection.onerror = function (error) {
      // just in there were some problems with conenction...
      content.html($('<p>', { text: 'Sorry, but there\'s some problem with your '
                                  + 'connection or the server is down.' } ));
  };


  // Incoming messages
  connection.onmessage = function (message) {
      try {
          var json = JSON.parse(message.data);
      } catch (e) {
          console.log('This doesn\'t look like a valid JSON: ', message.data);
          return;
      }

      if (json.type === 'name') {
          status.text(json.data);
          console.log(json.data);
          connection.send('mines');

      } else if (json.type === 'mines'){
          minesLoc = json.data;
          //export default minesLoc({minesLoc});
          console.log(json.data);

      } else {
          console.log('Hmm..., I\'ve never seen JSON like this: ', json);
      }
  };

 /**
  * This method is optional. If the server wasn't able to respond to the
  * in 3 seconds then show some error message to notify the user that
  * something is wrong.
  */
  setInterval(function() {
      if (connection.readyState !== 1) {
          status.text('Error');
          input.attr('disabled', 'disabled').val('Unable to comminucate '
                                              + 'with the WebSocket server.');
      }
  }, 3000);

});