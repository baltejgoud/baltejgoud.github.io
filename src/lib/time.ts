const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Local time in Hyderabad, e.g. "12:00 IST". */
export function hyderabadTime(date: Date): string {
  return `${formatter.format(date)} IST`;
}
