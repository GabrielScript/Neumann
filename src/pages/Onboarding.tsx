import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Target, Trophy, Medal, TrendingUp } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useAuth } from '@/contexts/AuthContext';

const slides = [
  {
    icon: Target,
    title: 'Desafios Estruturados',
    description: 'Complete desafios diários para construir hábitos poderosos e alcançar seus objetivos de vida. Um desafio por vez para foco máximo.',
  },
  {
    icon: Trophy,
    title: 'Objetivos de Vida',
    description: 'Defina suas metas mais importantes e acompanhe seu progresso em direção aos seus sonhos. Celebre cada conquista alcançada.',
  },
  {
    icon: Medal,
    title: 'Trofeus e Medalhas',
    description: 'Conquiste medalhas diárias (ouro, prata, bronze) e trofeus ao completar seus objetivos de vida. Acompanhe seu histórico de conquistas.',
  },
  {
    icon: TrendingUp,
    title: 'Sistema de XP e Níveis',
    description: 'Ganhe experiência a cada desafio completo, suba de nível e evolua constantemente. Mantenha sequências de dias consecutivos.',
  },
];

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const { completeOnboarding, isCompleting } = useOnboarding();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    completeOnboarding(undefined, {
      onSuccess: () => {
        navigate('/dashboard');
      },
    });
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const CurrentIcon = slides[currentSlide].icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-2xl p-8 md:p-12 animate-fade-in">
        <div className="space-y-8">
          {/* Icon */}
          <div className="flex justify-center animate-scale-in">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <CurrentIcon className="w-12 h-12 text-primary" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold font-display text-primary">
              {slides[currentSlide].title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              {slides[currentSlide].description}
            </p>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center gap-2">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-primary/20'
                }`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4 justify-between pt-4">
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={isCompleting}
              className="text-muted-foreground hover:text-foreground"
            >
              Pular Apresentação
            </Button>
            <Button
              onClick={handleNext}
              disabled={isCompleting}
              size="lg"
            >
              {currentSlide === slides.length - 1 ? 'Começar' : 'Próximo'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Onboarding;
