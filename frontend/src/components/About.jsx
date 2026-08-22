import React from 'react';
import { 
  HeartHandshake, 
  Languages, 
  ShieldAlert, 
  Ghost, 
  Sparkles, 
  WifiOff, 
  Siren, 
  Database 
} from 'lucide-react';

export default function About({ onEnter }) {
  const features = [
    {
      icon: <HeartHandshake className="text-[#B84A28]" size={32} />,
      title: "Dynamic Peer Matching",
      description: "Connect based on your current feelings. If your struggles change, your matches change with you."
    },
    {
      icon: <Languages className="text-[#B84A28]" size={32} />,
      title: "Cultural Translation",
      description: "We translate meaning, not just words, ensuring local idioms and emotions are perfectly understood."
    },
    {
      icon: <ShieldAlert className="text-[#B84A28]" size={32} />,
      title: "User-Controlled Safety",
      description: "Bullying is flagged, giving you the choice to block or continue. Dangerous medical advice triggers instant clinical warnings."
    },
    {
      icon: <Ghost className="text-[#B84A28]" size={32} />,
      title: "Zero Identity",
      description: "Names, passwords, and handles are automatically masked before they ever reach the other person."
    },
    {
      icon: <Sparkles className="text-[#B84A28]" size={32} />,
      title: "Empathy Copilot",
      description: "Our AI gently nudges users with supportive, kinder ways to respond before they hit send."
    },
    {
      icon: <WifiOff className="text-[#B84A28]" size={32} />,
      title: "Accessible Anywhere",
      description: "Voice-to-text enabled and engineered to work smoothly even on low-bandwidth internet connections."
    },
    {
      icon: <Siren className="text-[#B84A28]" size={32} />,
      title: "Crisis Protocol",
      description: "In severe emergencies, the app can securely trigger location-based SOS alerts to authorities or emergency contacts."
    },
    {
      icon: <Database className="text-[#B84A28]" size={32} />,
      title: "Data Altruism",
      description: "We generate 100% synthetic, anonymous trend reports for researchers, keeping your actual chats completely private."
    }
  ];

  return (
    <div className="min-h-screen px-6 py-20 md:px-24 bg-[#FFF8F3]">
      
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-20">
        <h1 className="font-playfair text-[#1A362B] text-4xl md:text-6xl font-bold leading-tight mb-6">
          More than just a chat. <br/> A safe space built for reality.
        </h1>
        <p className="font-sans text-[#2D4A3E] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          Experience a completely reimagined support network where empathy meets absolute privacy. 
          Every feature is intentionally designed to protect, connect, and empower you.
        </p>
        
        {/* Optional "About" Button the user requested, styling it as an elegant action button */}
        <div className="mt-10">
          <button onClick={onEnter} className="bg-[#B84A28] text-white font-sans font-medium px-8 py-3 rounded-full shadow-md hover:bg-[#a04022] transition-colors">
            Enter SafeSpeak
          </button>
        </div>
      </div>

      {/* The Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {features.map((feature, index) => (
          <div 
            key={index} 
            className="bg-[#FDF3EB] p-8 rounded-3xl border border-[#E8F0EA] shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="mb-6">
              {feature.icon}
            </div>
            <h3 className="font-playfair text-[#1A362B] text-xl font-bold mb-3">
              {feature.title}
            </h3>
            <p className="font-sans text-[#2D4A3E] leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
      
    </div>
  );
}
