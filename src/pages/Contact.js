// src/pages/Contact.js
import React from 'react';

const Contact = () => (
  <div className="max-w-4xl mx-auto py-10 px-4 text-gray-800 dark:text-gray-200">
    <h1 className="text-3xl font-bold mb-4">Contact</h1>
    <p className="mb-4">We’d love to hear from you! Whether you have suggestions, bug reports, or just want to say hello:</p>
    <ul className="list-disc list-inside">
      <li>Email: <a href="mailto:omkarbidave01@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">Omkar's Mail</a></li>
      <li>GitHub: <a href="https://github.com/omkarbidave" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Omkar's GitHub</a></li>
      <li>LinkedIn: <a href="https://www.linkedin.com/in/omkar-bidave/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Omkar's LinkedIn</a></li>
      <li>Mobile:<span className="text-blue-600 dark:text-blue-400 hover:underline"> 9834863881</span></li>
    </ul>
  </div>
);

export default Contact;
