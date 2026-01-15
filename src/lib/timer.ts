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

  /**
   * Get formatted runtime string in HH:MM:SS:MS format
   *
   * @return {string}
   */
  getFormattedRuntime = (): string => {
    const diffMs = Date.now() - this.startTime;
    const ms = diffMs % 1000;
    const totalSeconds = Math.floor(diffMs / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}:${String(ms).padStart(2, "0")}`;
  };

  /**
   * Get ISO timestamp for start time
   *
   * @return {string}
   */
  getStartTime = (): string => {
    return new Date(this.startTime).toISOString();
  };

  /**
   * Get ISO timestamp for current time
   *
   * @return {string}
   */
  getCurrentTime = (): string => {
    return new Date().toISOString();
  };
}

export { Timer };
