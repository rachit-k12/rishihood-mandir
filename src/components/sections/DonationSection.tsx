"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldCheck, ExternalLink, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import MandalaDecoration from "@/components/ui/MandalaDecoration";
import SectionWrapper from "@/components/ui/SectionWrapper";
import OrnamentalDivider from "@/components/ui/OrnamentalDivider";
import {
  DONATION_AMOUNTS,
  formatCurrency,
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

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
    transition: { duration: 0.25, ease: "easeIn" as const },
  }),
};

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
  // Step: 1 = DigiLocker auth, 2 = Amount + details + pay
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // DigiLocker state
  const [digilockerData, setDigilockerData] = useState<DigiLockerData | null>(null);
  const [digilockerLoading, setDigilockerLoading] = useState(false);
  const [digilockerError, setDigilockerError] = useState("");

  // Form state (step 2)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const donationAmount = selectedAmount || Number(customAmount) || 0;

  // Check for DigiLocker callback data on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    const hashParams = new URLSearchParams(hash.split("?")[1] || "");

    const encodedData = hashParams.get("digilocker_data");
    if (encodedData) {
      try {
        const decoded: DigiLockerData = JSON.parse(atob(encodedData));
        setDigilockerData(decoded);
        setFullName(decoded.fullName || "");
        // Auto-advance to step 2
        setStep(2);
        setDirection(1);
        window.history.replaceState(null, "", "/#donation");
      } catch {
        console.error("Failed to parse DigiLocker data");
      }
    }

    const dlError = hashParams.get("digilocker_error");
    if (dlError) {
      setDigilockerError(
        dlError === "callback_failed"
          ? "DigiLocker verification failed. Please try again."
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
        window.location.href = data.url;
      } else {
        setDigilockerError(
          data.error || "Failed to connect to DigiLocker."
        );
      }
    } catch {
      setDigilockerError("Failed to connect to DigiLocker.");
    } finally {
      setDigilockerLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (donationAmount < 1)
      newErrors.amount = "Please select or enter an amount";
    if (!fullName.trim()) newErrors.fullName = "Required";
    if (!email.trim() || !EMAIL_REGEX.test(email))
      newErrors.email = "Valid email required";
    if (!phone.trim() || !PHONE_REGEX.test(phone))
      newErrors.phone = "Valid 10-digit number required";
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
          firstname: fullName,
          email,
          phone,
          address: digilockerData?.address || "",
          pan: digilockerData?.pan || "",
          aadhaar: digilockerData?.aadhaarMasked || "",
          anonymous,
          digilockerVerified: true,
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

  const verifiedInputClass =
    "w-full px-3 py-2.5 rounded-lg border border-green-300 bg-green-50/50 font-body text-dark text-sm cursor-not-allowed";

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

        {/* Step Indicator */}
        <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-body font-bold transition-colors ${
                step >= 1
                  ? "bg-temple-crimson text-cream"
                  : "bg-temple-gold-muted/30 text-medium"
              }`}
            >
              {step > 1 ? <CheckCircle className="w-4 h-4" /> : "1"}
            </div>
            <span className="font-body text-xs text-dark font-medium hidden sm:inline">
              Verify Identity
            </span>
          </div>

          <div className="w-8 h-px bg-temple-gold-muted/50" />

          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-body font-bold transition-colors ${
                step >= 2
                  ? "bg-temple-crimson text-cream"
                  : "bg-temple-gold-muted/30 text-medium"
              }`}
            >
              2
            </div>
            <span className="font-body text-xs text-dark font-medium hidden sm:inline">
              Donate
            </span>
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="bg-warm-white rounded-2xl p-5 md:p-8 shadow-sm border border-temple-gold-light/20 overflow-hidden"
        >
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="text-center py-6"
              >
                <ShieldCheck className="w-12 h-12 text-temple-crimson mx-auto mb-4" />

                <h3 className="font-heading text-temple-crimson text-xl md:text-2xl font-semibold mb-2">
                  Verify Your Identity
                </h3>
                <p className="font-body text-medium text-sm mb-6 max-w-md mx-auto">
                  Authenticate with DigiLocker to securely verify your Aadhaar
                  and PAN details. This is required for 80G tax receipts.
                </p>

                <button
                  type="button"
                  onClick={handleDigiLockerVerify}
                  disabled={digilockerLoading}
                  className="inline-flex items-center gap-2.5 bg-[#0057B7] text-white font-body font-semibold text-sm px-8 py-3.5 rounded-lg hover:bg-[#004494] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {digilockerLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting to DigiLocker...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      Sign in with DigiLocker
                      <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                    </>
                  )}
                </button>

                {digilockerError && (
                  <p className="text-temple-red text-xs mt-3 font-body">
                    {digilockerError}
                  </p>
                )}

                <p className="font-body text-light text-[10px] mt-4">
                  Your Aadhaar & PAN details will be fetched securely from
                  DigiLocker. We do not store your DigiLocker password.
                </p>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {/* Verified badge */}
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 mb-5">
                  <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-body text-green-800 text-sm font-semibold">
                      DigiLocker Verified
                    </p>
                    <p className="font-body text-green-600 text-xs">
                      Aadhaar & PAN fetched securely
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDirection(-1);
                      setStep(1);
                    }}
                    className="font-body text-green-600 text-xs underline hover:text-green-800 cursor-pointer"
                  >
                    Re-verify
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
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
                          onClick={() => {
                            setSelectedAmount(amount);
                            setCustomAmount("");
                          }}
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
                        onChange={(e) => {
                          setCustomAmount(
                            e.target.value.replace(/[^0-9]/g, "")
                          );
                          setSelectedAmount(null);
                        }}
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
                    {/* Row 1: Full Name + Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="font-body text-dark text-xs font-medium mb-1 flex items-center gap-1.5">
                          Full Name{" "}
                          <span className="text-temple-red">*</span>
                          {digilockerData?.fullName && (
                            <span className="text-green-600 text-[10px] font-semibold bg-green-50 px-1.5 py-0.5 rounded">
                              Auto-filled
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => {
                            setFullName(e.target.value);
                            if (errors.fullName) {
                              setErrors((prev) => {
                                const n = { ...prev };
                                delete n.fullName;
                                return n;
                              });
                            }
                          }}
                          readOnly={!!digilockerData?.fullName}
                          className={
                            digilockerData?.fullName
                              ? verifiedInputClass
                              : inputClass
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
                          Email{" "}
                          <span className="text-temple-red">*</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (errors.email) {
                              setErrors((prev) => {
                                const n = { ...prev };
                                delete n.email;
                                return n;
                              });
                            }
                          }}
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

                    {/* Row 2: Phone + PAN (read-only) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="font-body text-dark text-xs font-medium mb-1 block">
                          Phone (+91){" "}
                          <span className="text-temple-red">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-medium text-xs">
                            +91
                          </span>
                          <input
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            value={phone}
                            onChange={(e) => {
                              setPhone(
                                e.target.value.replace(/[^0-9]/g, "")
                              );
                              if (errors.phone) {
                                setErrors((prev) => {
                                  const n = { ...prev };
                                  delete n.phone;
                                  return n;
                                });
                              }
                            }}
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
                          PAN Number
                          <span className="text-green-600 text-[10px] font-semibold bg-green-50 px-1.5 py-0.5 rounded">
                            DigiLocker
                          </span>
                        </label>
                        <input
                          type="text"
                          value={digilockerData?.pan || "Fetched from DigiLocker"}
                          readOnly
                          className={verifiedInputClass}
                        />
                      </div>
                    </div>

                    {/* Row 3: Aadhaar (read-only) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="font-body text-dark text-xs font-medium mb-1 flex items-center gap-1.5">
                          Aadhaar Number
                          <span className="text-green-600 text-[10px] font-semibold bg-green-50 px-1.5 py-0.5 rounded">
                            DigiLocker
                          </span>
                        </label>
                        <input
                          type="text"
                          value={
                            digilockerData?.aadhaarMasked ||
                            "Fetched from DigiLocker"
                          }
                          readOnly
                          className={verifiedInputClass}
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                          <input
                            type="checkbox"
                            checked={anonymous}
                            onChange={(e) => setAnonymous(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-temple-gold-muted accent-temple-crimson"
                          />
                          <span className="font-body text-dark text-xs">
                            I wish to remain anonymous
                          </span>
                        </label>
                      </div>
                    </div>

                    {errors.submit && (
                      <div className="bg-temple-red/10 border border-temple-red/30 rounded-lg p-3">
                        <p className="text-temple-red text-xs font-body">
                          {errors.submit}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDirection(-1);
                          setStep(1);
                        }}
                        className="px-4 py-3.5 rounded-lg border border-temple-gold-muted/60 font-body text-dark text-xs font-semibold hover:bg-cream transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-temple-red text-cream font-body font-semibold tracking-widest text-xs md:text-sm py-3.5 rounded-lg hover:bg-temple-crimson-hover transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Proceed to Donate
                            {donationAmount > 0
                              ? ` ${formatCurrency(donationAmount)}`
                              : ""}
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

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
