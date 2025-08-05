'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User, Pencil } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import AstroInput from '@/components/AstroInput';
import ProfileEditModal from '@/components/ProfileEditModal';
import { Session } from 'next-auth';
import { AstroUser } from '@/generated/project-client';
import { useChat } from '@/hooks/useChat';
import ChatSection from '@/components/chat/Section';
import EditableTitle from '@/components/EditableTitle';

interface AstrologyClientProps {
  session: Session;
  astroUser: AstroUser;
}

export default function AstrologyClient({ session, astroUser }: AstrologyClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const {
    handleChat,
    currentChat,
    isChatLoading,
    isStreaming,
    handleStopChat,
  } = useChat({
    userId: session?.user?.id,
    sessionId: "test",
    setQuery,
    chatContainerRef: chatContainerRef as React.RefObject<HTMLDivElement>,
    needLogin: true,
    apiPath: 'astro_agent',
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (astroUser) {
      const formatDate = (date: Date | null) => {
        if (!date) return '';
        return date.toISOString().split('T')[0];
      };

      const formatTime = (time: Date | null) => {
        if (!time) return '';
        return time.toTimeString().slice(0, 5);
      };

      const profile = {
        name: session.user?.name,
        email: session.user?.email,
        birthDate: astroUser.birthDate ? formatDate(astroUser.birthDate) : '',
        birthTime: astroUser.birthTime ? formatTime(astroUser.birthTime) : '',
        birthLocation: astroUser.birthLocation,
        todayDivination: astroUser.todayDivination,
      };

      setUserProfile(profile);
    }
  }, [session, astroUser]);

  const handleSaveProfile = async (profileData: any) => {
    try {
      const response = await fetch('/api/astro-user/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          birthDate: profileData.birthDate,
          birthTime: profileData.birthTime,
          birthLocation: profileData.birthLocation,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const result = await response.json();

      // Update local state
      const updatedProfile = {
        ...userProfile,
        birthDate: profileData.birthDate,
        birthTime: profileData.birthTime,
        birthLocation: profileData.birthLocation,
      };

      setUserProfile(updatedProfile);

    } catch (error) {
      console.error('Error saving profile:', error);
      // Could add toast notification here
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-8 py-6 border-b border-border">
        <div className="flex items-center">
          <Image
            onClick={() => router.push('/')}
            src="/logo/AstroFullLogoLightPurple.svg"
            alt="Astro Lens"
            width={120}
            height={40}
            className="h-8 w-auto cursor-pointer hover:opacity-90 transition-opacity"
          />
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-secondary/50 rounded-full px-3 py-2">
            {session.user?.image ? (
              <img
                src={session.user?.image}
                alt={session.user?.name || "User Avatar"}
                className="w-6 h-6 rounded-full border border-gray-300 dark:border-white/80"
              />
            ) : (
              <User className="w-6 h-6 text-secondary-foreground/60" />
            )}
            <span className="text-sm text-secondary-foreground">
              {session.user?.name}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Section - Chat (2/3) */}
        <div className="mx-auto flex h-full bg-background w-full flex-1">
          <ChatSection
            isToolPanel={true}
            chatHistory={[]}
            currentChat={currentChat}
            isLoading={isChatLoading || isStreaming}
            isStreaming={isStreaming}
            handleStopChat={handleStopChat}
            query={query}
            onChange={(e) => setQuery(e.target.value)}
            chatRef={chatContainerRef as React.RefObject<HTMLDivElement>}
            handleChat={handleChat}
            editableTitle={
              <EditableTitle
                title={""}
                sessionId={"test"}
                userId={session.user?.id || ""}
                onTitleUpdate={() => { }}
              />
            }
          />
        </div>
        {/* Right Section - Profile & Chart (1/3) */}
        {/* {!isMobile && (
          <div className="w-1/3 overflow-y-auto custom-scrollbar">
            <div className="p-6 space-y-6">
              <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Profile</h3>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="p-1.5 rounded-md hover:bg-secondary/50 transition-colors"
                    title="Edit Profile"
                  >
                    <Pencil className="w-4 h-4 text-secondary-foreground/60" />
                  </button>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-secondary-foreground/60">Name: </span>
                    <span className="text-foreground">{userProfile?.name}</span>
                  </div>

                  <div>
                    <span className="text-secondary-foreground/60">Birth Date: </span>
                    <span className="text-foreground">{userProfile?.birthDate}</span>
                  </div>

                  <div>
                    <span className="text-secondary-foreground/60">Birth Time: </span>
                    <span className="text-foreground">{userProfile?.birthTime || '沒資料'}</span>
                  </div>

                  <div>
                    <span className="text-secondary-foreground/60">Birth Location: </span>
                    <span className="text-foreground">{userProfile?.birthLocation}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <h4 className="text-sm font-medium text-foreground mb-2">Daily Horoscope</h4>
                  <p className="text-xs text-secondary-foreground/80">
                    {userProfile?.dailyHoroscope}
                  </p>
                </div>
              </div>

              <div className="bg-secondary/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">Birth Chart</h3>

                <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/40 rounded-lg border-2 border-primary/30 flex items-center justify-center">
                  <div className="text-center text-secondary-foreground/60">
                    <div className="text-2xl mb-2">⭐</div>
                    <div className="text-sm">Astro Chart</div>
                  </div>
                </div>
              </div>

              <div className="bg-secondary/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">Planetary Positions</h3>

                <div className="space-y-2">
                  {[
                    { planet: '☉ Sun', position: 'Capricorn 10°' },
                    { planet: '☽ Moon', position: 'Pisces 25°' },
                    { planet: '☿ Mercury', position: 'Aquarius 5°' },
                    { planet: '♀ Venus', position: 'Sagittarius 20°' },
                    { planet: '♂ Mars', position: 'Aries 15°' },
                    { planet: '♃ Jupiter', position: 'Gemini 8°' },
                    { planet: '♄ Saturn', position: 'Virgo 12°' },
                    { planet: '♅ Uranus', position: 'Scorpio 18°' },
                    { planet: '♆ Neptune', position: 'Capricorn 3°' },
                    { planet: '♇ Pluto', position: 'Libra 22°' },
                    { planet: '☊ North Node', position: 'Cancer 7°' },
                    { planet: '☋ South Node', position: 'Capricorn 7°' }
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-secondary-foreground/80">{item.planet}</span>
                      <span className="text-foreground">{item.position}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )} */}
      </div>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProfile}
        initialData={userProfile ? {
          birthDate: userProfile.birthDate,
          birthTime: userProfile.birthTime || '',
          birthLocation: userProfile.birthLocation,
          zodiacSign: userProfile.zodiacSign || ''
        } : undefined}
      />
    </div>
  );
}