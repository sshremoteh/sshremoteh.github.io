import React from 'react';
import { Github, GitPullRequest, Star, Users, FolderGit2, Flame, ExternalLink } from 'lucide-react';
import { FadeIn } from './FadeIn';
import { githubProfile } from '../data/portfolioData';

export const GithubStats: React.FC = () => {
  const stats = [
    {
      label: 'Публичные репозитории',
      value: githubProfile.publicRepos,
      sub: 'Rust, Python, Systems',
      icon: <FolderGit2 className="w-5 h-5 text-purple-400" />,
    },
    {
      label: 'Основной язык ядра',
      value: 'Rust 100%',
      sub: 'Движки, компиляторы, Vulkan',
      icon: <Flame className="w-5 h-5 text-orange-400" />,
    },
    {
      label: 'APK Ускорение (RAC)',
      value: '23.5x',
      sub: 'Без JVM и Android SDK',
      icon: <Star className="w-5 h-5 text-emerald-400" />,
    },
    {
      label: 'Подписчики GitHub',
      value: githubProfile.followers,
      sub: 'Активный контрибьютор',
      icon: <Users className="w-5 h-5 text-blue-400" />,
    },
  ];

  const languages = [
    { name: 'Rust', percentage: 55, color: '#F74C00' },
    { name: 'Python', percentage: 25, color: '#3572A5' },
    { name: 'TypeScript / JS', percentage: 15, color: '#F1E05A' },
    { name: 'Shell / C', percentage: 5, color: '#89E051' },
  ];

  return (
    <section id="stats" className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col items-center text-center mb-16">
        <FadeIn delay={0.1}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#BBCCD7] uppercase tracking-wider mb-4">
            <Github className="w-3.5 h-3.5" />
            GitHub Аналитика
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white mb-4">
            Метрики <span className="hero-heading">&amp; Активность</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="max-w-2xl text-gray-400 text-base sm:text-lg">
            Количественные показатели разработки, распределение технологий и профиль в GitHub
            экосистеме.
          </p>
        </FadeIn>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((item, idx) => (
          <FadeIn key={idx} delay={0.1 * idx}>
            <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {item.label}
                </span>
                <div className="p-2 rounded-xl bg-white/5">{item.icon}</div>
              </div>
              <div className="text-3xl font-black text-white tracking-tight mb-1">{item.value}</div>
              <div className="text-xs text-gray-400 font-mono">{item.sub}</div>
            </div>
          </FadeIn>
        ))}
      </div>

      {/* Two Column Section: Language Distribution + GitHub Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Languages breakdown */}
        <FadeIn delay={0.2}>
          <div className="glass-panel p-8 rounded-2xl border border-white/10 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Распределение языков</h3>
              <p className="text-sm text-gray-400 mb-6">
                Преобладание системного Rust в движках и компиляторах, дополненное Python для ИИ-интеграций и веб-технологиями.
              </p>

              {/* Progress Bar */}
              <div className="w-full h-3 rounded-full bg-black/50 overflow-hidden flex mb-6">
                {languages.map((lang, idx) => (
                  <div
                    key={idx}
                    style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }}
                    title={`${lang.name}: ${lang.percentage}%`}
                    className="h-full transition-all duration-500"
                  />
                ))}
              </div>

              {/* Language legend */}
              <div className="grid grid-cols-2 gap-4">
                {languages.map((lang, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: lang.color }}
                    />
                    <div className="flex justify-between w-full text-xs">
                      <span className="font-medium text-gray-200">{lang.name}</span>
                      <span className="font-mono text-gray-400">{lang.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/10 text-xs text-gray-500 font-mono">
              Обновлено на основе репозиториев github.com/{githubProfile.username}
            </div>
          </div>
        </FadeIn>

        {/* Official GitHub Profile Card */}
        <FadeIn delay={0.3}>
          <div className="glass-panel p-8 rounded-2xl border border-white/10 h-full flex flex-col justify-between relative overflow-hidden">
            {/* Accent background blur */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#B600A8]/20 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={githubProfile.avatarUrl}
                  alt={githubProfile.name}
                  className="w-16 h-16 rounded-full ring-2 ring-[#B600A8]/50 object-cover"
                />
                <div>
                  <h4 className="text-xl font-black text-white">{githubProfile.name}</h4>
                  <a
                    href={githubProfile.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono text-[#BBCCD7] hover:underline flex items-center gap-1"
                  >
                    @{githubProfile.username}
                    <ExternalLink className="w-3 h-3 inline" />
                  </a>
                </div>
              </div>

              <p className="text-sm text-gray-300 leading-relaxed mb-6">{githubProfile.bio}</p>

              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-black/40 border border-white/5 mb-6 text-center">
                <div>
                  <div className="text-lg font-bold text-white">{githubProfile.publicRepos}</div>
                  <div className="text-[11px] text-gray-400 uppercase">Репозиториев</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{githubProfile.followers}</div>
                  <div className="text-[11px] text-gray-400 uppercase">Подписчиков</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{githubProfile.following}</div>
                  <div className="text-[11px] text-gray-400 uppercase">Подписок</div>
                </div>
              </div>
            </div>

            <a
              href={githubProfile.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-[#B600A8]/25 border border-white/10 hover:border-[#B600A8]/50 text-sm font-semibold text-white transition-all duration-200"
            >
              <Github className="w-4 h-4" />
              <span>Перейти в GitHub профиль</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
