"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck, ExternalLink } from "lucide-react";
import MandalaDecoration from "@/components/ui/MandalaDecoration";
import SectionWrapper from "@/components/ui/SectionWrapper";
import OrnamentalDivider from "@/components/ui/OrnamentalDivider";
import {
  DONATION_AMOUNTS,
  formatCurrency,
  PAN_REGEX,
  AADHAAR_REGEX,
  PHONE_REGEX,
  EMAIL_REGEX,
} from "@/lib/constants";

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" as const },
  },
};

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  pan: string;
  aadhaar: string;
  anonymous: boolean;
}

interface DigiLockerData {
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  aadhaarMasked?: string;
  pan?: string;
  digilockerId?: string;
  panDocUrl?: string;
  aadhaarDocUrl?: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function DonationSection() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    pan: "",
    aadhaar: "",
    anonymous: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [digilockerVerified, setDigilockerVerified] = useState(false);
  const [digilockerData, setDigilockerData] = useState<DigiLockerData | null>(
    null
  );
  const [digilockerLoading, setDigilockerLoading] = useState(false);
  const [digilockerError, setDigilockerError] = useState("");

  const donationAmount = selectedAmount || Number(customAmount) || 0;

  // Check for DigiLocker callback data on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    const hashParams = new URLSearchParams(hash.split("?")[1] || "");

    // Check for DigiLocker data in URL
    const encodedData = hashParams.get("digilocker_data");
    if (encodedData) {
      try {
        const decoded = JSON.parse(atob(encodedData));
        setDigilockerData(decoded);
        setDigilockerVerified(true);
        setFormData((prev) => ({
          ...prev,
          fullName: decoded.fullName || prev.fullName,
          address: decoded.address || prev.address,
          pan: decoded.pan || prev.pan,
          aadhaar: decoded.aadhaarMasked || prev.aadhaar,
        }));
        // Clean URL
        window.history.replaceState(null, "", "/#donation");
      } catch {
        console.error("Failed to parse DigiLocker data");
      }
    }

