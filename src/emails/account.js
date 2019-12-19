const sgMail = require('@sendgrid/mail'); 

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to:email,
        from:'dhairya999pateriya@gmail.com',
        subject:'Thank you for joining us.',
        text:`Welcome to the app, ${name}. Let me know how you get along with the app.`
    });
};

const sendByeEmail = (email,name)=>{
    sgMail.send({
        to:email,
        from:'dhairya999pateriya@gmail.com',
        subject:'Account deleted.',
        text:`Goodbye ${name}. It was really nice having you with us. Kindly give us feedback on how we can improve our services`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendByeEmail
}