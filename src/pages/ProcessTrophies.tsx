import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { removeBackground, loadImageFromUrl } from '@/utils/removeBackground';
import { toast } from 'sonner';
import trophyMunicipal from '@/assets/trophies/trophy-municipal.png';
import trophyEstadual from '@/assets/trophies/trophy-estadual.png';
import trophyRegional from '@/assets/trophies/trophy-regional.png';
import trophyNacional from '@/assets/trophies/trophy-nacional.png';
import trophyInternacional from '@/assets/trophies/trophy-internacional.png';

const trophies = [
  { name: 'Municipal', src: trophyMunicipal },
  { name: 'Estadual', src: trophyEstadual },
  { name: 'Regional', src: trophyRegional },
  { name: 'Nacional', src: trophyNacional },
  { name: 'Internacional', src: trophyInternacional },
];

export default function ProcessTrophies() {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedImages, setProcessedImages] = useState<{ name: string; url: string }[]>([]);

  const processAllTrophies = async () => {
    setProcessing(true);
    setProgress(0);
    setProcessedImages([]);
    
    const processed: { name: string; url: string }[] = [];
    
    for (let i = 0; i < trophies.length; i++) {
      const trophy = trophies[i];
      
      try {
        toast.info(`Processando troféu ${trophy.name}...`);
        
        // Load the image
        const img = await loadImageFromUrl(trophy.src);
        
        // Remove background
        const blob = await removeBackground(img);
        
        // Create URL for the processed image
        const url = URL.createObjectURL(blob);
        processed.push({ name: trophy.name, url });
        
        setProcessedImages([...processed]);
        setProgress(((i + 1) / trophies.length) * 100);
        
        toast.success(`Troféu ${trophy.name} processado!`);
      } catch (error) {
        console.error(`Error processing ${trophy.name}:`, error);
        toast.error(`Erro ao processar troféu ${trophy.name}`);
      }
    }
    
    setProcessing(false);
    toast.success('Todos os troféus foram processados!');
  };

  const downloadImage = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `trophy-${name.toLowerCase()}-no-bg.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Processador de Troféus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Clique no botão abaixo para remover o fundo de todas as imagens dos troféus.
            </p>
            
            <Button 
              onClick={processAllTrophies} 
              disabled={processing}
              className="w-full"
            >
              {processing ? 'Processando...' : 'Processar Todos os Troféus'}
            </Button>
            
            {processing && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-muted-foreground">
                  {Math.round(progress)}% completo
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {processedImages.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedImages.map((image) => (
              <Card key={image.name}>
                <CardHeader>
                  <CardTitle className="text-lg">Troféu {image.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-checkerboard rounded-lg p-4 flex items-center justify-center min-h-[200px]">
                    <img 
                      src={image.url} 
                      alt={`Troféu ${image.name}`}
                      className="max-w-full max-h-[180px] object-contain"
                    />
                  </div>
                  <Button 
                    onClick={() => downloadImage(image.url, image.name)}
                    className="w-full"
                    variant="outline"
                  >
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
