// src/pages/About.js
import React from 'react';

const About = () => (
  <div className="max-w-4xl mx-auto py-10 px-4 text-gray-800 dark:text-gray-200">
    <h1 className="text-3xl font-bold mb-4">About the Hybrid AI Chatbot</h1>
    <p className="mb-4">
      The Hybrid AI Chatbot is a futuristic conversational assistant developed by Omkar Bidave using a dual-mode
      approach: online via Google Gemini and offline fallback using Ollama. This project demonstrates resilience,
      innovation, and real-world problem solving in network-constrained environments.
    </p>
    <p className="mb-4">
      The bot features a dynamic chat interface, dark/light theme support, secure authentication, and intelligent
      session management. It is designed for scalable deployment and showcases advanced frontend-backend integration
      with fallback logic.
    </p>
    <p>
      The project is part of Omkar's journey toward building intelligent systems that are accessible and reliable in
      both connected and offline scenarios, aligning with industry expectations for 15–20 LPA software roles.
    </p>
  </div>
);

export default About;