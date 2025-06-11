//loan management
const { initiateSTKPush } = require('../services/mpesa');
const db = require('../config/firebase');
const { getAuthToken } = require('../config/daraja');
const moment = require('moment');
const { sendSMS } = require('../services/sms');

class LoanController {
    async applyLateFee(loanId) {
        const loanRef = db.collection('loans').doc(loanId);
        if (daysLate <= 0 ) return 0; // No late fee if not overdue
        const loan = (await loanRef.get()).data();
        const daysLate = moment().diff(moment(loan.dueDate), 'days');
        const lateFee = loan.originalAmount * 0.05 * daysLate;

        //calculate 1% of the original amount will change later to 1% of late fee
        const commission = lateFee * 0.01; // 1% of 5% is 0.05 * 0.02 = 0.01 of the originalAmount per day

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
        loanId = loanRef.id;
        await loanRef.set({
            vendorPhone,
            borrowerPhone,
            amount,
            originalAmount: amount,
            dueDate: moment(dueDate).toISOString(),
            status: 'pending_borrower_confirmation',
            createdDate: moment().toISOString()
        });
        //send sms to borrower to confirm
        await sendSMS(
            borrowerPhone,
            `You have a loan offer of Ksh ${amount} due on ${moment(dueDate).format('YYYY-MM-DD')} from vendor ${vendorPhone}. Reply with *123*${loanId}*1# to accept or *123*${loanId}*2# to reject.`
        );

        return loanId;
    }

    async confirmLoan(loanId, borrowerPhone, confirm) {
        const loanRef = db.collection('loans').doc(loanId);
        const loanDoc = await loanRef.get();
        if (!loanDoc.exists) throw new Error('Loan not found');
        const loan = loanDoc.data();

        if (loan.borrowerPhone !== borrowerPhone) throw new Error('Unauthorized');

        if (confirm) {
            await loanRef.update({ status: 'active', confirmedDate: moment.toISOString() });
            // Notify vendor
            await sendSMS(
                loan.vendorPhone,
                `Borrower ${borrowerPhone} has accepted the loan offer for ${loan.amount}.`
            );
            return 'Loan Confirmed';
        } else {
            await loanRef.update({ status: 'cancelled', cancelledDate: moment().toISOString() });
            // Notify vendor
            await sendSMS(
                loan.vendorPhone,
                `Borrower ${borrowerPhone} has rejected the loan offer of Ksh ${loan.amount}.`
            );
            return 'loan cancelled';
        }
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