//loan management

const db = require('../config/firebase');
const { getAuthToken } = require('../config/daraja');
const moment = require('moment');

class LoanController {
    async createLoan(vendorPhone, borrowerPhone, amount, dueDate) {
        const loanRef = db.collection('loans').doc();
        await loanRef.set({
            vendorPhone,
            borrowerPhone,
            amount,
            originalAmount: amount,
            dueDate: moment(dueDate).toISOString(),
            status: 'active',
            createdDate: moment().toISOString()
        });

        return loanRef.id;
    }

    async applyLateFee(loanId) {
        const loanRef = db.collection('loans').doc(loanId);
        const loan = (await loanRef.get()).data();

        const daysLate = moment().diff(moment(loan.dueDate), 'days');
        // if (daysLate > 0) {
        //     const lateFee = daysLate * 50; // Example late fee calculation
        //     const newAmount = loan.amount + lateFee;

        //     await loanRef.update({
        //         amount: newAmount,
        //         status: 'late',
        //         updatedDate: moment().toISOString()
        //     });

        //     return { success: true, message: `Late fee applied. New amount is ${newAmount}` };
        // }
        const lateFee = loan.originalAmount * 0.05 * daysLate;

        await loanRef.update({
            amount: loan.originalAmount + lateFee,
            lateFeeApplied: true
        });

        return lateFee;
    }
}

module.exports = new LoanController();