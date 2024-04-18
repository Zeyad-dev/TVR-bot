export function millisecondsToReadableTime(seconds: number): string {
  if (seconds === 0) return "No slowmode";
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;

  const minutes = Math.floor(seconds / 60);

  const remainingSeconds = seconds % 60;

  let timeString = "";
  if (hours > 0) {
    timeString += hours === 1 ? "1 hour" : `${hours} hours`;
  }
  if (minutes > 0) {
    if (timeString !== "") timeString += ", ";
    timeString += minutes === 1 ? "1 minute" : `${minutes} minutes`;
  }
  if (remainingSeconds > 0) {
    if (timeString !== "") timeString += ", ";
    timeString +=
      remainingSeconds === 1 ? "1 second" : `${remainingSeconds} seconds`;
  }
  return timeString;
}
