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
