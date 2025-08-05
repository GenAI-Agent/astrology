'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import AstroInput from '@/components/AstroInput';
import Image from 'next/image';

// Import background images
import backgroundImage from '@/assets/banner_blue_night_sky_glowing.png';

export default function ChatPage() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  // Check if mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handlePrompting = useCallback(
    (promptText = query) => {
      setIsLoading(true);
      if (!session?.user) {
        toast.error("Please login first");
        setIsLoading(false);
        router.push(`/login?callbackUrl=/chat`);
        return;
      }
      try {
        const sessionId = uuidv4();

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

        router.push(`/chat/p/${sessionId}`);
      } catch (error) {
        console.error(error);
        setIsLoading(false);
      }
    },
    [query, router, session?.user],
  );


  return (
    <div className="mx-auto flex relative h-screen overflow-hidden flex-col items-center justify-center p-2 sm:p-4 flex-1">
      <Image
        className={cn(
          "rounded-2xl opacity-40 absolute left-1/2 -translate-x-1/2 object-cover z-1",
          isMobile
            ? "top-16 w-[98%] h-[calc(100vh-32px)]"
            : "top-20 lg:top-8 w-[95%] h-[calc(100vh-64px)]"
        )}
        src={backgroundImage}
        alt="Background"
        width={1980}
        height={1980}
      />
      <div className={cn(
        "w-full z-10 relative",
        isMobile ? "max-w-sm px-2" : "max-w-xl"
      )}>
        <div className="flex w-full items-center justify-center gap-4 text-center mb-4 sm:mb-6">
          <h1 className={cn(
            "font-semibold text-white",
            isMobile ? "text-2xl" : "text-3xl sm:text-4xl"
          )}>
            AI Astrology
          </h1>
        </div>
        <AstroInput
          value={query}
          onChange={setQuery}
          onSubmit={handlePrompting}
          placeholder="Ask about your astrology reading..."
          isLoading={isLoading}
          isMobile={isMobile}
          className={isMobile ? "mt-2" : "lg:mt-4"}
        />
      </div>
    </div>
  );
}