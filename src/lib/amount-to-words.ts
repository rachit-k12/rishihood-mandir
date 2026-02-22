const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];

const tens = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

function convertChunk(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ones[n];
  if (n < 100) return `${tens[Math.floor(n / 10)]} ${ones[n % 10]}`.trim();
  return `${ones[Math.floor(n / 100)]} Hundred ${convertChunk(n % 100)}`.trim();
}

/**
 * Converts a number to Indian numbering words.
 * e.g. 11000 → "Eleven Thousand Rupees Only"
 * Supports up to 99,99,99,999 (99 crore).
 */
export function amountToWords(amount: number): string {
  if (amount === 0) return "Zero Rupees Only";

  const num = Math.floor(Math.abs(amount));
  const paise = Math.round((Math.abs(amount) - num) * 100);

  let result = "";

  // Crore (1,00,00,000)
  const crore = Math.floor(num / 10000000);
  if (crore > 0) result += `${convertChunk(crore)} Crore `;

  // Lakh (1,00,000)
  const lakh = Math.floor((num % 10000000) / 100000);
  if (lakh > 0) result += `${convertChunk(lakh)} Lakh `;

  // Thousand (1,000)
  const thousand = Math.floor((num % 100000) / 1000);
  if (thousand > 0) result += `${convertChunk(thousand)} Thousand `;

  // Hundred and remainder
  const remainder = num % 1000;
  if (remainder > 0) result += convertChunk(remainder);

  result = result.trim() + " Rupees";

  if (paise > 0) {
    result += ` and ${convertChunk(paise)} Paise`;
  }

  result += " Only";

  return result;
}
