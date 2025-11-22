/**
 * Parse time from a text description
 * Supports formats: "3pm", "3:30pm", "at 3:30", "14:30", "12.30"
 *
 * @param description - The text to parse for time
 * @param baseDate - The base date to apply the parsed time to (defaults to current date)
 * @param adjustToFuture - If true, adjusts the date to the next day if the time has already passed
 * @returns Date object with parsed time, or null if no time found
 */
export function parseTimeFromDescription(
  description: string,
  baseDate: Date = new Date(),
  adjustToFuture: boolean = false
): Date | null {
  if (!description) return null;

  // Match time formats: "3pm", "3:30pm", "at 3:30", "14:30"
  const match = description.match(/\b(?:at\s+)?(\d{1,2})\s*[:.]?\s*(\d{2})?\s*(am|pm)?\b/i);
  if (!match) return null;

  let hours = parseInt(match[1]);
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const meridiem = match[3];

  if (meridiem) {
    const isPM = meridiem.toLowerCase() === 'pm';
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
  }

  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);

  // If the time has already passed today and adjustToFuture is true, set it for tomorrow
  if (adjustToFuture && date.getTime() <= new Date().getTime()) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}
