"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldCheck, ExternalLink, ArrowRight, ArrowLeft, CheckCircle, Lock, Upload } from "lucide-react";
import MandalaDecoration from "@/components/ui/MandalaDecoration";
import SectionWrapper from "@/components/ui/SectionWrapper";
import OrnamentalDivider from "@/components/ui/OrnamentalDivider";
import {
  DONATION_AMOUNTS,
  formatCurrency,
  PHONE_REGEX,
  EMAIL_REGEX,
  PAN_REGEX,
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
  email?: string;
  phone?: string;
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

function DonationSectionInner() {
  const searchParams = useSearchParams();

  // Step: 1 = DigiLocker auth, 2 = Amount + details + pay
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // DigiLocker state
  const [digilockerData, setDigilockerData] = useState<DigiLockerData | null>(null);
  const [digilockerLoading, setDigilockerLoading] = useState(false);
  const [digilockerError, setDigilockerError] = useState("");

  // Skip DigiLocker mode
  const [skippedDigilocker, setSkippedDigilocker] = useState(false);

  // Form state (step 2)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pan, setPan] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Document upload state
  const [uploadedPanUrl, setUploadedPanUrl] = useState("");
  const [uploadedAadhaarUrl, setUploadedAadhaarUrl] = useState("");
  const [panUploading, setPanUploading] = useState(false);
  const [aadhaarUploading, setAadhaarUploading] = useState(false);
  const [panUploadDone, setPanUploadDone] = useState(false);
  const [aadhaarUploadDone, setAadhaarUploadDone] = useState(false);
  const [donorId, setDonorId] = useState("");

  const donationAmount = selectedAmount || Number(customAmount) || 0;

  // Check for DigiLocker callback data on mount
  // Supports both URL search params (/donate?digilocker_data=...) and hash params (/#donation?digilocker_data=...)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check URL search params first (for /donate route)
    let encodedData = searchParams.get("digilocker_data");
    let dlError = searchParams.get("digilocker_error");

    // Fallback to hash params (for legacy homepage /#donation?...)
    if (!encodedData && !dlError) {
      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.split("?")[1] || "");
      encodedData = hashParams.get("digilocker_data");
      dlError = hashParams.get("digilocker_error");
    }

    if (encodedData) {
      try {
        const decoded: DigiLockerData = JSON.parse(atob(encodedData));
        setDigilockerData(decoded);
        setFullName(decoded.fullName || "");
        if (decoded.email) setEmail(decoded.email);
        if (decoded.phone) setPhone(decoded.phone.replace(/^\+91/, "").replace(/\D/g, "").slice(-10));
        // Auto-advance to step 2
        setStep(2);
        setDirection(1);
        // Clean the URL
        const cleanPath = window.location.pathname === "/donate" ? "/donate" : "/#donation";
        window.history.replaceState(null, "", cleanPath);
      } catch {
        console.error("Failed to parse DigiLocker data");
      }
    }

    if (dlError) {
      setDigilockerError(
        dlError === "callback_failed"
          ? "DigiLocker verification failed. Please try again."
          : `DigiLocker error: ${dlError}`
      );
      const cleanPath = window.location.pathname === "/donate" ? "/donate" : "/#donation";
      window.history.replaceState(null, "", cleanPath);
    }
  }, [searchParams]);

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

  const handleSkipDigiLocker = () => {
    setSkippedDigilocker(true);
    setDigilockerData(null);
    setDirection(1);
    setStep(2);
  };

  const handleDocUpload = async (
    file: File,
    type: "pan" | "aadhaar"
  ) => {
    // We need a donorId to upload. If we don't have one yet, create the donor first.
    let currentDonorId = donorId;
    if (!currentDonorId) {
      if (!email || !phone) {
        setErrors((prev) => ({
          ...prev,
          [type === "pan" ? "panUpload" : "aadhaarUpload"]:
            "Please fill in email and phone first",
        }));
        return;
      }
      try {
        const res = await fetch("/api/payment/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: 0,
            firstname: fullName || "Donor",
            email,
            phone,
            address: "",
            pan: pan || "",
            aadhaar: aadhaar || "",
            anonymous: false,
            digilockerVerified: false,
            digilockerId: "",
            panDocUrl: "",
            aadhaarDocUrl: "",
            dateOfBirth: "",
            gender: "",
            _createDonorOnly: true,
          }),
        });
        const data = await res.json();
        if (data.donorId) {
          currentDonorId = data.donorId;
          setDonorId(data.donorId);
        }
      } catch {
        // Fallback: use a temporary ID
      }
    }

    if (!currentDonorId) {
      setErrors((prev) => ({
        ...prev,
        [type === "pan" ? "panUpload" : "aadhaarUpload"]:
          "Please fill in email and phone first, then try again",
      }));
      return;
    }

    const setUploading = type === "pan" ? setPanUploading : setAadhaarUploading;
    const setDone = type === "pan" ? setPanUploadDone : setAadhaarUploadDone;
    const setUrl = type === "pan" ? setUploadedPanUrl : setUploadedAadhaarUrl;

    setUploading(true);
    setErrors((prev) => {
      const n = { ...prev };
      delete n[type === "pan" ? "panUpload" : "aadhaarUpload"];
      return n;
    });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("donorId", currentDonorId);
      formData.append("type", type);

      const res = await fetch("/api/upload/document", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setUrl(data.url);
        setDone(true);
      } else {
        setErrors((prev) => ({
          ...prev,
          [type === "pan" ? "panUpload" : "aadhaarUpload"]:
            data.error || "Upload failed",
        }));
      }
    } catch {
      setErrors((prev) => ({
        ...prev,
        [type === "pan" ? "panUpload" : "aadhaarUpload"]: "Upload failed",
      }));
    } finally {
      setUploading(false);
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
    if (skippedDigilocker && pan && !PAN_REGEX.test(pan))
      newErrors.pan = "Invalid PAN format";
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
          pan: digilockerData?.pan || pan || "",
          aadhaar: digilockerData?.aadhaarMasked || aadhaar || "",
          anonymous,
          digilockerVerified: !!digilockerData,
          digilockerId: digilockerData?.digilockerId || "",
          panDocUrl: digilockerData?.panDocUrl || uploadedPanUrl || "",
          aadhaarDocUrl: digilockerData?.aadhaarDocUrl || uploadedAadhaarUrl || "",
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
    "w-full pl-8 pr-3 py-2.5 rounded-lg border border-temple-gold/60 bg-cream-dark/60 font-body text-dark text-sm cursor-not-allowed select-none";

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

                <button
                  type="button"
                  onClick={handleSkipDigiLocker}
                  className="font-body text-medium text-xs mt-4 underline hover:text-dark transition-colors cursor-pointer"
                >
                  Skip DigiLocker &mdash; enter details manually
                </button>
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
                {/* Status badge */}
                {digilockerData ? (
                  <div className="flex items-center gap-2 bg-temple-gold/10 border border-temple-gold/30 rounded-lg px-4 py-2.5 mb-5">
                    <ShieldCheck className="w-5 h-5 text-temple-gold flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-body text-dark text-sm font-semibold">
                        DigiLocker Verified
                      </p>
                      <p className="font-body text-medium text-xs">
                        Identity verified securely via DigiLocker
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDirection(-1);
                        setStep(1);
                      }}
                      className="font-body text-temple-crimson text-xs underline hover:text-temple-crimson-hover cursor-pointer"
                    >
                      Re-verify
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-cream-dark/40 border border-temple-gold-muted/30 rounded-lg px-4 py-2.5 mb-5">
                    <div className="flex-1">
                      <p className="font-body text-dark text-sm font-semibold">
                        Manual Entry
                      </p>
                      <p className="font-body text-medium text-xs">
                        Please fill in your details and upload PAN/Aadhaar documents below
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSkippedDigilocker(false);
                        setDirection(-1);
                        setStep(1);
                      }}
                      className="font-body text-temple-crimson text-xs underline hover:text-temple-crimson-hover cursor-pointer"
                    >
                      Use DigiLocker
                    </button>
                  </div>
                )}

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
                            <span className="text-temple-gold text-[10px] font-semibold bg-temple-gold/10 px-1.5 py-0.5 rounded">
                              DigiLocker
                            </span>
                          )}
                        </label>
                        <div className="relative">
                          {digilockerData?.fullName && (
                            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-temple-gold" />
                          )}
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
                        </div>
                        {errors.fullName && (
                          <p className="text-temple-red text-xs mt-0.5 font-body">
                            {errors.fullName}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="font-body text-dark text-xs font-medium mb-1 flex items-center gap-1.5">
                          Email{" "}
                          <span className="text-temple-red">*</span>
                          {digilockerData?.email && (
                            <span className="text-temple-gold text-[10px] font-semibold bg-temple-gold/10 px-1.5 py-0.5 rounded">
                              DigiLocker
                            </span>
                          )}
                        </label>
                        <div className="relative">
                          {digilockerData?.email && (
                            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-temple-gold" />
                          )}
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
                            readOnly={!!digilockerData?.email}
                            className={
                              digilockerData?.email
                                ? verifiedInputClass
                                : inputClass
                            }
                            placeholder="you@example.com"
                          />
                        </div>
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
                        <label className="font-body text-dark text-xs font-medium mb-1 flex items-center gap-1.5">
                          Phone (+91){" "}
                          <span className="text-temple-red">*</span>
                          {digilockerData?.phone && (
                            <span className="text-temple-gold text-[10px] font-semibold bg-temple-gold/10 px-1.5 py-0.5 rounded">
                              DigiLocker
                            </span>
                          )}
                        </label>
                        <div className="relative">
                          {digilockerData?.phone ? (
                            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-temple-gold" />
                          ) : (
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-medium text-xs">
                              +91
                            </span>
                          )}
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
                            readOnly={!!digilockerData?.phone}
                            className={
                              digilockerData?.phone
                                ? verifiedInputClass
                                : `${inputClass} pl-10`
                            }
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
                          {digilockerData?.pan && (
                            <span className="text-temple-gold text-[10px] font-semibold bg-temple-gold/10 px-1.5 py-0.5 rounded">
                              DigiLocker
                            </span>
                          )}
                        </label>
                        {digilockerData?.pan ? (
                          <div className="relative">
                            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-temple-gold" />
                            <input
                              type="text"
                              value={digilockerData.pan}
                              readOnly
                              className={verifiedInputClass}
                            />
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={pan}
                            onChange={(e) =>
                              setPan(e.target.value.toUpperCase().slice(0, 10))
                            }
                            className={inputClass}
                            placeholder="ABCDE1234F"
                            maxLength={10}
                          />
                        )}
                        {errors.pan && (
                          <p className="text-temple-red text-xs mt-0.5 font-body">
                            {errors.pan}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Row 3: Aadhaar + Anonymous */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="font-body text-dark text-xs font-medium mb-1 flex items-center gap-1.5">
                          Aadhaar Number
                          {digilockerData?.aadhaarMasked && (
                            <span className="text-temple-gold text-[10px] font-semibold bg-temple-gold/10 px-1.5 py-0.5 rounded">
                              DigiLocker
                            </span>
                          )}
                        </label>
                        {digilockerData?.aadhaarMasked ? (
                          <div className="relative">
                            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-temple-gold" />
                            <input
                              type="text"
                              value={digilockerData.aadhaarMasked}
                              readOnly
                              className={verifiedInputClass}
                            />
                          </div>
                        ) : (
                          <input
                            type="text"
                            inputMode="numeric"
                            value={aadhaar}
                            onChange={(e) =>
                              setAadhaar(
                                e.target.value.replace(/[^0-9]/g, "").slice(0, 12)
                              )
                            }
                            className={inputClass}
                            placeholder="12-digit Aadhaar number"
                            maxLength={12}
                          />
                        )}
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

                    {/* Document Upload (when DigiLocker skipped or docs not available) */}
                    {skippedDigilocker && !digilockerData && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* PAN Card Upload */}
                        <div>
                          <label className="font-body text-dark text-xs font-medium mb-1 block">
                            PAN Card Document
                          </label>
                          {panUploadDone ? (
                            <div className="flex items-center gap-2 border border-green-300 bg-green-50 rounded-lg px-3 py-2.5">
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                              <span className="font-body text-green-700 text-xs">
                                PAN card uploaded
                              </span>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-temple-gold-muted/50 rounded-lg px-3 py-4 cursor-pointer hover:border-temple-gold transition-colors">
                              {panUploading ? (
                                <Loader2 className="w-5 h-5 text-temple-gold animate-spin" />
                              ) : (
                                <Upload className="w-5 h-5 text-temple-gold mb-1" />
                              )}
                              <span className="font-body text-medium text-xs">
                                {panUploading
                                  ? "Uploading..."
                                  : "Upload PAN card"}
                              </span>
                              <span className="font-body text-light text-[10px] mt-0.5">
                                PDF, JPG, PNG (max 5MB)
                              </span>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.webp"
                                className="hidden"
                                disabled={panUploading}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleDocUpload(file, "pan");
                                }}
                              />
                            </label>
                          )}
                          {errors.panUpload && (
                            <p className="text-temple-red text-xs mt-0.5 font-body">
                              {errors.panUpload}
                            </p>
                          )}
                        </div>

                        {/* Aadhaar Card Upload */}
                        <div>
                          <label className="font-body text-dark text-xs font-medium mb-1 block">
                            Aadhaar Card Document
                          </label>
                          {aadhaarUploadDone ? (
                            <div className="flex items-center gap-2 border border-green-300 bg-green-50 rounded-lg px-3 py-2.5">
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                              <span className="font-body text-green-700 text-xs">
                                Aadhaar card uploaded
                              </span>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-temple-gold-muted/50 rounded-lg px-3 py-4 cursor-pointer hover:border-temple-gold transition-colors">
                              {aadhaarUploading ? (
                                <Loader2 className="w-5 h-5 text-temple-gold animate-spin" />
                              ) : (
                                <Upload className="w-5 h-5 text-temple-gold mb-1" />
                              )}
                              <span className="font-body text-medium text-xs">
                                {aadhaarUploading
                                  ? "Uploading..."
                                  : "Upload Aadhaar card"}
                              </span>
                              <span className="font-body text-light text-[10px] mt-0.5">
                                PDF, JPG, PNG (max 5MB)
                              </span>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.webp"
                                className="hidden"
                                disabled={aadhaarUploading}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleDocUpload(file, "aadhaar");
                                }}
                              />
                            </label>
                          )}
                          {errors.aadhaarUpload && (
                            <p className="text-temple-red text-xs mt-0.5 font-body">
                              {errors.aadhaarUpload}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

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

export default function DonationSection() {
  return (
    <Suspense>
      <DonationSectionInner />
    </Suspense>
  );
}
