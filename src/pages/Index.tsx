import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Target, Trophy, Medal, TrendingUp, Users } from 'lucide-react';
import logo from '@/assets/logo.png';
import { OptimizedImage } from '@/components/OptimizedImage';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/hooks/useOnboarding';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { onboardingStatus, isLoading: isLoadingOnboarding } = useOnboarding();

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
    <main className="min-h-screen bg-gradient-hero" role="main">
      {/* Developer Credit */}
      <aside 
        className="absolute top-4 right-4 text-right text-sm text-muted-foreground" 
        aria-label="Créditos do desenvolvedor"
      >
        <p className="font-medium">Developed by Gabriel Estrela Lopes</p>
        <a 
          href="https://www.linkedin.com/in/gabrielestrela8/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline focus-ring"
        >
          Contact
        </a>
      </aside>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16" aria-labelledby="hero-title">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-8">
          {/* Logo */}
          <div className="p-6 bg-primary/10 rounded-3xl shadow-glow animate-scale-in">
            <OptimizedImage 
              src={logo} 
              alt="Neumann Logo" 
              className="w-20 h-20"
              width={80}
              height={80}
              priority={true}
              fetchPriority="high"
            />
          </div>

          {/* Title & Description */}
          <div className="space-y-4 animate-fade-in">
          <h1 id="hero-title" className="text-5xl md:text-6xl font-bold font-display text-foreground">
            Neumann
          </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
              Transforme sua vida através de desafios estruturados, objetivos claros e crescimento consistente.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-slide-up">
            <Button
              size="lg"
              className="text-lg px-8 shadow-primary"
              onClick={() => navigate('/auth')}
            >
              Começar Agora
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8"
              onClick={() => navigate('/auth')}
            >
              Fazer Login
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <section 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20 max-w-7xl mx-auto" 
          aria-labelledby="features-title"
        >
          <h2 id="features-title" className="sr-only">Funcionalidades principais</h2>
          
          <article className="bg-card p-8 rounded-2xl shadow-card hover:shadow-primary transition-all duration-300 animate-fade-in">
            <Target className="w-12 h-12 text-primary mb-4" aria-hidden="true" />
            <h3 className="text-2xl font-bold mb-3">Desafios Estruturados</h3>
            <p className="text-muted-foreground">
              Complete desafios diários construindo hábitos poderosos. Um desafio ativo por vez para manter o foco.
            </p>
          </article>

          <article className="bg-card p-8 rounded-2xl shadow-card hover:shadow-primary transition-all duration-300 animate-fade-in">
            <Sparkles className="w-12 h-12 text-yellow-500 mb-4" aria-hidden="true" />
            <h3 className="text-2xl font-bold mb-3">Objetivos de Vida</h3>
            <p className="text-muted-foreground">
              Defina e conquiste suas metas mais importantes. Celebre cada objetivo alcançado com troféus especiais.
            </p>
          </article>

          <article className="bg-card p-8 rounded-2xl shadow-card hover:shadow-primary transition-all duration-300 animate-fade-in">
            <Trophy className="w-12 h-12 text-yellow-500 mb-4" aria-hidden="true" />
            <h3 className="text-2xl font-bold mb-3">Troféus de Conquista</h3>
            <p className="text-muted-foreground">
              Ganhe troféus permanentes ao completar seus objetivos de vida. Construa seu legado de conquistas.
            </p>
          </article>

          <article className="bg-card p-8 rounded-2xl shadow-card hover:shadow-primary transition-all duration-300 animate-fade-in">
            <Users className="w-12 h-12 text-primary mb-4" aria-hidden="true" />
            <h3 className="text-2xl font-bold mb-3">Comunidades e Rankings</h3>
            <p className="text-muted-foreground">
              Participe de comunidades, compartilhe desafios e evolua junto com outras pessoas. Acompanhe seu progresso no ranking global baseado em nível, XP e conquistas.
            </p>
          </article>
        </section>

        {/* Philosophy Section */}
        <div className="mt-20 max-w-4xl mx-auto bg-card/50 backdrop-blur-sm p-10 rounded-3xl shadow-card animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold">Nossa Filosofia</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-2">🎯 Foco e Disciplina</h4>
              <p>Um desafio por vez. Concentre sua energia no que realmente importa.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">📈 Progresso Visível e Gamificada</h4>
              <p>Acompanhe cada vitória. Conquista de troféus e níveis que mostram sua evolução.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">🏆 Conquistas Reais</h4>
              <p>Transforme objetivos em realizações. Cada meta concluída é um troféu permanente.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">🚀 Missão</h4>
              <p>Acreditamos que, por meio do comprometimento e da consistência na superação de desafios, no alcance de objetivos e na formação de bons hábitos, o usuário possa desbloquear todo o seu potencial e atingir alta performance em suas capacidades e habilidades.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
