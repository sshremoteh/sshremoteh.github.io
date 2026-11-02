import React from 'react';
import { Cpu, Terminal, Shield, Zap, Code, HardDrive, Radio, GitBranch } from 'lucide-react';
import { FadeIn } from './FadeIn';
import { skillCategories } from '../data/portfolioData';

export const TechStack: React.FC = () => {
  const getCategoryIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Code className="w-5 h-5 text-orange-400" />;
      case 1:
        return <Cpu className="w-5 h-5 text-purple-400" />;
      case 2:
        return <Radio className="w-5 h-5 text-blue-400" />;
      default:
        return <Zap className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <section id="stack" className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Background radial accent */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#7621B0]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Section Header */}
      <div className="flex flex-col items-center text-center mb-16">
        <FadeIn delay={0.1}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#BBCCD7] uppercase tracking-wider mb-4">
            <Terminal className="w-3.5 h-3.5" />
            Технический стек и экспертиза
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white mb-4">
            Инженерный <span className="hero-heading">Арсенал</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="max-w-2xl text-gray-400 text-base sm:text-lg">
            Специализация на стыке низкоуровневой оптимизации железа, графических API, реверс-инжиниринга
            и современных протоколов искусственного интеллекта.
          </p>
        </FadeIn>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {skillCategories.map((category, catIdx) => (
          <FadeIn key={catIdx} delay={0.15 * catIdx} className="h-full">
            <div className="glass-panel rounded-2xl p-6 h-full flex flex-col justify-between border border-white/10 relative overflow-hidden">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    {getCategoryIcon(catIdx)}
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-wide">{category.title}</h3>
                </div>

                <div className="space-y-4">
                  {category.skills.map((skill, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3.5 rounded-xl bg-black/30 border border-white/5 hover:border-white/15 transition-all group"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-semibold text-sm text-gray-100 group-hover:text-white transition-colors">
                          {skill.name}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${
                            skill.level === 'Expert'
                              ? 'text-purple-300 bg-purple-500/20 border-purple-500/40'
                              : skill.level === 'Advanced'
                              ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40'
                              : 'text-blue-300 bg-blue-500/20 border-blue-500/40'
                          }`}
                        >
                          {skill.level}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{skill.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom indicator */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-gray-500">
                <span>Production verified</span>
                <GitBranch className="w-3.5 h-3.5" />
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
};
