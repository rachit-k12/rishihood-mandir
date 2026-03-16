import { prisma } from "./prisma";

interface CreateDonorInput {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  pan?: string;
  aadhaarMasked?: string;
  dateOfBirth?: string;
  gender?: string;
  digilockerVerified?: boolean;
  digilockerId?: string;
  panDocUrl?: string;
  aadhaarDocUrl?: string;
  panDocBase64?: string;
  panDocMimeType?: string;
  aadhaarDocBase64?: string;
  aadhaarDocMimeType?: string;
}

interface CreateDonationInput {
  donorId: string;
  txnid: string;
  amount: number;
  anonymous?: boolean;
}

interface UpdateDonationInput {
  status: string;
  paymentMode?: string;
  bankRefNum?: string;
  receiptUrl?: string;
}

export async function upsertDonor(data: CreateDonorInput) {
  return prisma.donor.upsert({
    where: {
      email_phone: { email: data.email, phone: data.phone },
    },
    update: {
      fullName: data.fullName,
      address: data.address,
      pan: data.pan || undefined,
      aadhaarMasked: data.aadhaarMasked || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      gender: data.gender || undefined,
      digilockerVerified: data.digilockerVerified || undefined,
      digilockerId: data.digilockerId || undefined,
      panDocUrl: data.panDocUrl || undefined,
      aadhaarDocUrl: data.aadhaarDocUrl || undefined,
      panDocBase64: data.panDocBase64 || undefined,
      panDocMimeType: data.panDocMimeType || undefined,
      aadhaarDocBase64: data.aadhaarDocBase64 || undefined,
      aadhaarDocMimeType: data.aadhaarDocMimeType || undefined,
    },
    create: data,
  });
}

export async function createDonation(data: CreateDonationInput) {
  return prisma.donation.create({
    data: {
      donorId: data.donorId,
      txnid: data.txnid,
      amount: data.amount,
      anonymous: data.anonymous ?? false,
      status: "pending",
    },
  });
}

export async function updateDonationStatus(
  txnid: string,
  data: UpdateDonationInput
) {
  return prisma.donation.update({
    where: { txnid },
    data,
  });
}

export async function getDonationByTxnId(txnid: string) {
  return prisma.donation.findUnique({
    where: { txnid },
    include: { donor: true },
  });
}

export async function getDonationStats() {
  const result = await prisma.donation.aggregate({
    where: { status: "success" },
    _sum: { amount: true },
    _count: true,
  });
  return {
    totalCollected: Number(result._sum.amount || 0),
    count: result._count,
  };
}

export async function storeDocumentForDonor(
  donorId: string,
  type: "pan" | "aadhaar",
  base64: string,
  mimeType: string,
  docUrl: string
) {
  const data =
    type === "pan"
      ? { panDocBase64: base64, panDocMimeType: mimeType, panDocUrl: docUrl }
      : {
          aadhaarDocBase64: base64,
          aadhaarDocMimeType: mimeType,
          aadhaarDocUrl: docUrl,
        };
  return prisma.donor.update({ where: { id: donorId }, data });
}

export async function getDocumentForDonor(
  donorId: string,
  type: "pan" | "aadhaar"
) {
  const donor = await prisma.donor.findUnique({
    where: { id: donorId },
    select:
      type === "pan"
        ? { panDocBase64: true, panDocMimeType: true }
        : { aadhaarDocBase64: true, aadhaarDocMimeType: true },
  });
  if (!donor) return null;
  const base64 =
    type === "pan"
      ? (donor as { panDocBase64: string | null }).panDocBase64
      : (donor as { aadhaarDocBase64: string | null }).aadhaarDocBase64;
  const mimeType =
    type === "pan"
      ? (donor as { panDocMimeType: string | null }).panDocMimeType
      : (donor as { aadhaarDocMimeType: string | null }).aadhaarDocMimeType;
  if (!base64) return null;
  return { base64, mimeType: mimeType || "application/pdf" };
}
