import React from 'react';
import { Globe } from 'lucide-react';

const SocialLinks = () => {
  return (
    <div className="flex items-center gap-3 justify-center w-full md:w-auto mt-4 md:mt-0 mb-2 md:mb-0 ml-4">
      <a 
        href="https://amazonicone.com.br/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-emerald-500 transition-colors duration-200 hover:scale-105 transform flex items-center gap-1.5 text-xs font-semibold"
      >
        <Globe size={16} />
        <span>Amazonic One</span>
      </a>
    </div>
  );
};

export default SocialLinks;
