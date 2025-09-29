import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GameCard from "@/components/GameCard";
import DateBanner from "@/components/DateBanner";
import { ResultsBanner } from "@/components/ResultsBanner";
import TopResultsHeader from "@/components/TopResultsHeader";
import { useGames } from "@/hooks/useGames";
import { ConfigurableSection, useSectionContent } from "@/components/ConfigurableSection";
import { useWebsiteConfigContext } from "@/contexts/WebsiteConfigProvider";
import heroImage from "@/assets/hero-bg.jpg";
const Index = () => {
  const { games, loading } = useGames();
  const { config } = useWebsiteConfigContext();
  const { content: footerContent } = useSectionContent('footer', '/');
  const navigate = useNavigate();
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading games...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      {/* Top Results Header */}
      <TopResultsHeader />

      {/* Results Summary Banner */}
      <ResultsBanner games={games} />

      {/* Games Grid */}
      <section className="py-8 md:py-16 bg-background">
        <div className="container mx-auto px-2 sm:px-4">
          
          <div className="text-center mb-6 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2 md:mb-4 leading-tight">
              * SATTA KING *<br className="sm:hidden" />
              <span className="sm:hidden"> </span>*LIVE RESULTS *
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              🎯 Tap any game card to view complete history and export data
            </p>
          </div>

          <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 max-w-6xl mx-auto">
            {games.map(game => (
              <GameCard
                key={game.id}
                id={game.id}
                name={game.name}
                shortCode={game.short_code}
                scheduledTime={game.scheduled_time}
                todayResult={game.today_result ?? undefined}
                yesterdayResult={game.yesterday_result ?? undefined}
                status={game.status}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Middle Date Banner */}
      <DateBanner />

      {/* User Login Button */}
      <section className="py-8 bg-card/50 border-t border-neon-cyan/20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <Button onClick={() => navigate('/admin')} variant="outline" size="sm" className="border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10">
              🔐 User Login
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <ConfigurableSection sectionType="footer" pagePath="/">
        <footer className="bg-background/80 border-t border-neon-cyan/20 py-8">
          <div className="container mx-auto px-4">
            <div className="text-center text-sm text-muted-foreground">
              {footerContent.text || "© 2025 Lottery Results System. All rights reserved. • Results for informational purposes only."}
            </div>
          </div>
        </footer>
      </ConfigurableSection>
      
      {/* Bottom Date Banner */}
      <ConfigurableSection sectionType="banner" sectionName="Bottom Date Banner" pagePath="/">
        <DateBanner />
      </ConfigurableSection>
    </div>;
};
export default Index;