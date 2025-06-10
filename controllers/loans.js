//loan management
const { initiateSTKPush } = require('../services/mpesa');
const db = require('../config/firebase');
const { getAuthToken } = require('../config/daraja');
const moment = require('moment');

class LoanController {
    async applyLateFee(loanId) {
        const loanRef = db.collection('loans').doc(loanId);
        const loan = (await loanRef.get()).data();
        const daysLate = moment().diff(moment(loan.dueDate), 'days');
        const lateFee = loan.originalAmount * 0.05 * daysLate;

        //calculate 1% of the original amount will change later to 1% of late fee
        const commission = lateFee * 0.02; // 1% of 5% is 0.05 * 0.02 = 0.01 of the originalAmount per day

        await loanRef.update({
            amount: loan.originalAmount +  lateFee,
            lateFeeApplied: true,
            commission: commission,
            status: 'late',
            updatedDate: moment().toISOString()
        })

        //send commission to ken
        if (commission > 0) {
            await initiateSTKPush('0706219989', Math.round(commission), `commission for loan ${loanId}`);
        }
        return lateFee;
    }


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

    async getLoan(loanId) {
        const loanRef = db.collection('loans').doc(loanId);
        const loan = await loanRef.get();
        if (!loan.exists) {
            throw new Error('Loan not found');
        }
        return { id: loan.id, ...loan.data() };
    }
}

module.exports = new LoanController();