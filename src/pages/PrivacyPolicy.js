// src/pages/PrivacyPolicy.js
import React from 'react';

const PrivacyPolicy = () => (
  <div className="max-w-4xl mx-auto py-10 px-4 text-gray-800 dark:text-gray-200">
    <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
    <p className="mb-4">
      Your privacy is important to us. This chatbot does not store or sell user data to third parties. We use
      authentication tokens only to secure your session and enable personalized chat history.
    </p>
    <p className="mb-4">
      Uploaded files or images are processed only for the duration of your session and are not retained permanently.
      We use HTTPS encryption and secure storage practices to protect your information.
    </p>
    <p>
      By using this application, you agree to our data policy. Any changes to this policy will be updated on this page.
    </p>
  </div>
);

export default PrivacyPolicy;