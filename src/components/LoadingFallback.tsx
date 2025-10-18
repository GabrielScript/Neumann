export const LoadingFallback = () => (
  <div 
    className="min-h-screen flex items-center justify-center bg-gradient-hero" 
    role="status" 
    aria-live="polite"
  >
    <div className="flex flex-col items-center gap-3">
      <div 
        className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" 
        aria-hidden="true" 
      />
      <p className="text-primary font-display">Carregando...</p>
    </div>
  </div>
);
