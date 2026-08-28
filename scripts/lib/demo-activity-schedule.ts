const DELIVERY_TIME_ZONE = 'Europe/London';
const DELIVERY_START_HOUR = 9;
const DELIVERY_FINAL_HOUR = 22;

function hourInLondon(at: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: DELIVERY_TIME_ZONE,
    hour: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(at);
  return Number(parts.find((part) => part.type === 'hour')?.value);
}

export function isDigestDeliveryTime(at: Date) {
  const hour = hourInLondon(at);
  return hour >= DELIVERY_START_HOUR && hour <= DELIVERY_FINAL_HOUR;
}
