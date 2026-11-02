import React, { useState, useEffect } from 'react';
import { Github, Menu, X, Terminal, ExternalLink } from 'lucide-react';
import { githubProfile } from '../data/portfolioData';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Главная', href: '#hero' },
    { label: 'Обо мне', href: '#about' },
    { label: 'Проекты', href: '#projects' },
    { label: 'Стек', href: '#stack' },
    { label: 'Статистика', href: '#stats' },
    { label: 'Контакты', href: '#contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0C0C0C]/80 backdrop-blur-md border-b border-white/10 py-3 shadow-lg'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo / Brand */}
          <a
            href="#hero"
            className="flex items-center gap-3 group text-white font-bold text-lg tracking-wider"
          >
            <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#B600A8]/50 group-hover:ring-[#B600A8] transition-all">
              <img
                src={githubProfile.avatarUrl}
                alt={githubProfile.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="leading-tight group-hover:text-[#BBCCD7] transition-colors">
                {githubProfile.name}
              </span>
              <span className="text-[11px] font-mono text-gray-400">@{githubProfile.username}</span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#B600A8] hover:after:w-full after:transition-all after:duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* GitHub Action Button */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href={githubProfile.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-300 hover:text-white p-2 rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0C0C0C]/95 backdrop-blur-xl border-b border-white/10 px-6 py-6 flex flex-col gap-4 animate-in slide-in-from-top duration-200">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-gray-200 hover:text-white py-1"
            >
              {link.label}
            </a>
          ))}
          <a
            href={githubProfile.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 mt-2 px-4 py-3 rounded-full text-sm font-semibold uppercase tracking-wider text-white bg-[#B600A8]/20 border border-[#B600A8]/50"
          >
            <Github className="w-4 h-4" />
            <span>GitHub Profile</span>
          </a>
        </div>
      )}
    </nav>
  );
};
