export interface OfferTimingProps {
  code: string;
  validFrom?: Date | string | null;
  validUntil?: Date | string | null;
  dailyStartTime?: string | null;
  dailyEndTime?: string | null;
}

export function checkOfferTiming(offer: OfferTimingProps): { valid: boolean; reason?: string } {
  const now = new Date();

  // 1. Date Range: Start Date & Time
  if (offer.validFrom) {
    const startDate = new Date(offer.validFrom);
    if (startDate > now) {
      const startStr = startDate.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return {
        valid: false,
        reason: `Coupon "${offer.code}" is not active yet. It will become active on ${startStr}.`,
      };
    }
  }

  // 2. Date Range: Expiry Date & Time
  if (offer.validUntil) {
    const endDate = new Date(offer.validUntil);
    if (endDate < now) {
      const endStr = endDate.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return {
        valid: false,
        reason: `This coupon code expired on ${endStr}.`,
      };
    }
  }

  // 3. Daily Recurring Time Window (e.g., "00:00" to "04:00" or "18:00" to "23:59" in IST)
  if (offer.dailyStartTime && offer.dailyEndTime) {
    // Current time in Indian Standard Time (UTC + 5:30)
    const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const currentHour = istNow.getUTCHours();
    const currentMin = istNow.getUTCMinutes();
    const currentMinutes = currentHour * 60 + currentMin;

    const [startH, startM] = offer.dailyStartTime.split(':').map(Number);
    const [endH, endM] = offer.dailyEndTime.split(':').map(Number);
    const startMinutes = startH * 60 + (startM || 0);
    const endMinutes = endH * 60 + (endM || 0);

    let isInside = false;
    if (startMinutes <= endMinutes) {
      // Normal daytime window e.g. 18:00 to 23:59
      isInside = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight window spanning midnight e.g. 23:00 to 04:00
      isInside = currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }

    if (!isInside) {
      const formatTime = (hhmm: string) => {
        const [h, m] = hhmm.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        return `${displayH}:${String(m || 0).padStart(2, '0')} ${ampm}`;
      };
      return {
        valid: false,
        reason: `Coupon "${offer.code}" is only valid everyday between ${formatTime(offer.dailyStartTime)} and ${formatTime(offer.dailyEndTime)}.`,
      };
    }
  }

  return { valid: true };
}
