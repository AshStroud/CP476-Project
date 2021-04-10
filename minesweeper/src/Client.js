import $ from 'jquery';
//import module from 'commonjs';

//var minesLoc = [];
//module.exports.minesLoc = json.data;

$ ( function () {

    // for better performance - to avoid searching in DOM
    var content = $('#content');
    var input = $('#input');
    var status = $('#status');

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

    // var gameButton = document.getElementById("gameButton");
    // gameButton.addEventListener("click", gameButtonClick);

    // function gameButtonClick() {

    // };
    // function getMinesLoc(){
    //     return minesLoc;
    // }

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
            console.log(minesLoc);
            export default minesLoc;
            //module.exports = json.data;
            
            //arr = json.data;
            //len = arr.length;
            //console.log("MinesLocLen: " + len.toString());
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