import React from 'react';
import { Github, Heart, ArrowUp } from 'lucide-react';
import { githubProfile } from '../data/portfolioData';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-white/10 bg-[#080808] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <img
            src={githubProfile.avatarUrl}
            alt={githubProfile.name}
            className="w-8 h-8 rounded-full ring-1 ring-white/20"
          />
          <div className="text-xs text-gray-400">
            <span className="font-semibold text-white">{githubProfile.name}</span> (@{githubProfile.username}) • {new Date().getFullYear()}
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center flex items-center gap-1.5">
          <span>Разработано на React, Tailwind CSS &amp; framer-motion</span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href={githubProfile.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="GitHub Profile"
          >
            <Github className="w-5 h-5" />
          </a>

          <button
            onClick={scrollToTop}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            aria-label="Наверх"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
};
