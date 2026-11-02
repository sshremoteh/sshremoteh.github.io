import React, { useState } from 'react';
import {
  Github,
  ExternalLink,
  Star,
  Terminal,
  Check,
  Copy,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { FadeIn } from './FadeIn';
import { projects } from '../data/portfolioData';
import { Project } from '../types';

export const Projects: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'Все проекты' },
    { id: 'systems', label: 'Rust & Системы' },
    { id: 'android', label: 'Android & Экосистема' },
    { id: 'ai', label: 'ИИ-Агенты & Telegram' },
    { id: 'tools', label: 'Утилиты & Инструменты' },
  ];

  const filteredProjects =
    activeCategory === 'all'
      ? projects
      : projects.filter((p) => p.category === activeCategory);

  const handleCopyClone = (repoName: string, id: string) => {
    navigator.clipboard.writeText(`git clone https://github.com/sshremoteh/${repoName}.git`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getLanguageColor = (lang: string) => {
    switch (lang) {
      case 'Rust':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      case 'Python':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'JavaScript':
      case 'TypeScript':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      default:
        return 'text-gray-300 bg-gray-500/10 border-gray-500/30';
    }
  };

  return (
    <section id="projects" className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col items-center text-center mb-16">
        <FadeIn delay={0.1}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#BBCCD7] uppercase tracking-wider mb-4">
            <Layers className="w-3.5 h-3.5" />
            Портфолио репозиториев GitHub
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white mb-4">
            Проекты <span className="hero-heading">&amp; Архитектура</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="max-w-2xl text-gray-400 text-base sm:text-lg">
            Подборка ключевых открытых разработок: от компиляторов и графических движков на Rust до
            интеграций протокола MTProto и инструментов для ИИ-агентов.
          </p>
        </FadeIn>

        {/* Filter Tabs */}
        <FadeIn delay={0.4} className="mt-8">
          <div className="flex flex-wrap justify-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </FadeIn>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project, idx) => {
          const isExpanded = expandedId === project.id;
          return (
            <FadeIn
              key={project.id}
              delay={0.1 * (idx % 3)}
              className="flex flex-col h-full"
            >
              <div className="glass-panel glass-panel-hover flex flex-col justify-between h-full rounded-2xl p-6 relative overflow-hidden group">
                {/* Accent glow on top card border */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#B600A8]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  {/* Top line: Language & Stars */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span
                      className={`text-xs font-mono font-medium px-2.5 py-1 rounded-full border ${getLanguageColor(
                        project.primaryLanguage
                      )}`}
                    >
                      {project.primaryLanguage}
                    </span>

                    <div className="flex items-center gap-1 text-xs text-gray-400 font-mono">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/20" />
                      <span>{project.stars}</span>
                      {project.featured && (
                        <span className="ml-1 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider text-purple-300 bg-purple-500/20 rounded">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Project Title */}
                  <h3 className="text-xl font-bold text-white group-hover:text-[#BBCCD7] transition-colors mb-2">
                    {project.title}
                  </h3>

                  {/* Short Description */}
                  <p className="text-sm text-gray-300 leading-relaxed mb-4">
                    {project.shortDesc}
                  </p>

                  {/* Stats highlights (if available) */}
                  {project.stats && (
                    <div className="grid grid-cols-2 gap-2 my-4 p-3 rounded-xl bg-black/40 border border-white/5">
                      {project.stats.map((s, i) => (
                        <div key={i} className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-wider text-gray-400">
                            {s.label}
                          </span>
                          <span className="text-xs font-bold text-gray-200">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Expandable full details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-300 space-y-3 animate-in fade-in duration-200">
                      <p>{project.description}</p>
                      <div>
                        <span className="font-semibold text-white block mb-1">
                          Ключевые особенности:
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-gray-400">
                          {project.highlights.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.tags.slice(0, isExpanded ? undefined : 3).map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-gray-300 border border-white/5"
                      >
                        {tag}
                      </span>
                    ))}
                    {!isExpanded && project.tags.length > 3 && (
                      <span className="text-[11px] font-mono px-1.5 py-0.5 text-gray-500">
                        +{project.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : project.id)}
                      className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <span>{isExpanded ? 'Свернуть' : 'Подробнее'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyClone(project.repoName, project.id)}
                        title="Скопировать git clone"
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                      >
                        {copiedId === project.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Открыть сайт"
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}

                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#B600A8]/30 hover:border-[#B600A8]/60 border border-white/10 text-xs font-semibold text-white transition-all"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>Код</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
};
