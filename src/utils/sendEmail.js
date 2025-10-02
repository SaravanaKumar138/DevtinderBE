// const { SendEmailCommand } = require("@aws-sdk/client-ses");

// const sesClient = require("./sesClient");

// const createSendEmailCommand = (toAddress, fromAddress) => {
//   return new SendEmailCommand({
//     Destination: {
//       CcAddresses: [],
//       ToAddresses: [toAddress],
//     },
//     Message: {
//       /* required */
//       Body: {
//         /* required */
//         Html: {
//           Charset: "UTF-8",
//           Data: "<h1>This is from saravana</h1>",
//         },
//         Text: {
//           Charset: "UTF-8",
//           Data: "This is plain text",
//         },
//       },
//       Subject: {
//         Charset: "UTF-8",
//         Data: "hello from SES",
//       },
//     },
//     Source: fromAddress,
//     ReplyToAddresses: [
//       /* more items */
//     ],
//   });
// };

// const run = async () => {
//   const sendEmailCommand = createSendEmailCommand(
//     "2312061@nec.edu.in",
//     "godsaran05@gmail.com"
//   );

//   try {
//     return await sesClient.send(sendEmailCommand);
//   } catch (caught) {
//     if (caught instanceof Error && caught.name === "MessageRejected") {
//       /** @type { import('@aws-sdk/client-ses').MessageRejected} */
//       const messageRejectedError = caught;
//       return messageRejectedError;
//     }
//     throw caught;
//   }
// };

// // module.exports = run;