    // Check for DigiLocker error
    const dlError = hashParams.get("digilocker_error");
    if (dlError) {
      setDigilockerError(
        dlError === "callback_failed"
          ? "DigiLocker verification failed. Please try again or fill manually."
          : `DigiLocker error: ${dlError}`
      );
      window.history.replaceState(null, "", "/#donation");
    }
  }, []);

  const handleDigiLockerVerify = async () => {
    setDigilockerLoading(true);
    setDigilockerError("");
    try {
      const response = await fetch("/api/digilocker/authorize");
      const data = await response.json();
      if (data.success && data.url) {
        // Redirect to DigiLocker
        window.location.href = data.url;
      } else {
        setDigilockerError(
          data.error || "Failed to connect to DigiLocker. Please fill manually."
        );
      }
    } catch {
      setDigilockerError("Failed to connect to DigiLocker. Please fill manually.");
    } finally {
      setDigilockerLoading(false);
    }
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value.replace(/[^0-9]/g, ""));
    setSelectedAmount(null);
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (donationAmount < 1)
      newErrors.amount = "Please select or enter an amount";
    if (!formData.fullName.trim()) newErrors.fullName = "Required";
    if (!formData.email.trim() || !EMAIL_REGEX.test(formData.email))
      newErrors.email = "Valid email required";
    if (!formData.phone.trim() || !PHONE_REGEX.test(formData.phone))
      newErrors.phone = "Valid 10-digit number required";
    if (!formData.address.trim()) newErrors.address = "Required";
    const hasPan = formData.pan.trim().length > 0;
    const hasAadhaar = formData.aadhaar.trim().length > 0;
    if (!hasPan && !hasAadhaar) {
      newErrors.pan = "PAN or Aadhaar required";
    } else {
      if (hasPan && !PAN_REGEX.test(formData.pan.toUpperCase()))
        newErrors.pan = "Invalid PAN";
      if (hasAadhaar && !AADHAAR_REGEX.test(formData.aadhaar))
        newErrors.aadhaar = "12 digits required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: donationAmount,
          firstname: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          pan: formData.pan.toUpperCase(),
          aadhaar: formData.aadhaar,
          anonymous: formData.anonymous,
          digilockerVerified,
          digilockerId: digilockerData?.digilockerId || "",
          panDocUrl: digilockerData?.panDocUrl || "",
          aadhaarDocUrl: digilockerData?.aadhaarDocUrl || "",
          dateOfBirth: digilockerData?.dateOfBirth || "",
          gender: digilockerData?.gender || "",
        }),
      });
      const data = await response.json();
      if (data.success && data.data) {
        const env = data.env || "test";
        const baseUrl =
          env === "production"
            ? "https://pay.easebuzz.in/pay"
            : "https://testpay.easebuzz.in/pay";
        window.location.href = `${baseUrl}/${data.data}`;
      } else {
        setErrors({ submit: data.error || "Payment initiation failed." });
      }
    } catch {
      setErrors({ submit: "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-lg border border-temple-gold-muted/70 bg-cream font-body text-dark text-sm placeholder:text-light focus:outline-none focus:border-temple-gold focus:ring-1 focus:ring-temple-gold/50 transition-colors";

  const lockedInputClass =
    "w-full px-3 py-2.5 rounded-lg border border-green-300 bg-green-50/50 font-body text-dark text-sm cursor-not-allowed";

  // Check if a field is locked by DigiLocker
  const isLocked = (field: string): boolean => {
    if (!digilockerVerified || !digilockerData) return false;
    const lockedFields: Record<string, string | undefined> = {
      fullName: digilockerData.fullName,
      address: digilockerData.address,
      pan: digilockerData.pan,
      aadhaar: digilockerData.aadhaarMasked,
    };
    return !!lockedFields[field];
  };

  return (
    <SectionWrapper id="donation" bg="alt" className="!py-14 md:!py-20">
      <MandalaDecoration position="center" size={700} opacity={0.09} spin />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-3xl mx-auto"
      >
        <motion.h2
          variants={fadeUp}
          className="font-heading text-temple-crimson text-3xl md:text-4xl lg:text-6xl font-semibold text-center leading-tight"
        >
          Make Your Contribution
        </motion.h2>

        <motion.div variants={fadeUp}>
          <OrnamentalDivider size="sm" className="my-5" />
        </motion.div>

        <motion.form
          variants={fadeUp}
          onSubmit={handleSubmit}
          className="bg-warm-white rounded-2xl p-5 md:p-8 shadow-sm border border-temple-gold-light/20"
        >
          {/* DigiLocker Verification */}
          <div className="mb-6">
            {!digilockerVerified ? (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleDigiLockerVerify}
                  disabled={digilockerLoading}
                  className="inline-flex items-center gap-2.5 bg-[#0057B7] text-white font-body font-semibold text-sm px-6 py-3 rounded-lg hover:bg-[#004494] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {digilockerLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      Verify with DigiLocker
                      <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                    </>
                  )}
                </button>
                <p className="font-body text-light text-xs mt-2">
                  Auto-fill your name, address, PAN & Aadhaar securely
                </p>
                {digilockerError && (
                  <p className="text-temple-red text-xs mt-2 font-body">
                    {digilockerError}
                  </p>
                )}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-temple-gold-muted/40" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-warm-white font-body text-light">
                      or fill manually
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 mb-2">
                <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-body text-green-800 text-sm font-semibold">
                    DigiLocker Verified
                  </p>
                  <p className="font-body text-green-600 text-xs">
                    Identity verified. Locked fields are auto-filled from your
                    DigiLocker.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Amount Selection */}
          <div className="mb-5">
            <label className="font-body text-dark text-xs font-semibold uppercase tracking-widest mb-3 block">
              Select Amount
            </label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {DONATION_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleAmountSelect(amount)}
                  className={`py-2 px-2 rounded-lg font-body font-semibold text-xs md:text-sm transition-all cursor-pointer ${
                    selectedAmount === amount
                      ? "bg-temple-crimson text-cream shadow-md"
                      : "bg-cream border border-temple-gold-muted/60 text-dark hover:border-temple-gold"
                  }`}
                >
                  {formatCurrency(amount)}
                </button>
              ))}
            </div>
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-medium text-sm font-semibold">
                ₹
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => handleCustomAmount(e.target.value)}
                className={`${inputClass} pl-7`}
              />
            </div>
            {errors.amount && (
              <p className="text-temple-red text-xs mt-1 font-body">
                {errors.amount}
              </p>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            {/* Row 1: Name + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-body text-dark text-xs font-medium mb-1 flex items-center gap-1.5">
                  Full Name <span className="text-temple-red">*</span>
                  {isLocked("fullName") && (
                    <span className="text-green-600 text-[10px] font-semibold bg-green-50 px-1.5 py-0.5 rounded">
                      Verified
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                  readOnly={isLocked("fullName")}
                  className={
                    isLocked("fullName") ? lockedInputClass : inputClass
                  }
                  placeholder="Your full name"
                />
                {errors.fullName && (
                  <p className="text-temple-red text-xs mt-0.5 font-body">
                    {errors.fullName}
                  </p>
                )}
              </div>
              <div>
                <label className="font-body text-dark text-xs font-medium mb-1 block">
                  Email <span className="text-temple-red">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={inputClass}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="text-temple-red text-xs mt-0.5 font-body">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: Phone + Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-body text-dark text-xs font-medium mb-1 block">
                  Phone (+91) <span className="text-temple-red">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-medium text-xs">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) =>
                      handleInputChange(
                        "phone",
                        e.target.value.replace(/[^0-9]/g, "")
                      )
                    }
                    className={`${inputClass} pl-10`}
                    placeholder="9876543210"
                  />
                </div>
                {errors.phone && (
                  <p className="text-temple-red text-xs mt-0.5 font-body">
                    {errors.phone}
                  </p>
                )}
              </div>
              <div>
                <label className="font-body text-dark text-xs font-medium mb-1 flex items-center gap-1.5">
                  Address <span className="text-temple-red">*</span>
                  {isLocked("address") && (
                    <span className="text-green-600 text-[10px] font-semibold bg-green-50 px-1.5 py-0.5 rounded">
                      Verified
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    handleInputChange("address", e.target.value)
                  }
                  readOnly={isLocked("address")}
                  className={
                    isLocked("address") ? lockedInputClass : inputClass
                  }
                  placeholder="City, State"
                />
                {errors.address && (
                  <p className="text-temple-red text-xs mt-0.5 font-body">
                    {errors.address}
                  </p>
                )}
              </div>
            </div>

            {/* Row 3: PAN + Aadhaar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-body text-dark text-xs font-medium mb-1 flex items-center gap-1.5">
                  PAN Number
                  {isLocked("pan") && (
                    <span className="text-green-600 text-[10px] font-semibold bg-green-50 px-1.5 py-0.5 rounded">
                      Verified
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={formData.pan}
                  onChange={(e) =>
                    handleInputChange("pan", e.target.value.toUpperCase())
                  }
                  readOnly={isLocked("pan")}
                  className={`${isLocked("pan") ? lockedInputClass : inputClass} uppercase`}
                  placeholder="ABCDE1234F"
                />
                {errors.pan && (
                  <p className="text-temple-red text-xs mt-0.5 font-body">
                    {errors.pan}
                  </p>
                )}
              </div>
              <div>
                <label className="font-body text-dark text-xs font-medium mb-1 flex items-center gap-1.5">
                  Aadhaar Number
                  {isLocked("aadhaar") && (
                    <span className="text-green-600 text-[10px] font-semibold bg-green-50 px-1.5 py-0.5 rounded">
                      Verified
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  value={formData.aadhaar}
                  onChange={(e) =>
                    handleInputChange(
                      "aadhaar",
                      e.target.value.replace(/[^0-9]/g, "")
                    )
                  }
                  readOnly={isLocked("aadhaar")}
                  className={
                    isLocked("aadhaar") ? lockedInputClass : inputClass
                  }
                  placeholder="123456789012"
                />
                {errors.aadhaar && (
                  <p className="text-temple-red text-xs mt-0.5 font-body">
                    {errors.aadhaar}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom row: anonymous + tax note */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.anonymous}
                  onChange={(e) =>
                    handleInputChange("anonymous", e.target.checked)
                  }
                  className="w-3.5 h-3.5 rounded border-temple-gold-muted accent-temple-crimson"
                />
                <span className="font-body text-dark text-xs">
                  I wish to remain anonymous
                </span>
              </label>
              <p className="font-body text-light text-[10px] italic">
                *PAN or Aadhaar required for 80G tax receipts
              </p>
            </div>

            {errors.submit && (
              <div className="bg-temple-red/10 border border-temple-red/30 rounded-lg p-3">
                <p className="text-temple-red text-xs font-body">
                  {errors.submit}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 bg-temple-red text-cream font-body font-semibold tracking-widest text-xs md:text-sm py-3.5 rounded-lg hover:bg-temple-crimson-hover transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Proceed to Donate${donationAmount > 0 ? ` ${formatCurrency(donationAmount)}` : ""}`
              )}
            </button>
          </div>
        </motion.form>

        <motion.p
          variants={fadeUp}
          className="font-body text-light text-[10px] text-center mt-4"
        >
          Donations eligible for tax benefits under Section 80G of the Income
          Tax Act.
        </motion.p>
      </motion.div>
    </SectionWrapper>
  );
}
