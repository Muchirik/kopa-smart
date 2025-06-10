//ussd integration

const LoanController = require('../controllers/loans');
const { sendSMS } = require('../services/sms');

class USSDController {
    async processInput(phoneNumber, text) {
        const inputs = text.split('*');
        let response = '';

        if (inputs.length === 1) {
            response = 'CON Lipa Pole Pole\n1. Request Loan\n2. Repay Loan';

        }
        else if (inputs[1] === '1') {
            //Loan request flow
            const amount = inputs[2];
            const vendorPhone = inputs[3];
            const dueDate = moment().add(7, 'days').format('YYYY-MM-DD')

            const loanId = await LoanController.createLoan(
                vendorPhone,
                phoneNumber,
                amount,
                dueDate
            );

            response = `End Loan of Ksh ${amount} approved. Due ${dueDate}`;
        }

        return response;

    }
}

module.exports = new USSDController();