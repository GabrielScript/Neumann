import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sprout, Target, Trophy, TreeDeciduous, TrendingUp } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-hero">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-8">
          {/* Logo */}
          <div className="p-6 bg-primary/10 rounded-3xl shadow-glow animate-scale-in">
            <Sprout className="w-20 h-20 text-primary" />
          </div>

          {/* Title & Description */}
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Challenger Life
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
              Desbloqueie seu potencial máximo através de desafios estruturados,
              objetivos de vida e crescimento sustentável.
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
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-6xl mx-auto">
          <div className="bg-card p-8 rounded-2xl shadow-card hover:shadow-primary transition-all duration-300 animate-fade-in">
            <Target className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-2xl font-bold mb-3">Desafios Estruturados</h3>
            <p className="text-muted-foreground">
              Escolha entre desafios curados ou crie os seus próprios. Um desafio
              por vez para foco máximo.
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl shadow-card hover:shadow-primary transition-all duration-300 animate-fade-in">
            <Trophy className="w-12 h-12 text-accent mb-4" />
            <h3 className="text-2xl font-bold mb-3">Objetivos de Vida</h3>
            <p className="text-muted-foreground">
              Defina metas profundas e significativas. Acompanhe seu progresso em
              direção aos seus sonhos.
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl shadow-card hover:shadow-primary transition-all duration-300 animate-fade-in">
            <TreeDeciduous className="w-12 h-12 text-success mb-4" />
            <h3 className="text-2xl font-bold mb-3">Árvore da Vida</h3>
            <p className="text-muted-foreground">
              Visualize seu crescimento. Cada ação faz sua árvore evoluir de semente
              a esplêndida.
            </p>
          </div>
        </div>

        {/* Philosophy Section */}
        <div className="mt-20 max-w-4xl mx-auto bg-card/50 backdrop-blur-sm p-10 rounded-3xl shadow-card animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold">Nossa Filosofia</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-2">🌿 Equilíbrio e Ética</h4>
              <p>Crescimento sustentável, sem esgotamento. Transformação consciente.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">📈 Crescimento Consistente</h4>
              <p>Hábitos diários, disciplina contínua. Pequenos passos, grandes mudanças.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">🎯 Autoconhecimento Profundo</h4>
              <p>Cada ação alinhada com seus valores. Conheça seus porquês.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">✨ Design Minimalista</h4>
              <p>Interface limpa, foco total. Sem distrações, apenas crescimento.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
