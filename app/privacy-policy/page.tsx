export const dynamic = "force-dynamic";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <p className="mt-4">
        BSCFASHION (“we”, “our”, “us”) is committed to protecting your privacy.
        This Privacy Policy explains how we collect, use and safeguard your information.
      </p>

      <h2 className="text-xl font-semibold mt-6">Information We Collect</h2>
      <ul className="list-disc ml-6 mt-2">
        <li>Name, email, phone number</li>
        <li>Shipping address</li>
        <li>Payment details (processed securely by Razorpay)</li>
        <li>Purchase history and site usage</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6">How We Use Your Information</h2>
      <ul className="list-disc ml-6 mt-2">
        <li>To process and deliver orders</li>
        <li>To improve our products and store experience</li>
        <li>For customer support</li>
        <li>For secure payment processing</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6">Payment Information</h2>
      <p className="mt-2">
        We use Razorpay to process payments. Razorpay securely handles all card/UPI data and we do not store sensitive payment details.
      </p>

      <h2 className="text-xl font-semibold mt-6">Contact Us</h2>
      <p className="mt-2">
        Email: geethaps2001@gmail.com  
        <br />Phone: +91 XXXXXXXXXX
      </p>
    </div>
  );
}
