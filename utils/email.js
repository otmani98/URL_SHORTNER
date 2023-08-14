const nodemailer = require('nodemailer');

module.exports = class email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Ahmed Otmani <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    //SENDGRID nodemailer
    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: process.env.SENDGRID_USERNAME,
        pass: process.env.SENDGRID_PASSWORD,
      },
    });
  }

  async send(text, subject) {
    //Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text: `${text} \n ${this.url}`,
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)',
    );
  }

  async sendConfirmation() {
    await this.send(
      'Confirm your acount to activate it',
      'This confirmation Token (valid for only 8 hours)',
    );
  }
};
