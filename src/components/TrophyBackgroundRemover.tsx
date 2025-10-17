import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Download } from 'lucide-react';
import { removeBackgroundFromImage, loadImage } from '@/utils/processTrophyImages';
import { toast } from 'sonner';

import trophyMunicipal from '@/assets/trophies/trophy-municipal.png';
import trophyEstadual from '@/assets/trophies/trophy-estadual.png';
import trophyRegional from '@/assets/trophies/trophy-regional.png';
import trophyNacional from '@/assets/trophies/trophy-nacional.png';
import trophyInternacional from '@/assets/trophies/trophy-internacional.png';
import trophyLifeGoal from '@/assets/trophies/trophy-life-goal.png';

const trophies = [
  { name: 'Municipal', src: trophyMunicipal },
  { name: 'Estadual', src: trophyEstadual },
  { name: 'Regional', src: trophyRegional },
  { name: 'Nacional', src: trophyNacional },
  { name: 'Internacional', src: trophyInternacional },
  { name: 'Life Goal', src: trophyLifeGoal },
];

export function TrophyBackgroundRemover() {
  const [processing, setProcessing] = useState<string | null>(null);
  const [processedImages, setProcessedImages] = useState<Record<string, string>>({});

  const processTrophy = async (name: string, src: string) => {
    try {
      setProcessing(name);
      toast.info(`Processando troféu ${name}...`);
      
      const img = await loadImage(src);
      const blob = await removeBackgroundFromImage(img);
      const url = URL.createObjectURL(blob);
      
      setProcessedImages(prev => ({ ...prev, [name]: url }));
      toast.success(`Troféu ${name} processado!`);
    } catch (error) {
      console.error(`Error processing ${name}:`, error);
      toast.error(`Erro ao processar troféu ${name}`);
    } finally {
      setProcessing(null);
    }
  };

  const downloadImage = (name: string, url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `trophy-${name.toLowerCase().replace(' ', '-')}-no-bg.png`;
    a.click();
  };

  const processAll = async () => {
    for (const trophy of trophies) {
      await processTrophy(trophy.name, trophy.src);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Remover Fundo dos Troféus</CardTitle>
        <CardDescription>
          Processe as imagens dos troféus para remover o fundo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={processAll} disabled={processing !== null}>
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            'Processar Todos'
          )}
        </Button>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {trophies.map(trophy => (
            <div key={trophy.name} className="space-y-2">
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center p-4">
                <img 
                  src={processedImages[trophy.name] || trophy.src} 
                  alt={trophy.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-center">{trophy.name}</p>
                {processedImages[trophy.name] ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => downloadImage(trophy.name, processedImages[trophy.name])}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Baixar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => processTrophy(trophy.name, trophy.src)}
                    disabled={processing !== null}
                  >
                    {processing === trophy.name ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Processando
                      </>
                    ) : (
                      'Processar'
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
