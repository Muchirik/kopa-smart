//loan management
const { initiateSTKPush } = require("../services/mpesa");
const db = require("../config/firebase");
const { getAuthToken } = require("../config/daraja");
const moment = require("moment");
const { sendSMS } = require("../services/sms");

class LoanController {
  async applyLateFee(loanId) {
    const loanRef = db.collection("loans").doc(loanId);
    const loan = (await loanRef.get()).data();
    const daysLate = moment().diff(moment(loan.dueDate), "days");

    if (daysLate <= 0) return 0; // No late fee if not overdue

    const lateFee = loan.originalAmount * 0.05 * daysLate;

    //calculate 1% of late fee
    const commission = lateFee * 0.01; // 1% of 5% is 0.05 * 0.02 = 0.01 of the originalAmount per day

    await loanRef.update({
      amount: loan.originalAmount + lateFee,
      lateFeeApplied: true,
      commission: commission,
      status: "late",
      updatedDate: moment().toISOString(),
    });

    //send commission to ken
    if (commission > 0) {
      await initiateSTKPush(
        "0706219989",
        Math.round(commission),
        `commission for loan ${loanId}`
      );
    }
    return lateFee;
  }

  async createLoan(vendorPhone, borrowerPhone, amount, dueDate) {
    const loanRef = db.collection("loans").doc();
    loanId = loanRef.id;
    await loanRef.set({
      vendorPhone,
      borrowerPhone,
      amount,
      originalAmount: amount,
      dueDate: moment(dueDate).toISOString(),
      status: "pending_borrower_confirmation",
      createdDate: moment().toISOString(),
    });
    //send sms to borrower to confirm
    await sendSMS(
      borrowerPhone,
      `You have a loan offer of Ksh ${amount} due on ${moment(dueDate).format(
        "YYYY-MM-DD"
      )} from vendor ${vendorPhone}. Reply with *123*${loanId}*1# to accept or *123*${loanId}*2# to reject.`
    );

    return loanId;
  }

  // prompt buyer to confrim loan
  async confirmLoan(loanId, borrowerPhone, confirm) {
    const loanRef = db.collection("loans").doc(loanId);
    const loanDoc = await loanRef.get();
    if (!loanDoc.exists) throw new Error("Loan not found");
    const loan = loanDoc.data();

    if (loan.borrowerPhone !== borrowerPhone) throw new Error("Unauthorized");

    if (confirm) {
      await loanRef.update({
        status: "active",
        confirmedDate: moment.toISOString(),
      });
      // Notify vendor
      await sendSMS(
        loan.vendorPhone,
        `Borrower ${borrowerPhone} has accepted the loan offer for ${loan.amount}.`
      );
      return "Loan Confirmed";
    } else {
      await loanRef.update({
        status: "cancelled",
        cancelledDate: moment().toISOString(),
      });
      // Notify vendor
      await sendSMS(
        loan.vendorPhone,
        `Borrower ${borrowerPhone} has rejected the loan offer of Ksh ${loan.amount}.`
      );
      return "loan cancelled";
    }
  }

  // Prompt vendor to confirm
  async requestLoan(borrowerPhone, vendorPhone, amount, dueDate) {
    const loanRef = db.collection("loans").doc();
    const loanId = loanRef.id;
    await loanRef.set({
      vendorPhone,
      borrowerPhone,
      amount,
      dueDate,
      status: "pending_vendor_confirmation",
      createdDate: moment().toISOString(),
    });
    // Send SMS to vendor to confirm
    await sendSMS(
      vendorPhone,
      `Loan request: Buyer ${borrowerPhone} requests Ksh ${amount} due on ${moment(
        dueDate
      ).format(
        "YYYY-MM-DD"
      )}. Reply with *123*${loanId}*1# to approve loan request or *123*${loanId}*2# to reject loan request.`
    );
    return loanId;
  }

  // prompt the vendor to confirm the loan request
  async vendorConfirmLoan(loanId, vendorPhone, confirm) {
    const loanRef = db.collection("loans").doc(loanId);
    const loanDoc = await loanRef.get();
    if (!loanDoc.exists) throw new Error("Loan not found");
    const loan = loanDoc.data();

    if (loan.vendorPhone != vendorPhone) throw new Error("Unauthorized");

    if (confirm) {
      await loanRef.update({
        status: "active",
        confirmedDate: moment().toISOString(),
      });
      // Notify borrower
      await sendSMS(
        loan.borrowerPhone,
        `Vendor ${vendorPhone} has approved your loan request of Ksh ${loan.amount}.`
      );
      return "Loan Approved";
    } else {
      await loanRef.update({
        status: "rejected",
        rejectedDate: moment().toISOString(),
      });
      // Notify borrower
      await sendSMS(
        loan.borrowerPhone,
        `Vendor ${vendorPhone} has rejected your loan request of Ksh ${loan.amount}.`
      );
      return "Loan rejected";
    }
  }

  async getLoan(loanId) {
    const loanRef = db.collection("loans").doc(loanId);
    const loan = await loanRef.get();
    if (!loan.exists) {
      throw new Error("Loan not found");
    }
    return { id: loan.id, ...loan.data() };
  }

  // Query for loans where user is either vendor or the buyer
  async getLoansByUser(phoneOrId) {
    const loansRef = db.collection("loans");
    const vendorQuery = loansRef.where("vendorPhone", "==", phoneOrId);
    const borrowerQuery = loansRef.where("borrowerPhone", "==", phoneOrId);

    const [vendorSnap, borrowerSnap] = await Promise.all([
      vendorQuery.get(),
      borrowerQuery.get(),
    ]);

    const loans = [];

    vendorSnap.forEach((doc) => {
      loans.push({ id: doc.id, ...doc.data() });
    });
    borrowerSnap.forEach((doc) => {
      // Avoid duplicatde if user is both vendor and borrower in the same loan
      if (!loans.find((l) => l.id === doc.id)) {
        loans.push({ id: doc.id, ...doc.data() });
      }
    });
    // Sort by due date (earliest first)
    loans.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    return loans;
  }
}

module.exports = new LoanController();
