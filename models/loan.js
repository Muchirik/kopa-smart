//late fee Cron job

const cron = require('node-cron');
const LoanController = require('../controllers/loans');
const { sendSMS } = require('../services/sms');


//Run daily at 9am
cron.schedule('0 9 * * *', async () => {
    const overdueLoans = await getOverdueLoans(); //need to implement this function

    for (const loan of overdueLoans) {
        const lateFee = await LoanController.applyLateFee(loan.id);
        await sendSMS(
            loan.borrowerPhone,
            `Your loan balance is now Ksh ${loan.amount + lateFee} due to late fees`
        );
    }
});