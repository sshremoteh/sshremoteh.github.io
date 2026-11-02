# 🚀 Sinorias (@sshremoteh) — Portfolio Website

Современное высокотехнологичное портфолио системного инженера **Sinorias** ([@sshremoteh](https://github.com/sshremoteh)), созданное на основе публичных репозиториев, технологий и точной дизайн-спецификации.

---

## 🛠 Технологический стек

- **React 18** + **TypeScript**
- **Tailwind CSS** (темная тема `#0C0C0C`, градиенты, адаптивная сетка)
- **framer-motion** (компонент `FadeIn`, скролл-анимации, плавные переходы)
- **Google Font Kanit** (веса 300–900)
- **Lucide Icons**
- **Vite 5** (сборщик и Dev Server)

---

## 🌟 Ключевые секции

1. **Header / Navbar**:
   - Аватар и никнейм из GitHub API
   - Быстрая навигация по секциям
   - Прямой переход в профиль GitHub

2. **Hero Секция**:
   - Представление: *Sinorias — Инженер систем & Архитектор Rust*
   - Фокусные бейджи: *Zero JVM Toolchain*, *Vulkan & wgpu*, *ARM64 Architecture*, *MCP & MTProto*
   - Кнопки действий: просмотр проектов и переход в GitHub

3. **About Me (по спецификации `promt.md`)**:
   - 4 декоративных 3D-элемента по углам с точными координатами, URL и анимациями появления
   - Заголовок `About me` с градиентной заливкой `.hero-heading`
   - Интерактивный параграф с посимвольным проявлением при скролле (`useScroll` + `useTransform`)
   - Фирменная кнопка `Contact Me` в форме капсулы с градиентом `linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)`, обводкой и тенями

4. **Проекты (GitHub Showcase)**:
   - **HorizonAndroid**: порт движка Minecraft Java Edition 26.3 на чистый Rust для ARM64 Android (Vulkan 1.1+)
   - **RAC (Rust Android Compiler)**: автономный сборщик и компилятор APK без JVM и Android SDK (23.5x быстрее)
   - **Nebula-Launcher**: нативный Android лаунчер Minecraft на Rust с сенсорным управлением
   - **horizonbrowser**: порт движка Minecraft JE на WebAssembly и WebGPU в браузере
   - **telegram-agent-api**: локальный шлюз MTProto и MCP для интеграции с ИИ-агентами
   - **localsend-cli**: расширенная версия CLI LocalSend с интерактивным TUI и deb/exe пакетами
   - **gamebot**: Telegram Dice GameBot на официальных анимированных эмодзи
   - **liftd**: загрузчик стримов и плагин для медиаплеера Lampa
   - **riff**: кросс-платформенный музыкальный плеер
   - Фильтры по категориям, отображение звезд, копирование `git clone` в один клик

5. **Инженерный Арсенал (Tech Stack)**:
   - Категоризированная матрица навыков: Systems & Languages, Low-level Systems & Compilers, Network Protocols & AI

6. **GitHub Аналитика (Stats)**:
   - Количество публичных репозиториев, распределение языков программирования (Rust 55%, Python 25%, JS/TS 15%, Shell 5%), профильная карточка

7. **Контакты (Contact)**:
   - Прямые ссылки на Telegram, GitHub, копирование email в буфер и интерактивная форма обратной связи

---

## 🏃 Запуск локально

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev

# Сборка production версии
npm run build

# Предпросмотр собранного проекта
npm run preview
```

---

## 🚢 Деплой на GitHub Pages

Репозиторий `sshremoteh.github.io` или подраздел ветки `gh-pages`:

```bash
npm run build
# Файлы из папки dist/ готовы для развертывания на любом статическом хостинге (GitHub Pages, Vercel, Cloudflare Pages).
```
