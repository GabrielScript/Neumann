import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, Target, Trophy, Medal, TrendingUp, Users } from 'lucide-react';
import logo from '@/assets/logo.png';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero">
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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20 max-w-7xl mx-auto">
          <div className="bg-card p-8 rounded-2xl shadow-card hover:shadow-primary transition-all duration-300 animate-fade-in">
            <Target className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-2xl font-bold mb-3">Desafios Estruturados</h3>
            <p className="text-muted-foreground">
              Complete desafios diários construindo hábitos poderosos. Um desafio ativo por vez para manter o foco.
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl shadow-card hover:shadow-primary transition-all duration-300 animate-fade-in">
            <Sparkles className="w-12 h-12 text-yellow-500 mb-4" />
            <h3 className="text-2xl font-bold mb-3">Objetivos de Vida</h3>
            <p className="text-muted-foreground">
              Defina e conquiste suas metas mais importantes. Celebre cada objetivo alcançado com trofeus especiais.
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl shadow-card hover:shadow-primary transition-all duration-300 animate-fade-in">
            <Trophy className="w-12 h-12 text-yellow-500 mb-4" />
            <h3 className="text-2xl font-bold mb-3">Trofeus de Conquista</h3>
            <p className="text-muted-foreground">
              Ganhe trofeus permanentes ao completar seus objetivos de vida. Construa seu legado de conquistas.
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl shadow-card hover:shadow-primary transition-all duration-300 animate-fade-in">
            <Users className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-2xl font-bold mb-3">Comunidades e Rankings</h3>
            <p className="text-muted-foreground">
              Participe de comunidades, compartilhe desafios e evolua junto com outras pessoas. Acompanhe seu progresso no ranking global baseado em nível, XP e conquistas.
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
              <h4 className="font-semibold text-foreground mb-2">🎯 Missão</h4>
              <p>Acreditamos que com o comprometimento e consistência na conquista dos desafios, objetivos e hábitos, que o usuário do app consiga desbloquear seu máximo potencial, alta-performance e de suas capacidades.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
