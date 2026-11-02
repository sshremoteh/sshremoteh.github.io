import React from 'react';
import { motion } from 'framer-motion';
import { Github, ArrowRight, Terminal, Cpu, Zap, Shield, Sparkles } from 'lucide-react';
import { FadeIn } from './FadeIn';
import { githubProfile } from '../data/portfolioData';

export const Hero: React.FC = () => {
  return (
    <section
      id="hero"
      className="relative min-h-[92vh] flex flex-col items-center justify-center pt-28 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Background ambient glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-[#7621B0]/20 via-[#B600A8]/15 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center">
        {/* Top badge */}
        <FadeIn delay={0.1} y={20}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-gray-300">
              GitHub: {githubProfile.username} • Systems & Android Rust
            </span>
          </div>
        </FadeIn>

        {/* Main Title */}
        <FadeIn delay={0.2} y={30}>
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white leading-[1.05] mb-6">
            <span className="block text-gray-400 font-extrabold text-2xl sm:text-3xl md:text-4xl tracking-normal normal-case mb-2">
              Привет, я{' '}
              <span className="text-white font-black underline decoration-[#B600A8] underline-offset-8">
                {githubProfile.name}
              </span>
            </span>
            Инженер систем <br />
            <span className="hero-heading">&amp; Архитектор Rust</span>
          </h1>
        </FadeIn>

        {/* Subtitle */}
        <FadeIn delay={0.3} y={20}>
          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-gray-300 font-normal leading-relaxed mb-10">
            Разработка высокопроизводительных решений: движки на{' '}
            <strong className="text-white font-semibold">Rust &amp; Vulkan</strong>, автономные
            компиляторы APK без JVM (<strong className="text-white font-semibold">RAC</strong>), порты
            Minecraft Java под ARM64 и защищенные мосты MTProto / MCP для ИИ-агентов.
          </p>
        </FadeIn>

        {/* CTA Buttons */}
        <FadeIn delay={0.4} y={20}>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <a
              href="#projects"
              className="promt-contact-btn inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-white font-semibold uppercase tracking-wider text-sm transition-all"
            >
              <span>Смотреть проекты</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href={githubProfile.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 backdrop-blur-md transition-all duration-200"
            >
              <Github className="w-4 h-4" />
              <span>GitHub Profile</span>
            </a>
          </div>
        </FadeIn>

        {/* Feature Badges */}
        <FadeIn delay={0.5} y={20} className="w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="glass-panel p-4 rounded-2xl flex flex-col items-center text-center group hover:border-[#B600A8]/40 transition-colors">
              <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 mb-2">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm text-white">Zero JVM Toolchain</span>
              <span className="text-xs text-gray-400 mt-1">Автономный RAC компилятор</span>
            </div>

            <div className="glass-panel p-4 rounded-2xl flex flex-col items-center text-center group hover:border-[#B600A8]/40 transition-colors">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 mb-2">
                <Zap className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm text-white">Vulkan &amp; wgpu</span>
              <span className="text-xs text-gray-400 mt-1">Нативный рендер Horizon</span>
            </div>

            <div className="glass-panel p-4 rounded-2xl flex flex-col items-center text-center group hover:border-[#B600A8]/40 transition-colors">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 mb-2">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm text-white">ARM64 Architecture</span>
              <span className="text-xs text-gray-400 mt-1">Оптимизация aarch64</span>
            </div>

            <div className="glass-panel p-4 rounded-2xl flex flex-col items-center text-center group hover:border-[#B600A8]/40 transition-colors">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 mb-2">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm text-white">MCP &amp; MTProto</span>
              <span className="text-xs text-gray-400 mt-1">ИИ-агенты и Telegram API</span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
