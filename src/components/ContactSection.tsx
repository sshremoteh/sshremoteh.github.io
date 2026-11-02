import React, { useState } from 'react';
import { Mail, Send, Github, MessageSquare, Check, Copy, ExternalLink, Sparkles } from 'lucide-react';
import { FadeIn } from './FadeIn';
import { githubProfile } from '../data/portfolioData';

export const ContactSection: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const contactEmail = 'sshremoteh@users.noreply.github.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contactEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) return;
    setFormSent(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', message: '' });
    }, 1000);
  };

  return (
    <section id="contact" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Background radial glow */}
      <div className="absolute left-1/2 bottom-10 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-t from-[#B600A8]/15 via-[#7621B0]/10 to-transparent rounded-full blur-[160px] pointer-events-none" />

      {/* Section Header */}
      <div className="flex flex-col items-center text-center mb-16">
        <FadeIn delay={0.1}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#BBCCD7] uppercase tracking-wider mb-4">
            <MessageSquare className="w-3.5 h-3.5" />
            Связь и сотрудничество
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white mb-4">
            Давайте создадим <br />
            <span className="hero-heading">Что-то невероятное</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="max-w-xl text-gray-400 text-base sm:text-lg">
            Открыт для предложений по разработке системного ПО, архитектуре на Rust, реверс-инжинирингу,
            кастомным компиляторам и интеграции ИИ-агентов.
          </p>
        </FadeIn>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
        {/* Contact info channels (2 cols) */}
        <FadeIn delay={0.2} className="lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Telegram card */}
            <a
              href="https://t.me/sshremoteh"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-panel glass-panel-hover p-5 rounded-2xl flex items-center justify-between group block border border-white/10"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-mono">Telegram</div>
                  <div className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                    @sshremoteh
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
            </a>

            {/* GitHub card */}
            <a
              href={githubProfile.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-panel glass-panel-hover p-5 rounded-2xl flex items-center justify-between group block border border-white/10"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                  <Github className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-mono">GitHub Profile</div>
                  <div className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                    github.com/{githubProfile.username}
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
            </a>

            {/* Email card with copy */}
            <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-white/10">
              <div className="flex items-center gap-3.5 overflow-hidden mr-2">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs text-gray-400 font-mono">Email / GitHub noreply</div>
                  <div className="text-sm font-bold text-white truncate">{contactEmail}</div>
                </div>
              </div>
              <button
                onClick={handleCopyEmail}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors flex-shrink-0"
                title="Скопировать email"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Быстрый ответ</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Обычно отвечаю в течение нескольких часов в Telegram и на GitHub issues / pull requests.
            </p>
          </div>
        </FadeIn>

        {/* Interactive message form (3 cols) */}
        <FadeIn delay={0.3} className="lg:col-span-3">
          <div className="glass-panel p-8 rounded-2xl border border-white/10 h-full">
            <h3 className="text-xl font-bold text-white mb-2">Написать сообщение</h3>
            <p className="text-xs text-gray-400 mb-6">
              Оставьте контакты и краткое описание вашей задачи или идеи.
            </p>

            {formSent ? (
              <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center flex flex-col items-center justify-center my-8 animate-in fade-in">
                <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400 mb-3">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white mb-1">Спасибо за обращение!</h4>
                <p className="text-xs text-gray-300 max-w-sm">
                  Ваше сообщение зафиксировано. Я свяжусь с вами в ближайшее время!
                </p>
                <button
                  onClick={() => setFormSent(false)}
                  className="mt-4 text-xs font-semibold text-emerald-400 hover:underline"
                >
                  Отправить еще одно
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                      Ваше имя
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Иван"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-[#B600A8] focus:ring-1 focus:ring-[#B600A8] text-sm text-white placeholder-gray-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                      Email или Telegram
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="@telegram или mail@domain.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-[#B600A8] focus:ring-1 focus:ring-[#B600A8] text-sm text-white placeholder-gray-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Сообщение
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Привет! Хочу обсудить проект / предложение..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-[#B600A8] focus:ring-1 focus:ring-[#B600A8] text-sm text-white placeholder-gray-500 outline-none transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="promt-contact-btn w-full inline-flex items-center justify-center gap-2 rounded-full py-4 text-white font-medium uppercase tracking-widest text-xs sm:text-sm cursor-pointer shadow-lg"
                >
                  <Send className="w-4 h-4" />
                  <span>Отправить сообщение</span>
                </button>
              </form>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
