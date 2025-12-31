import React from 'react';
import { ExternalLink, CreditCard, Search, Gift } from 'lucide-react';

const TravelToolkit: React.FC = () => {
  const tools = [
    {
      name: 'Google Flights',
      desc: 'Best for cash price comparison and tracking.',
      url: 'https://www.google.com/travel/flights',
      icon: <Search className="w-5 h-5 text-blue-600" />,
      tag: 'Cash Logic'
    },
    {
      name: 'PointsYeah',
      desc: 'Fastest free search for finding award seats across 20+ programs.',
      url: 'https://www.pointsyeah.com/',
      icon: <Gift className="w-5 h-5 text-purple-600" />,
      tag: 'Free Tool'
    },
    {
      name: 'Roame.travel',
      desc: 'Great visual search for Amex transfer partners (Delta, British Airways).',
      url: 'https://roame.travel/',
      icon: <ExternalLink className="w-5 h-5 text-indigo-600" />,
      tag: 'Free Tool'
    },
    {
      name: 'Amex Transfer Partners',
      desc: 'Official list of where you can send your points.',
      url: 'https://global.americanexpress.com/rewards/transfer',
      icon: <CreditCard className="w-5 h-5 text-blue-500" />,
      tag: 'Official'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Gift className="w-5 h-5 text-slate-500" />
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Points & Travel Toolkit</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tools.map((tool) => (
          <a 
            key={tool.name}
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all group"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-white rounded-md shadow-sm group-hover:shadow-md transition-shadow">
                {tool.icon}
              </div>
              <span className="text-[10px] font-semibold px-2 py-1 bg-slate-200 text-slate-600 rounded-full">
                {tool.tag}
              </span>
            </div>
            <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-700">{tool.name}</h3>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tool.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
};

export default TravelToolkit;