import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Target, Trophy, Medal, TrendingUp, Users, Languages } from 'lucide-react';
import logo from '@/assets/logo.png';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useTranslation } from '@/translations';
import { useLanguage } from '@/hooks/useLanguage';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { onboardingStatus, isLoading: isLoadingOnboarding } = useOnboarding();
  const { t } = useTranslation();
  const { toggleLanguage, language } = useLanguage();

  useEffect(() => {
    // Se o usuário está autenticado, verificar o status do onboarding
    if (user && !authLoading && !isLoadingOnboarding) {
      if (!onboardingStatus || !onboardingStatus.completed) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, authLoading, onboardingStatus, isLoadingOnboarding, navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Language Selector */}
      <div className="absolute top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className="gap-2"
        >
          <Languages className="w-4 h-4" />
          {language === 'pt' ? 'EN' : 'PT'}
        </Button>
      </div>

      {/* Developer Credit */}
      <div className="absolute top-4 right-4 text-right text-sm text-muted-foreground">
        <p className="font-medium">{t('landing.developedBy')}</p>
        <a 
          href="https://www.linkedin.com/in/gabrielestrela8/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {t('landing.contact')}
        </a>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-8">
          {/* Logo */}
          <div className="p-6 bg-primary/10 rounded-3xl shadow-glow animate-scale-in">
            <img src={logo} alt="Neumann Logo" className="w-20 h-20" />
          </div>

          {/* Title & Description */}
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold font-display text-foreground">
              {t('landing.title')}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
              {t('landing.subtitle')}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-slide-up">
            <Button
              size="lg"
              className="text-lg px-8 shadow-primary"
              onClick={() => navigate('/auth')}
            >
              {t('landing.cta')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8"
              onClick={() => navigate('/auth')}
            >
              {t('landing.login')}
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20 max-w-7xl mx-auto">
          <div className="bg-card p-8 rounded-2xl shadow-card hover:shadow-primary transition-all duration-300 animate-fade-in">
            <Target className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-2xl font-bold mb-3">{t('landing.features.challenges.title')}</h3>
            <p className="text-muted-foreground">
              {t('landing.features.challenges.description')}
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl shadow-card hover:shadow-primary transition-all duration-300 animate-fade-in">
            <Sparkles className="w-12 h-12 text-yellow-500 mb-4" />
            <h3 className="text-2xl font-bold mb-3">{t('landing.features.goals.title')}</h3>
            <p className="text-muted-foreground">
              {t('landing.features.goals.description')}
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl shadow-card hover:shadow-primary transition-all duration-300 animate-fade-in">
            <Trophy className="w-12 h-12 text-yellow-500 mb-4" />
            <h3 className="text-2xl font-bold mb-3">{t('landing.features.trophies.title')}</h3>
            <p className="text-muted-foreground">
              {t('landing.features.trophies.description')}
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl shadow-card hover:shadow-primary transition-all duration-300 animate-fade-in">
            <Users className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-2xl font-bold mb-3">{t('landing.features.community.title')}</h3>
            <p className="text-muted-foreground">
              {t('landing.features.community.description')}
            </p>
          </div>
        </div>

        {/* Philosophy Section */}
        <div className="mt-20 max-w-4xl mx-auto bg-card/50 backdrop-blur-sm p-10 rounded-3xl shadow-card animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold">{t('landing.philosophy.title')}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-2">{t('landing.philosophy.focus.title')}</h4>
              <p>{t('landing.philosophy.focus.description')}</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">{t('landing.philosophy.progress.title')}</h4>
              <p>{t('landing.philosophy.progress.description')}</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">{t('landing.philosophy.achievements.title')}</h4>
              <p>{t('landing.philosophy.achievements.description')}</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">{t('landing.philosophy.mission.title')}</h4>
              <p>{t('landing.philosophy.mission.description')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
