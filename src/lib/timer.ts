class Timer {
  startTime;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Get the time elapsed since the timer was started
   *
   * @return {number}
   */
  getElapsedTime = () => {
    const diffMs = Date.now() - this.startTime;
    const diffSec = Math.floor(diffMs / 1000);

    const minutes = Math.floor(diffSec / 60);
    const seconds = diffSec % 60;

    return {
      minutes,
      seconds,
    };
  };
}

export { Timer };
