import nodemailer from "nodemailer";

const mailConfig = {
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // set to true if you're using port 465 (SSL/TLS)
  auth: {
    user: process.env.BUSINESS_EMAIL_ADDRESS,
    pass: process.env.BUSINESS_EMAIL_PASSWORD,
  },
  tls: {
    ciphers: "TLSv1.2",
  },
};

class NodeMailer {
  /**
   * NodeMailer
   * @param {string} region Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async sendEmail(emailArray, market) {
    const transporter = nodemailer.createTransport(mailConfig);

    console.log("email array", emailArray);
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: process.env.BUSINESS_EMAIL_ADDRESS, // sender address
      to: emailArray, // list of receivers
      subject: "Translated content is ready to review", // Subject line
      html: `Please note that you have content to review for the ${market} market. Review and approve it here:<br>
      ${process.env.CONTENTHUB_BASE_URL}contentful/reviewer-translate `, // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
  }

  /**
   * NodeMailer
   * @param {string} region Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async sendContentManagerEmail(emailArray, market, total) {
    const transporter = nodemailer.createTransport(mailConfig);

    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: process.env.BUSINESS_EMAIL_ADDRESS, // sender address
      to: emailArray, // list of receivers
      subject: "Approved Translated content", // Subject line
      html: `Translated content for totalCount ${total} (${market}) has been approved  link to the approved content in ContentHub<br> (${process.env.CONTENTHUB_BASE_URL}contentful/reviewer-translate-history)`, // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
  }
}

export default new NodeMailer();
