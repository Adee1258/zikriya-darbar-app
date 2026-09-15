/**
 * Format a number as Pakistani Rupees: Rs. 1,23,000
 * Safe for Hermes engine on Expo Go / Android
 */
export const formatCurrency = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null) return 'Rs. 0';
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount));
  if (isNaN(num)) return 'Rs. 0';
  
  const absVal = Math.round(Math.abs(num));
  const formatted = absVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return num < 0 ? `-Rs. ${formatted}` : `Rs. ${formatted}`;
};

/**
 * Format an ISO date string as "03 Sep 2026"
 */
export const formatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return String(dateStr || '');
  }
};

/**
 * Format an ISO date string as "03 Sep 2026, 02:30 PM"
 */
export const formatDateTime = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, '0');
    return `${day} ${month} ${year}, ${strHours}:${minutes} ${ampm}`;
  } catch {
    return String(dateStr || '');
  }
};

/**
 * Returns "Today", "Yesterday", or formatted date
 */
export const formatRelativeDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return formatDate(dateStr);
  } catch {
    return String(dateStr || '');
  }
};
