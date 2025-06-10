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

  // Apply late fee and send SMS for each overdue loan
  for (const loan of overdueLoans) {
    const lateFee = await LoanController.applyLateFee(loan.id);
    await sendSMS(
      loan.borrowerPhone,
      `Your loan balance is now Ksh ${loan.amount + lateFee} due to late fees`
    );
  }

  // Return the list of overdue loans
  return overdueLoans;
}

module.exports = { getOverdueLoans };
// This function retrieves overdue loans from the database, applies late fees, and sends SMS notifications to borrowers.


