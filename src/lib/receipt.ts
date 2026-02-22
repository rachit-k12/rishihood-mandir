import { jsPDF } from "jspdf";
import { amountToWords } from "./amount-to-words";

interface ReceiptData {
  date: string;
  txnid: string;
  amount: number;
  fullName: string;
  address: string;
  pan?: string;
  aadhaar?: string;
  paymentMode?: string;
  bankRefNum?: string;
  digilockerVerified?: boolean;
  hasPanDoc?: boolean;
  hasAadhaarDoc?: boolean;
}

/**
 * Generates the RF Donation Application form as a PDF.
 * Returns the PDF as a base64 string.
 */
export function generateReceiptPDF(data: ReceiptData): string {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // --- Header ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("RISHIHOOD FOUNDATION", pageWidth / 2, y, { align: "center" });
  y += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    "NH-44, Near Bahalgarh Chowk, Sonipat, Haryana 131021",
    pageWidth / 2,
    y,
    { align: "center" }
  );
  y += 12;

  // --- Title ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("RF DONATION APPLICATION", pageWidth / 2, y, { align: "center" });
  y += 10;

  // --- Horizontal line ---
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // --- Date & Transaction ID ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Date: ${data.date}`, margin, y);
  doc.text(`Transaction ID: ${data.txnid}`, pageWidth - margin, y, {
    align: "right",
  });
  y += 10;

  // --- Payment Details ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Payment Details", margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const drawField = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 50, y);
    y += 7;
  };

  drawField("Payment Mode", data.paymentMode || "Online");
  drawField("Bank Reference", data.bankRefNum || "N/A");
  drawField(
    "Amount (Rs.)",
    `${new Intl.NumberFormat("en-IN").format(data.amount)}/-`
  );
  drawField("Amount in Words", amountToWords(data.amount));
  y += 3;

  // --- Donor Details ---
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Donor Details", margin, y);
  if (data.digilockerVerified) {
    doc.setFontSize(8);
    doc.setTextColor(0, 128, 0);
    doc.text(" (DigiLocker Verified)", margin + 32, y);
    doc.setTextColor(0, 0, 0);
  }
  y += 7;

  doc.setFontSize(10);
  drawField("Name", data.fullName);

  // Handle long addresses with text wrapping
  doc.setFont("helvetica", "bold");
  doc.text("Address:", margin, y);
  doc.setFont("helvetica", "normal");
  const addressLines = doc.splitTextToSize(data.address, contentWidth - 50);
  doc.text(addressLines, margin + 50, y);
  y += addressLines.length * 5 + 2;

  drawField("PAN Number", data.pan || "Not Provided");
  drawField("Aadhaar Number", data.aadhaar || "Not Provided");
  y += 3;

  // --- Enclosures ---
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Enclosures", margin, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const drawCheckbox = (label: string, checked: boolean) => {
    // Draw checkbox
    doc.rect(margin, y - 3.5, 4, 4);
    if (checked) {
      doc.setFont("helvetica", "bold");
      doc.text("X", margin + 0.8, y);
      doc.setFont("helvetica", "normal");
    }
    doc.text(label, margin + 7, y);
    y += 7;
  };

  drawCheckbox("Copy of PAN Card", !!data.hasPanDoc || !!data.pan);
  drawCheckbox(
    "Copy of Aadhaar Card",
    !!data.hasAadhaarDoc || !!data.aadhaar
  );
  drawCheckbox("Proof of Payment (Transaction Receipt)", true);
  y += 5;

  // --- 80G Note ---
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  const noteText =
    "This donation is eligible for tax benefits under Section 80G of the Income Tax Act. " +
    "A formal 80G receipt will be issued by Rishihood Foundation upon verification.";
  const noteLines = doc.splitTextToSize(noteText, contentWidth);
  doc.text(noteLines, margin, y);
  y += noteLines.length * 5 + 10;

  // --- Signature block ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Signature: ____________________", margin, y);
  doc.text(`Name: ${data.fullName}`, pageWidth / 2 + 10, y);
  y += 7;
  doc.text(`Address: ${data.address.substring(0, 50)}`, margin, y);
  if (data.aadhaar) {
    doc.text(`Aadhaar: ${data.aadhaar}`, pageWidth / 2 + 10, y);
  }

  // --- Footer ---
  y = 280;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    "Rishihood Foundation | namaste@rishihood.edu.in | +91-89293-14451",
    pageWidth / 2,
    y,
    { align: "center" }
  );
  y += 4;
  doc.text(
    "This is a computer-generated document and does not require a physical signature.",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  // Return as base64
  return doc.output("datauristring");
}

/**
 * Generates receipt PDF and returns it as a Buffer (for server-side storage).
 */
export function generateReceiptBuffer(data: ReceiptData): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Use same generation logic but return as buffer
  const base64 = generateReceiptPDF(data);
  const base64Data = base64.split(",")[1];
  return Buffer.from(base64Data, "base64");
}
