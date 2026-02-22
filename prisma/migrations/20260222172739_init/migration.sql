-- CreateTable
CREATE TABLE "donors" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "pan" TEXT,
    "aadhaar_masked" TEXT,
    "date_of_birth" TEXT,
    "gender" TEXT,
    "digilocker_verified" BOOLEAN NOT NULL DEFAULT false,
    "digilocker_id" TEXT,
    "pan_doc_url" TEXT,
    "aadhaar_doc_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" UUID NOT NULL,
    "donor_id" UUID NOT NULL,
    "txnid" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payment_mode" TEXT,
    "bank_ref_num" TEXT,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "receipt_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "donors_email_phone_key" ON "donors"("email", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "donations_txnid_key" ON "donations"("txnid");

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_donor_id_fkey" FOREIGN KEY ("donor_id") REFERENCES "donors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
