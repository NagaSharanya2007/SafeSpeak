import React from 'react';
import { Shield } from 'lucide-react';

export default function Header() {
  return (
    <header className="p-4 bg-secondary flex items-center justify-center shadow-lg z-20 border-b border-slate-800">
      <Shield className="text-accent mr-2" size={24} />
      <h1 className="text-xl font-bold tracking-wide text-textLight">SafeSpeak</h1>
    </header>
  );
}
