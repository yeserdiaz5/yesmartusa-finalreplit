import { sendSellerWelcomeEmail } from "./lib/email/welcome-seller"

async function testEmail() {
  try {
    console.log("Sending test email to diazyeser@gmail.com...")
    
    const result = await sendSellerWelcomeEmail({
      to: "diazyeser@gmail.com",
      sellerName: "Yeser"
    })
    
    console.log("Email sent successfully!", result)
  } catch (error) {
    console.error("Error sending email:", error)
  }
}

testEmail()
