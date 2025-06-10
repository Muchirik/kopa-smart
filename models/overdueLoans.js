// File: models/overdueLoans.js

const LoanController = require('../controllers/loans');
const { sendSMS } = require('../services/sms');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const db = getFirestore();

const getOverdueLoans = async () => {
  const now = Timestamp.now();
  const loansRef = db.collection("loans");
  const snapshot = await loansRef
    .where("dueDate", "<", now)
    .where("status", "==", "active")
    .get();

  const overdueLoans = [];
  snapshot.forEach((doc) => {
    overdueLoans.push({
      id: doc.id,
      ...doc.data(),
    });
  });
  if (overdueLoans.length === 0) {
    console.log("No overdue loans found");
    return [];
  }
  console.log(`Found ${overdueLoans.length} overdue loans`);
  overdueLoans.forEach((loan) => {
    console.log(
      `Loan ID: ${loan.id}, Borrower: ${loan.borrowerPhone}, Amount: ${loan.amount}`
    );
  });

  // Apply late fee
  for (const loan of overdueLoans) {
    const lateFee = await LoanController.applyLateFee(loan.id);
    // await sendSMS(
    //   loan.borrowerPhone,
    //   `Your loan balance is now Ksh ${loan.amount + lateFee} due to late fees`
    // );//  already done in cron job
    console.log(
      `Late fee of Ksh ${lateFee} applied to loan ID: ${loan.id}, new balance: Ksh ${loan.amount + lateFee}`
    );
    console.log(
      `Sms sent to ${loan.borrowerPhone} for Overdue loan ID: ${loan.id} fee of Ksh ${lateFee}`
    );
  }

  try {
    // Send a summary SMS to the vendor
    const vendorPhone = overdueLoans[0].vendorPhone; // Assuming all loans have the same vendor
    await sendSMS(
      vendorPhone,
      `There are ${overdueLoans.length} overdue loans. Please check your dashboard for details.`
    );
  } catch (error) {
    console.error("Error sending SMS to vendor:", error);
  }

  // Return the list of overdue loans
  return overdueLoans;
}

module.exports = { getOverdueLoans };
// This function retrieves overdue loans from the database, applies late fees, and sends SMS notifications to borrowers.


