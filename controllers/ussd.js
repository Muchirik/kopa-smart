//ussd integration

const LoanController = require('../controllers/loans');
const { sendSMS } = require('../services/sms');

class USSDController {
    async processInput(phoneNumber, text) {
        const inputs = text.split('*');
        let response = '';
        const step = inputs.length;
        //Step 1: Initial USSD request - Main Menu
        if (step === 1) {
            response = 'CON Welcome to Lipa Pole Pole\n1. Login\n2. Register';
        } 
        // step 2: User selects Login or Register
        else if (step === 2) {
            if (inputs[1] === '1') {
                //Login Flow
                response = 'CON Enter your phone or ID number:';
            } else if (inputs[1] === '2') {
                //Register Flow
                response = 'CON Are you a lender or borrower?\n1. Lender\n2. Buyer';
            }
        }
        // step 3: Registration flow
        else if (inputs[1] === '2') {
            if (inputs[2] === '1' && step === 3) {
                response = 'CON Enter ID Number:';
            } else if (inputs[2] === '1' && step === 4) {
                response = 'CON Enter your Phone Number:';
            } else if (inputs[2] === '1' && step === 5) {
                response = 'CON Please enter your Payment Mode\n1. Send Money\n2. Buy Goods\n3. Pochi la Biashara:';
            } else if (inputs[2] === '1' && step === 6) {
                response = 'CON Enter Business Name:';
            } else if (inputs[2] === '1' && step === 7) {
                response = 'CON Set PIN:';
            } else if (inputs[2] === '2' && step === 3) {
                response = 'CON Enter Phone Number:';
            } else if (inputs[2] === '2' && step === 4) {
                response = 'CON Enter ID Number:';
            } else if (inputs[2] === '2' && step === 5) {
                response = 'CON Set PIN:';
            }
            //save registration data to database
            else if (inputs[2] === '1' && step === 8) {
                // Save lender registration data
                const idNumber = inputs[3];
                const phone = inputs[4];
                const paymentMode = inputs[5];
                const businessName = inputs[6];
                const pin = inputs[7];

                await LoanController.registerLender(idNumber, phone, paymentMode, businessName, pin);
                response = 'END Registration successful. Welcome to Lipa Pole Pole!';
            } else if (inputs[2] === '2' && step === 6) {
                // Save borrower registration data
                const phone = inputs[3];
                const idNumber = inputs[4];
                const pin = inputs[5];

                await LoanController.registerBorrower(phone, idNumber, pin);
                response = 'END Registration successful. Welcome to Lipa Pole Pole!';
            }
        }
        // step 3: login flow 
        else if (inputs[1] === '1' && step === 3) {
            response = 'CON Enter PIN:';
        }
        //step 4: After login show main actions
        else if (inputs[1] === '1' && step === 4) {
            // authenticate user by checking pin
            const pin = inputs[2];
            const user = await LoanController.authenticateUser(phoneNumber, pin);
            if (!user) {
                response = 'END Invalid PIN. Please try again.';
                return response;
            } // check if user registered as lender or borrower
            if (user.type === 'buyer') {
                response = `CON Welcome ${user.phoneNumber}\n1. View Loans\n2. Request Loan\n3. Repay Loan`;
            }
            else if (user.type === 'lender') {
                // Show lender options
                response = `CON Welcome ${user.businessName}\n1. Give Loans\n2. View Loan\n3. Request Loan\n4. Repay Loan`;
            } else if (user.type === 'borrower') {
                // Show borrower options
                response = `CON Welcome ${user.phoneNumber}\n1. View Loans\n2. Request Loan\n3. Repay Loan`;
            }
            // continue with the flow based on user type
            else if (user.type === 'admin') {
                response = `CON Welcome Admin\n1. View All Loans\n2. Manage Users`;
            }
            // If user type is not recognized, show error message
             else {
                response = 'END Invalid user. Please contact support or Try again.';
                return response;
            }

        }
        // step 5: View Loans
        else if (inputs[1] === '1' && step === 5) {
            // View Loans flow
            const user = await LoanController.getUserByPhone(phoneNumber);
            if (!user) {
                response = 'END User not found. Please register or try again.';
                return response;
            }
            const loans = await LoanController.getLoansByUser(user.id);
            if (loans.length === 0) {
                response = 'END No loans found for your account.';
            } else {
                response = 'CON Your Loans:\n';
                loans.forEach((loan, index) => {
                    response += `${index + 1}. Loan ID: ${loan.id}, Amount: Ksh ${loan.amount}, Due Date: ${loan.dueDate}\n`;
                });
                response += 'Reply with the loan ID to view details or repay.';
            }

        }
        // step 6: Request Loan
        else if (inputs[1] === '2' && step === 5) {
            // Request Loan flow
            response = 'CON Enter Loan Amount:';
        }
        // step 7: Repay Loan
        else if (inputs[1] === '3' && step === 5) {
            // Repay Loan flow
            response = 'CON Enter Loan ID to repay:';
        }
        // step 8: Repay Loan details
        else if (inputs[1] === '3' && step === 6) {
            const loanId = inputs[2];
            const loan = await LoanController.getLoan(loanId);
            if (!loan) {
                response = 'END Loan not found. Please check the ID and try again.';
                return response;
            }
            response = `CON Repay Loan ID: ${loan.id}\nAmount Due: Ksh ${loan.amount}\n1. Confirm Payment\n2. Cancel`;
        }
        // step 9: Confirm Repayment
        else if (inputs[1] === '3' && inputs[3] === '1') {
            const loanId = inputs[2];
            const loan = await LoanController.getLoan(loanId);
            if (!loan) {
                response = 'END Loan not found. Please check the ID and try again.';
                return response;
            }
            // Initiate M-Pesa STK Push for repayment
            const paymentResponse = await LoanController.initiateSTKPush(phoneNumber, loan.amount, `Repayment for Loan ID: ${loan.id}`);
            if (paymentResponse.success) {
                response = `END Payment of Ksh ${loan.amount} initiated successfully. Please complete the payment on your M-Pesa app.`;
            } else {
                response = `END Payment failed: ${paymentResponse.error}`;
            }
        }
        // step 10: View Loan details
        else if (inputs[1] === '1' && inputs[2]) {
            const loanId = inputs[2];
            const loan = await LoanController.getLoan(loanId);
            if (!loan) {
                response = 'END Loan not found. Please check the ID and try again.';
                return response;
            }
            response = `CON Loan ID: ${loan.id}\nAmount: Ksh ${loan.amount}\nDue Date: ${loan.dueDate}\nStatus: ${loan.status}\n1. Repay Loan\n2. Back to Loans`;
        }
        // step 11: Repay Loan from Loan details
        else if (inputs[1] === '1' && inputs[3] === '1') {
            const loanId = inputs[2];
            const loan = await LoanController.getLoan(loanId);
            if (!loan) {
                response = 'END Loan not found. Please check the ID and try again.';
                return response;
            }
            // Initiate M-Pesa STK Push for repayment
            const paymentResponse = await LoanController.initiateSTKPush(phoneNumber, loan.amount, `Repayment for Loan ID: ${loan.id}`);
            if (paymentResponse.success) {
                response = `END Payment of Ksh ${loan.amount} initiated successfully. Please complete the payment on your M-Pesa app.`;
            } else {
                response = `END Payment failed: ${paymentResponse.error}`;
            }
        }

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
        else if (inputs[1] === '2') {
            //Repayment flow
            const loanId = inputs[2];
            const loan = await LoanController.getLoan(loanId);
            if (!loan) {
                response = 'END Loan not found. Please check the ID and try again.';
                return response;
            }
            // Initiate M-Pesa STK Push for repayment
            const paymentResponse = await LoanController.initiateSTKPush(phoneNumber, loan.amount, `Repayment for Loan ID: ${loan.id}`);
            if (paymentResponse.success) {
                response = `END Payment of Ksh ${loan.amount} initiated successfully. Please complete the payment on your M-Pesa app.`;
            } else {
                response = `END Payment failed: ${paymentResponse.error}`;
            }
        }
        // If no valid input is matched, show an error message
        else {
            response = 'END Invalid input. Please try again.';
        }
        // Send SMS notification to the user
        if (response.startsWith('END')) {
            await sendSMS(phoneNumber, response.replace('END ', ''));
        }
        // Return the response to the USSD gateway
        response = `BEGIN ${response}`;
        // Ensure the response starts with 'BEGIN' for USSD
        if (!response.startsWith('BEGIN')) {
            response = `BEGIN ${response}`;
        }
        // Return the response
        console.log(`USSD Response: ${response}`);

        return response;

    }
}

module.exports = new USSDController();