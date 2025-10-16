import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useAvatar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const getDefaultAvatar = (userId: string) => {
    // Gera número aleatório baseado no userId para consistência
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const avatarIndex = hash % 3;
    return ['User', 'UserCircle', 'UserCog'][avatarIndex];
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return null;
    
    setIsUploading(true);
    try {
      // Validar tipo de arquivo
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast({
          title: 'Erro',
          description: 'Por favor, envie uma imagem JPG, PNG ou WEBP.',
          variant: 'destructive',
        });
        return null;
      }

      // Validar tamanho (2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'Erro',
          description: 'A imagem deve ter no máximo 2MB.',
          variant: 'destructive',
        });
        return null;
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}.${fileExt}`;

      // Deletar avatar anterior se existir
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(user.id, { limit: 10 });

      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage
          .from('avatars')
          .remove(existingFiles.map(f => `${user.id}/${f.name}`));
      }

      // Upload do novo avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`${user.id}/${filePath}`, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${user.id}/${filePath}`);

      // Atualizar profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: 'Sucesso',
        description: 'Avatar atualizado com sucesso!',
      });

      return urlData.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível fazer upload do avatar.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (!user) return;

    try {
      // Deletar arquivos do storage
      const { data: files } = await supabase.storage
        .from('avatars')
        .list(user.id);

      if (files && files.length > 0) {
        await supabase.storage
          .from('avatars')
          .remove(files.map(f => `${user.id}/${f.name}`));
      }

      // Atualizar profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Avatar removido com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao remover avatar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o avatar.',
        variant: 'destructive',
      });
    }
  };

  return {
    uploadAvatar,
    removeAvatar,
    getDefaultAvatar,
    isUploading,
  };
}
