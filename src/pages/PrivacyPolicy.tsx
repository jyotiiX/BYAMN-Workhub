
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import React from "react";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen px-6 py-10 max-w-4xl mx-auto text-gray-800 dark:text-gray-200">
         <Navbar />
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm mb-6">
        Last updated: <strong>9 January 2026</strong>
      </p>

      <p className="mb-6">
        BYAMN-Workhub ("we", "our", "us") respects your privacy and is committed to
        protecting your personal data. This Privacy Policy explains what
        information we collect, why we collect it, how it is used, stored, and
        protected, and the rights you have when using our platform.
      </p>

      <p className="mb-6">
        This policy applies to all users of the BYAMN-Workhub website and
        services.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        1. Information We Collect
      </h2>
      <p className="mb-4">
        We collect only the minimum information necessary to provide and operate
        our services.
      </p>

      <h3 className="font-semibold mb-2">
        a) Account & Identity Information
      </h3>
      <p className="mb-4">
        When you sign up or log in using Google Authentication, we may collect:
      </p>
      <ul className="list-disc ml-6 mb-4">
        <li>Name</li>
        <li>Email address</li>
        <li>Profile photo (if available)</li>
        <li>Google Account ID</li>
      </ul>
      <p className="mb-4">
        We do not collect or store your Google account password.
      </p>

      <h3 className="font-semibold mb-2">b) Payment Information</h3>
      <p className="mb-4">
        To process payouts for completed work, we collect your UPI ID. We do not
        store bank account numbers, PINs, or sensitive financial credentials.
      </p>

      <h3 className="font-semibold mb-2">c) Work & Submission Data</h3>
      <p className="mb-4">
        When you complete tasks or jobs on the platform, we may collect:
      </p>
      <ul className="list-disc ml-6 mb-4">
        <li>Screenshots or proof of work</li>
        <li>Task-related metadata such as timestamps and status</li>
      </ul>

      <h3 className="font-semibold mb-2">d) Technical & Usage Data</h3>
      <p className="mb-4">
        For security and performance purposes, we may automatically collect
        limited technical information such as device type, browser type, IP
        address, and basic usage logs.
      </p>

      <h3 className="font-semibold mb-2">e) Cookies & Local Storage</h3>
      <p className="mb-6">
        We use only essential cookies and local storage required for
        authentication, session management, and core platform functionality. We
        do not use advertising or tracking cookies.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        2. How We Use Your Information
      </h2>
      <p className="mb-4">
        Your information is used strictly for operating and improving the
        platform, including:
      </p>
      <ul className="list-disc ml-6 mb-6">
        <li>Creating and managing user accounts</li>
        <li>Authenticating users securely</li>
        <li>Verifying work submissions</li>
        <li>Processing payments and payouts</li>
        <li>Preventing fraud and misuse</li>
        <li>Maintaining platform security and reliability</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        3. Tools & Technologies Used
      </h2>
      <p className="mb-4">
        BYAMN-Workhub uses trusted third-party services to operate securely and
        efficiently:
      </p>
      <ul className="list-disc ml-6 mb-6">
        <li>
          <strong>Google Firebase</strong> for authentication, database, and file
          storage
        </li>
        <li>
          <strong>Cloud hosting services</strong> for secure server
          infrastructure
        </li>
        <li>
          <strong>HTTPS/TLS encryption</strong> for data transmitted between your
          device and our servers
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        4. Data Storage & Security
      </h2>
      <p className="mb-6">
        We take reasonable technical and organizational measures to protect your
        data. Information is stored on secure infrastructure provided by Google
        Firebase. Access to data is restricted and role-based, and administrative
        actions are logged for accountability. While no system is completely
        secure, we actively work to safeguard user information.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        5. Admin Access & Internal Controls
      </h2>
      <p className="mb-6">
        Authorized administrators may access limited user data only when
        necessary for verifying work, resolving disputes, processing payments,
        or maintaining platform security. All such access is logged, and data is
        never accessed for personal or commercial misuse.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        6. Data Retention
      </h2>
      <p className="mb-6">
        We retain personal data only for as long as required to operate the
        platform, comply with legal obligations, and resolve disputes. Account
        data is retained while your account remains active. You may request data
        deletion, subject to payment or legal requirements.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        7. Data Sharing
      </h2>
      <p className="mb-6">
        We do not sell, rent, or trade your personal data. Data is shared only
        with essential service providers required to run the platform, such as
        Firebase, and solely for operational purposes.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        8. Your Rights
      </h2>
      <p className="mb-4">You have the right to:</p>
      <ul className="list-disc ml-6 mb-6">
        <li>Access your personal data</li>
        <li>Request correction of inaccurate information</li>
        <li>Request deletion of your data</li>
        <li>Withdraw consent by discontinuing platform use</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        9. Children’s Privacy
      </h2>
      <p className="mb-6">
        BYAMN-Workhub is not intended for children under the age of 13. We do not
        knowingly collect personal data from children.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        10. Changes to This Policy
      </h2>
      <p className="mb-6">
        We may update this Privacy Policy from time to time. Any changes will be
        reflected on this page with an updated revision date.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        11. Contact Us
      </h2>
      <p>
        If you have any questions or concerns regarding this Privacy Policy,
        please contact us at:
      </p>
      <p className="mt-2 font-medium">
        📧 byamn.workhub@gmail.com
      </p> <Footer />
    </div>
  );
};

export default PrivacyPolicy;
