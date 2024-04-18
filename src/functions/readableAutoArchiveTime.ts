export function readableAutoArchiveTime(duration: number) {
  if (duration === 1440) return "One day";
  if (duration === 60) return "One hour";
}
