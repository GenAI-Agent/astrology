'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Import banner images
import bannerBlueNightSky from '@/assets/banner_blue_night_sky_glowing.png';
import bannerStarSigns from '@/assets/banner_double_exposure_star_signs_glowing.png';
import bannerHyperRealistic from '@/assets/banner_hyper_realistic_night_sky.png';
import bannerMountain from '@/assets/banner_mountain.png';
import bannerPink from '@/assets/banner_pink.png';

// Dynamically import Galaxy to avoid SSR issues
const Galaxy = dynamic(() => import('@/components/Galaxy'), { ssr: false });
// Dynamically import AstroChart to avoid SSR issues
const AstroChart = dynamic(() => import('@/components/AstroChart'), { ssr: false });


function HomeContent() {
  const [mounted, setMounted] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 檢查URL參數中是否有錯誤信息
  useEffect(() => {
    const error = searchParams.get("error");
    const sessionId = searchParams.get("sessionId");
    const reload = searchParams.get("reload");

    // 如果URL中有reload=true参数，执行页面刷新並清除該參數
    if (reload === "true") {
      const url = new URL(window.location.href);
      url.searchParams.delete("reload");
      window.history.replaceState({}, "", url.toString());
      window.location.reload();
      return;
    }

    if (error === "chat_history_not_found" && sessionId) {
      toast.error(`載入聊天記錄失敗 ${sessionId}`);

      // 清除URL參數，防止刷新頁面時再次顯示錯誤
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      url.searchParams.delete("sessionId");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  // Example questions that users can click
  const exampleQuestions = [
    "What does my birth chart reveal about my personality?",
    "How will the upcoming Mercury retrograde affect me?",
    "What are my love compatibility signs?",
    "What career path aligns with my astrological profile?",
    "How can I harness today's planetary energy?",
    "What does my rising sign say about me?"
  ];

  const handlePrompting = useCallback(
    (promptText = inputValue) => {
      setIsLoading(true);
      if (!session?.user) {
        toast.error("請先登入");
        setIsLoading(false);
        router.push(`/login?callbackUrl=/`);
        return;
      }
      try {
        // 生成 sessionId
        const sessionId = uuidv4();

        // 僅在 sessionStorage 中存儲 prompt 和初始聊天信息
        if (typeof window !== "undefined") {
          const initialMessage = { role: "human", content: promptText };
          sessionStorage.setItem(`prompt_${sessionId}`, promptText);
          sessionStorage.setItem(
            `initial_chat_${sessionId}`,
            JSON.stringify({
              userId: session.user.id,
              sessionId,
              messages: [initialMessage],
              title:
                promptText.substring(0, 30) +
                (promptText.length > 30 ? "..." : ""),
              createdAt: new Date(),
            }),
          );
        }

        // 立即跳轉，不等待 API 請求
        router.push(`/astrology/`);
      } catch (error) {
        console.error(error);
        setIsLoading(false);
      }
    },
    [inputValue, router, session?.user],
  );

  const handleQuestionClick = (question: string) => {
    handlePrompting(question);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      handlePrompting(inputValue.trim());
    }
  };

  return (
    <div className="min-h-screen bg-black text-foreground relative overflow-hidden">
      {/* Galaxy background */}
      <div className="absolute inset-0">
        {mounted && (
          <Galaxy
            mouseInteraction={true}
            speed={0.6}
            density={2}
            glowIntensity={0.2}
            rotationSpeed={0.05}
          />
        )}
      </div>

      <Header />

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-8">
        <h1 className="text-5xl md:text-7xl font-serif text-center mb-4 leading-tight">
          Unveiling the <span className="text-primary italic">Universe</span>
          <br />
          Within You
        </h1>

        <p className="text-xl text-muted-foreground mb-12 text-center">
          Astro Lens helps you explore your cosmic path through personalized astrological insights
        </p>

        {/* Astrological Chart */}
        <div className="relative mb-12 flex items-center justify-center">
          {mounted && (
            <AstroChart
              data={{
                planets: {
                  Sun: [164],
                  Moon: [130],
                  Mercury: [162],
                  Venus: [139],
                  Mars: [242],
                  Jupiter: [34],
                  Saturn: [47],
                  Uranus: [313],
                  Neptune: [301],
                  Pluto: [247],
                  NorthNode: [132],
                },
                cusps: [296, 350, 30, 56, 75, 94, 116, 170, 210, 236, 255, 274]
              }}
              id="astro-chart-home"
              width={450}
              height={450}
              showAspects={true}
              className="w-full max-w-lg"
            />
          )}
        </div>

      </main>
      {/* Banner Section 2 - Night Sky */}
      <section className="relative z-10 h-80 md:h-96 overflow-hidden">
        <div className="relative w-full h-full">
          <Image
            src={bannerBlueNightSky}
            alt="Blue Night Sky Banner"
            fill
            className="object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <h2 className="text-3xl md:text-4xl font-serif mb-4">
                {`Navigate Life's Journey with`} <span className="text-blue-300 italic">Stellar Guidance</span>
              </h2>
              <p className="text-lg opacity-90 max-w-2xl">
                Let the ancient wisdom of the cosmos illuminate your path forward
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Second Section - Ask Your Question */}
      <section className="relative z-10 py-20 px-8 bg-gradient-to-b from-transparent to-black/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-serif mb-6">
            Ask Your <span className="text-primary italic">Cosmic</span> Question
          </h2>
          <p className="text-lg text-muted-foreground mb-12">
            Get personalized astrological insights by asking any question about your life, love, career, or future
          </p>

          {/* Input Form */}
          <form onSubmit={handleInputSubmit} className="mb-12">
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="What would you like to know about your cosmic journey?"
                className="flex-1 px-6 py-4 bg-card/80 backdrop-blur-sm border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-4 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Ask Now'}
              </button>
            </div>
          </form>

          {/* Example Questions */}
          <div className="space-y-4">
            <h3 className="text-xl font-medium text-muted-foreground mb-6">Or try one of these popular questions:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exampleQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionClick(question)}
                  className="p-4 bg-card/60 backdrop-blur-sm border border-border rounded-xl hover:bg-card/80 hover:border-primary/50 transition-all duration-300 text-left group"
                >
                  <p className="text-sm text-foreground group-hover:text-primary transition-colors">
                    {question}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* Banner Section with Why Choose - Star Signs */}
      <section className="relative z-10 h-80 md:h-96 overflow-hidden">
        <div className="relative w-full h-full">
          <Image
            src={bannerStarSigns}
            alt="Star Signs Double Exposure Banner"
            fill
            className="object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-4xl md:text-5xl font-serif mb-6">
                Why Choose <span className="text-yellow-300 italic">Astro Lens</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Experience the most comprehensive astrological guidance platform
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-8">
        <div className="max-w-6xl mx-auto">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 - Personalized Readings with Hyper Realistic Night Sky */}
            <div className="relative text-center p-8 rounded-2xl border border-border overflow-hidden">
              <div className="absolute inset-0">
                <Image
                  src={bannerHyperRealistic}
                  alt="Hyper Realistic Night Sky"
                  fill
                  className="object-cover blur-sm"
                />
              </div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white">Personalized Readings</h3>
                <p className="text-gray-200">
                  Get insights tailored specifically to your birth chart and cosmic profile
                </p>
              </div>
            </div>

            {/* Card 2 - Real-time Insights with Mountain */}
            <div className="relative text-center p-8 rounded-2xl border border-border overflow-hidden">
              <div className="absolute inset-0">
                <Image
                  src={bannerMountain}
                  alt="Mountain Night Sky"
                  fill
                  className="object-cover blur-sm"
                />
              </div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white">Real-time Insights</h3>
                <p className="text-gray-200">
                  Stay updated with current planetary transits and their effects on your life
                </p>
              </div>
            </div>

            {/* Card 3 - AI-Powered Analysis with Pink */}
            <div className="relative text-center p-8 rounded-2xl border border-border overflow-hidden">
              <div className="absolute inset-0">
                <Image
                  src={bannerPink}
                  alt="Pink Cosmic"
                  fill
                  className="object-cover blur-sm"
                />
              </div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white">AI-Powered Analysis</h3>
                <p className="text-gray-200">
                  Advanced algorithms combined with traditional astrology for accurate predictions
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <HomeContent />
    </Suspense>
  );
}