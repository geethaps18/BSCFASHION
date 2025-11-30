"use client";

import React, { useEffect, useState } from "react";

interface AnnouncementBarProps {
  messages: string[];
}

const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ messages }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [messages]);

  return (
    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-center py-2 font-semibold text-sm animate-pulse">
      {messages[currentMessageIndex]}
    </div>
  );
};

export default AnnouncementBar;
