//ussd integration

const LoanController = require("../controllers/loans");
const { sendSMS } = require("../services/sms");
const db = require("../config/firebase");
const moment = require("moment");

class USSDController {
  async processInput(phoneNumber, text) {
    const inputs = text.split("*");
    let response = "";
    const step = inputs.length;

    //Step 1: Initial USSD request - Main Menu
    if (step === 1) {
      response = "CON Welcome to Lipa Pole Pole\n1. Login\n2. Register";
    }
    // step 2: User selects Login or Register
    else if (step === 2) {
      if (inputs[1] === "1") {
        //Login
        response = "CON Enter your phone or ID number:";
      } else if (inputs[1] === "2") {
        //Register
        response = "CON Are you a:\n1. Vendor\n2. Buyer";
      }
    }
    // Registration flow
    else if (inputs[1] === "2") {
      //vendor ragistration
      if (inputs[2] === "1") {
        if (step === 3) response = "CON Enter ID Number:";
        else if (step === 4) response = "CON Enter your Phone Number:";
        else if (step === 5)
          response =
            "CON Choose Payment Mode:\n1. Send Money\n2. Buy Goods\n3. Pochi la Biashara";
        else if (step === 6) response = "CON Enter Business Name:";
        else if (step === 7) response = " CON Set PIN:";
        else if (step === 8) {
          //save vendor registration
          const idNumber = inputs[3];
          const phone = inputs[4];
          const paymentMode = inputs[5];
          const businessName = inputs[6];
          const pin = inputs[7];
          // TODO: Hash PIN before saving
          //   const type = "vendor";
          await LoanController.registerLender(
            idNumber,
            phone,
            paymentMode,
            businessName,
            pin
          );
          response = "END Registration successful. Welcome to Lipa Pole Pole!";
        }
      }
      // Buyer Registration
      else if (inputs[2] === "2") {
        if (step === 3) response = "CON Enter Phone Number:";
        else if (step === 4) response = "CON Enter ID Number:";
        else if (step === 5) response = "CON Set PIN:";
        else if (step === 6) {
          // Save buyer registration data
          const phone = inputs[3];
          const idNumber = inputs[4];
          const pin = inputs[5];
          // TODO: Hash PIN before  saving
          //   const type = "buyer";

          await LoanController.registerBorrower(phone, idNumber, pin);
          response = "END Registration successful. Welcome to Lipa Pole Pole!";
        }
      }
    }
    // step 3: login flow
    else if (inputs[1] === "1") {
      if (step === 3) {
        response = "CON Enter PIN:";
      } else if (step === 4) {
        //Authenticate user
        const userIdOrPhone = inputs[2];
        const pin = inputs[3];
        const user = await LoanController.authenticateUser(userIdOrPhone, pin);
        if (!user) {
          response = "END Invalid credentials. Please try again.";
        } else if (user.type === "vendor") {
          response = `CON Welcome ${user.businessName}\n1. Give Loan\n2. Request Loan\n3. Repay Loan\n4. View Loans`;
        } else if (user.type === "buyer") {
          response = `CON Welcome ${user.phoneNumber}\n1. Request Loan\n2. Repay Loan\n3. View Loans`;
        } else {
          response = "END Invalid user type. Contact Support.";
        }
      }
      //vendor Give Loan
      else if (inputs[4] === "1" && step === 5) {
        response = "CON Enter borrower phone number:";
      } else if (inputs[4] === "1" && step === 6) {
        response = "CON Enter loan amount:";
      } else if (inputs[4] === "1" && step === 7) {
        response = "Enter loan period (days):";
      } else if (inputs[4] === "1" && step === 8) {
        // create loan and prompt borrower for confirmation
        const vendorIdOrPhone = inputs[2];
        const borrowerPhone = inputs[5];
        const amount = inputs[6];
        const period = inputs[7];
        const dueDate = moment().add(Number(period), "days").toString();
        const loanId = await LoanController.createLoan(
          vendorIdOrPhone,
          borrowerPhone,
          amount,
          dueDate
        );
        //TODO: Send prompt to borrower for confirmation
        response = `END Loan offer sent to borrower for Ksh ${amount}. Awaiting confirmation.`;
      }
      //vendor Request Loan (from another vendor)
      else if (inputs[4] === "2" && step === 5) {
        response = "CON Enter vendor phone/till:";
      } else if (inputs[4] === "2" && step === 6) {
        response = "CON Enter amount:";
      } else if (inputs[4] === "2" && step === 7) {
        response = "CON Enter loan period in days:";
      } else if (inputs[4] === "2" && step === 8) {
        //Request Loan logic
        const borrowerPhone = inputs[2];
        const vendorPhone = inputs[5];
        const amount = inputs[6];
        const period = inputs[7];
        const dueDate = moment().add(Number(period), "days").toISOString();
        const loanId = await LoanController.requestLoan(
          borrowerPhone,
          vendorPhone,
          amount,
          dueDate
        );
        //TODO: prompt vendor for confirmation
        response = `END Loan request sent to ${vendorPhone}. Awaiting confirmation.`;
      }
      // Repay Loan (vendor or buyer)
      else if (
        (inputs[4] === "3" && step === 5 && inputs[1] === "1") || //Vendor: Repay Loan
        (inputs[4] === "2" && step === 5 && inputs[1] === "1") // Buyer: Repay Loan
      ) {
        const userIdOrPhone = inputs[2];
        // only show loans that are active or late
        const loans = await LoanController.getLoansByUser(userIdOrPhone, [
          "active",
          "late",
        ]);
        if (!loans.length) {
          response = "END No loans to repay.";
        } else {
          response = "CON Select loan to repay\n";
          loans.forEach((loan, i) => {
            response += `${i + 1}. Ksh ${loan.amount} - Due:${moment(
              loan.dueDate
            ).format("YYYY-MM-DD")}\n`;
          });
        }
      }
      // Repay Loan - select and confirm
      else if (
        (inputs[4] === "3" && step === 6 && inputs[1] === "1") || // Vendor: Repay Loan
        (inputs[4] === "2" && step === 6 && inputs[1] === "1") // Buyer: Repay Loan
      ) {
        const userIdOrPhone = inputs[2];
        const loanIndex = Number(inputs[5]) - 1;
        const loans = await LoanController.getLoansByUser(userIdOrPhone, [
          "active",
          "late",
        ]);
        if (!loans[loanIndex]) {
          response = "END Invalid loan selection";
        } else {
          const loan = loans[loanIndex];
          await LoanController.initiateSTKPush(
            phoneNumber,
            loan.amount,
            `Repayment for loan ID: ${loan.id}`
          );
          response = `END Payment of Ksh ${loan.amount} initiated. Complete on your M-Pesa app.`;
        }
      }

      // Buyer Request Loan
      //   else if (inputs[4] === "1" && step === 5) {
      //     response = "CON Enter vendor phone/till:";
      //   } else if (inputs[4] === "1" && step === 6) {
      //     response = "CON Enter Amount:";
      //   } else if (inputs[4] === "1" && step === 7) {
      //     response = "CON Enter Loan Period (days):";
      //   } else if (inputs[4] === "1" && step === 8) {
      //Request loan logic
      //TODO Prompt vendor for confirmation
      // response = "END Loan request sent to vendor.";
      //   }

      // View Loans (vendor 4, buyer: 3)
      else if (
        (inputs[4] === "4" && step === 5) || // Vendor
        (inputs[4] === "3" && step === 5) // Buyer
      ) {
        const userIdOrPhone = inputs[2];
        // Show all loans except cancelled/rejected
        const loans = await LoanController.getLoansByUser(userIdOrPhone, [
          "active",
          "late",
          "pending_borrower_confirmation",
          "pending_vendor_confirmation",
          "paid",
        ]);
        if (!loans.length) {
          response = "END No loans found for your account.";
        } else {
          response = "CON Your Loans:\n";
          loans.forEach((loan, index) => {
            response += `${index + 1}. Ksh ${loan.amount}- Due: ${moment(
              loan.dueDate
            ).format("YYYY-MM-DD")}\n`;
          });
          response += "Reply with the number to view details.";
        }
      }
      // View Loan Details
      else if (
        (inputs[4] === "4" && step === 6 && inputs[1] === "1") || // Vendor
        (inputs[4] === "3" && step === 6 && inputs[1] === "1") // Buyer
      ) {
        const userIdOrPhone = inputs[2];
        const loanIndex = Number(inputs[5]) - 1;
        const loans = await LoanController.getLoansByUser(userIdOrPhone, [
          "active",
          "late",
          "pending_borrower_confirmation",
          "pending_vendor_confirmation",
          "paid",
        ]);
        if (!loans[loanIndex]) {
          response = "END Invalid loan selection.";
        } else {
          const loan = loans[loanIndex];
          response = `CON Loan Details:
                    Amount: Ksh ${loan.amount}
                    Due: ${moment(loan.dueDate).format("YYYY-MM-DD")}
                    Status: ${loan.status}
                    1. Repay Loan
                    2. Back
                    `;
        }
      }
      // Handle Repayment from loan details
      else if (
        (inputs[4] === "4" &&
          step === 7 &&
          inputs[6] === "1" &&
          inputs[1] === "1") || // vendor
        (inputs[4] === "3" &&
          step === 7 &&
          inputs[6] === "1" &&
          inputs[1] === "1") // Buyer
      ) {
        const userIdOrPhone = inputs[2];
        const loanIndex = Number(inputs[5]) - 1;
        const loans = await LoanController.getLoansByUser(userIdOrPhone, [
            "active",
            "late"
        ]);
        if (!loans[loanIndex]) {
          response = "END Invalid loan selection.";
        } else {
          const loan = loans[loanIndex];
          //Initiate STK push for repayment
          await LoanController.initiateSTKPush(
            phoneNumber,
            loan.amount,
            `Repayment for Loan ID: ${loan.loanId}`
          );
          response = `END Payment of Ksh ${loan.amount} initiated. Complete on your M-Pesa app.`;
        }
      }
      // Handle Back Option from Loan Details
      else if (
        (
            ((inputs[4] === "4" &&
            step === 7 &&
            inputs[6] === "2") && inputs[1] === "1") || // Vendor
        ((inputs[4] === "3" &&
          step === 7 &&
          inputs[6] === "2") && inputs[1] === "1") // Buyer
        )
      ) {
        // Go back to loans list
        const userIdOrPhone = inputs[2];
        const loans = await LoanController.getLoansByUser(userIdOrPhone, [
            "active",
            "late",
            "pending_borrower_confirmation",
            "pending_vendor_confirmation",
            "paid"
        ]);
        response = "CON Your loans:\n";
        loans.forEach((loan, index) => {
          response += `${index + 1}. Ksh ${loan.amount} - Due: ${moment(
            loan.dueDate
          ).format("YYYY-MM-DD")}\n`;
        });
        response += "Reply with the number to view details.";
      }

      // Loan Confirmation via USSD (borrower or vendor)
      else if (
        step === 5 &&
        inputs[1] === "1" &&
        inputs[2] &&
        (inputs[3] === "1" || inputs[3] === "2")
      ) {
        // *123*loanId*1# or *123*loanId*2#
        const loanId = inputs[2];
        const confirm = inputs[3] === "1";
        // Try borrower confirmation first
        try {
            const result  = await LoanController.confirmLoan(loanId, phoneNumber, confirm);
            response = `END ${result}`;
        } catch (err) {
            // If not borrower, try vendor confirmation
            try {
                const result = await LoanController.vendorConfirmLoan(loanId, phoneNumber, confirm);
                response = `END ${result}`;
            } catch (err2) {
                response = "END Invalid confirmation or unauthorized.";
            }
        }
      }
      else {
        response = "END Invalid input. Please try again.";
      }

      // Send SMS for END responses
      if (response.startsWith("END")) {
        await sendSMS(phoneNumber, response.replace("END", "").trim());
      }

      return response;
    }
  }
}

module.exports = new USSDController();
