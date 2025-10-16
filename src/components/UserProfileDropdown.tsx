import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import { useAvatar } from '@/hooks/useAvatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Trophy,
  Target,
  Heart,
  Users,
  Settings,
  MessageSquare,
  Sun,
  Moon,
  LogOut,
  Upload,
  Trash2,
  User,
  UserCircle,
  UserCog,
} from 'lucide-react';

export function UserProfileDropdown() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { uploadAvatar, removeAvatar, getDefaultAvatar, isUploading } = useAvatar();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    const url = await uploadAvatar(selectedFile);
    if (url) {
      setIsAvatarModalOpen(false);
      setPreviewUrl(null);
      setSelectedFile(null);
      window.location.reload();
    }
  };

  const handleRemoveAvatar = async () => {
    await removeAvatar();
    setIsAvatarModalOpen(false);
    window.location.reload();
  };

  const defaultAvatarIcon = getDefaultAvatar(user?.id || '');
  const DefaultIcon = defaultAvatarIcon === 'User' ? User : defaultAvatarIcon === 'UserCircle' ? UserCircle : UserCog;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="focus:outline-none">
            <Avatar className="h-10 w-10 cursor-pointer border-2 border-primary/20 hover:border-primary/50 transition-colors">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Avatar'} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60">
                <DefaultIcon className="h-5 w-5 text-primary-foreground" />
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{profile?.full_name || 'Usuário'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setIsAvatarModalOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Alterar Avatar
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => navigate('/trophy')}>
            <Trophy className="mr-2 h-4 w-4" />
            Ver Troféus Conquistados
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => navigate('/achievements')}>
            <Target className="mr-2 h-4 w-4" />
            Ver Desafios Conquistados
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => navigate('/goals')}>
            <Heart className="mr-2 h-4 w-4" />
            Ver Objetivos de Vida
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => navigate('/community')}>
            <Users className="mr-2 h-4 w-4" />
            Ver Suas Comunidades
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => navigate('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => navigate('/feedback')}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Feedback
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            Tema: {theme === 'dark' ? 'Claro' : 'Escuro'}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Avatar</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-32 w-32 border-4 border-primary/20">
                <AvatarImage src={previewUrl || profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60">
                  <DefaultIcon className="h-16 w-16 text-primary-foreground" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="avatar-upload">Escolher Imagem</Label>
                <input
                  ref={fileInputRef}
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Selecionar Arquivo
                </Button>
                
                {selectedFile && (
                  <Button onClick={handleUpload} disabled={isUploading}>
                    {isUploading ? 'Enviando...' : 'Salvar Avatar'}
                  </Button>
                )}
                
                {profile?.avatar_url && (
                  <Button
                    variant="destructive"
                    onClick={handleRemoveAvatar}
                    disabled={isUploading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover Avatar
                  </Button>
                )}
                
                <p className="text-xs text-muted-foreground text-center">
                  Formatos aceitos: JPG, PNG, WEBP (máx. 2MB)
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
