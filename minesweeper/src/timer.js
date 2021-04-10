import React from 'react';

class Timer extends React.Component {
  constructor() {
    super();
    this.state = { time: {}, seconds: 1 };
    this.timer = 0;
    this.startTimer = this.startTimer.bind(this);
    this.countUp = this.countUp.bind(this);
  }

  secondsToTime(secs){
    let hours = Math.floor(secs / (60 * 60));

    let divisor_for_minutes = secs % (60 * 60);
    let minutes = Math.floor(divisor_for_minutes / 60);

    let divisor_for_seconds = divisor_for_minutes % 60;
    let seconds = Math.ceil(divisor_for_seconds);

    let obj = {
      "h": hours,
      "m": minutes,
      "s": seconds
    };
    return obj;
  }

  componentDidMount() {
    //let timeLeftVar = this.secondsToTime(this.state.seconds);
    this.setState({ time: 0 });
  }

  startTimer() {
    if (this.timer == 0 && this.state.seconds > 0) {
      this.timer = setInterval(this.countUp, 1000);
    }
  }

  countUp() {
    // Remove one second, set state so a re-render happens.
    let seconds = this.state.seconds + 1;
    this.setState({
      time: this.secondsToTime(seconds),
      seconds: seconds,
    });
    
    // Check if we're at zero.
    //if (seconds == 0) { 
      //clearInterval(this.timer);
    //}
  }

  render() {
    this.startTimer();
    return(
      <div>
        Time: {this.state.time.m} : {this.state.time.s}
      </div>
    );
  }
}

export default Timer;

//<button onClick={this.startTimer}>Start</button>