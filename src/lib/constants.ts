export const DONATION_AMOUNTS = [1100, 2100, 5100, 11000, 21000, 51000] as const;

export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/rishihooduni/",
  twitter: "https://twitter.com/RishihoodUni",
  linkedin: "https://www.linkedin.com/school/rishihood/",
  website: "https://rishihood.edu.in",
} as const;

export const CONTACT = {
  email: "namaste@rishihood.edu.in",
  phone: "+91-89293-14451",
  address: "NH-44, Near Bahalgarh Chowk, Sonipat, Haryana 131021",
} as const;

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const AADHAAR_REGEX = /^\d{12}$/;
export const PHONE_REGEX = /^[6-9]\d{9}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
