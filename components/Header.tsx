import React from 'react';
import { PinIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="text-center my-6 md:my-8">
      <div className="flex items-center justify-center gap-4 mb-2">
        <PinIcon className="w-10 h-10 text-blue-500"/>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
          Nearby Discovery
        </h1>
      </div>
      <p className="text-lg text-gray-500">Find your next favorite spot, powered by Gemini.</p>
    </header>
  );
};

export default Header;