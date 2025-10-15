import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

interface CompletionCelebrationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalTitle: string;
  xpAwarded: number;
}

export function CompletionCelebration({
  open,
  onOpenChange,
  goalTitle,
  xpAwarded,
}: CompletionCelebrationProps) {
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (open && !hasTriggered) {
      setHasTriggered(true);
      
      // Confetti animation
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#10b981", "#3b82f6", "#f59e0b"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#10b981", "#3b82f6", "#f59e0b"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [open, hasTriggered]);

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!newOpen) setHasTriggered(false);
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="text-center">
        <DialogHeader>
          <DialogTitle className="text-3xl">🎉 Parabéns! 🎉</DialogTitle>
          <DialogDescription className="text-lg pt-4">
            Você alcançou o objetivo:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-xl font-semibold">{goalTitle}</p>
          <div className="text-4xl font-bold text-primary">
            +{xpAwarded} XP
          </div>
          <p className="text-muted-foreground">
            Continue assim e alcance ainda mais objetivos!
          </p>
        </div>
        <Button onClick={() => onOpenChange(false)} size="lg">
          Continuar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
