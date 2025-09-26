
const {SESClient} = require("@aws-sdk/client-ses");

const REGION = "ap-south-1";

const sesClient = new SESClient({
  region: REGION,
  credentials: {
    accessKeyId: "AKIAW3RWMQYOZSYIWSWA",
    secretAccessKey: "yeNlm3z1Ug8e / xTmwC + DHrL1jGbIYV0TrZsqBAuL",
  },
});
module.exports = sesClient;