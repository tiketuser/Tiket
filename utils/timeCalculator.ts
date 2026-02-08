/**
 * Calculate time left until a concert
 * @param dateString - Date in format DD/MM/YYYY or DD.MM.YYYY
 * @param timeString - Time in format HH:MM (optional)
 * @returns Hebrew string describing time until event
 */
export const calculateTimeLeft = (
  dateString: string,
  timeString?: string
): string => {
  try {
    // Normalize date separator to /
    const normalizedDate = dateString.replace(/\./g, "/");
    const [day, month, year] = normalizedDate.split("/");
    const [hours, minutes] = timeString
      ? timeString.split(":")
      : ["12", "00"];
    
    const concertDate = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    );

    const now = new Date();
    const diffMs = concertDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffDays < 0) return "האירוע עבר";
    if (diffDays === 0) {
      if (diffHours <= 0) return "מתחיל עכשיו!";
      if (diffHours < 12) return `בעוד ${diffHours} שעות`;
      return "היום!";
    }
    if (diffDays === 1) return "מחר";
    if (diffDays === 2) return "מחרתיים";
    if (diffDays < 7) return `בעוד ${diffDays} ימים`;
    if (diffDays < 14) return "בעוד שבוע";
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? "בעוד שבוע" : `בעוד ${weeks} שבועות`;
    }
    if (diffDays < 60) return "בעוד חודש";
    const months = Math.floor(diffDays / 30);
    return months === 1 ? "בעוד חודש" : `בעוד ${months} חודשים`;
  } catch (error) {
    return "בקרוב";
  }
};
