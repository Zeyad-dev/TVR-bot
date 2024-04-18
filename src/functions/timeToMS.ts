export function timeToMilliseconds(timeToConvert: string): number | null {
  let finalTime = 0;
  const arrs = timeToConvert.split(" ");
  arrs.forEach((str) => {
    if (str.toLocaleLowerCase().includes("w")) {
      const newStr = str.replace("w", "");
      return (finalTime = finalTime + Number(newStr) * 604800000);
    }
    if (str.toLocaleLowerCase().includes("d")) {
      const newStr = str.replace("d", "");
      return (finalTime = finalTime + Number(newStr) * 86400000);
    }
    if (str.toLocaleLowerCase().includes("h")) {
      const newStr = str.replace("h", "");
      return (finalTime = finalTime + Number(newStr) * 3600000);
    }
    if (str.toLocaleLowerCase().includes("m")) {
      const newStr = str.replace("m", "");
      return (finalTime = finalTime + Number(newStr) * 60000);
    }
  });
  return finalTime == 0 ? null : finalTime;
}