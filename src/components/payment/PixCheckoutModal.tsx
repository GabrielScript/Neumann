import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Copy, CheckCircle2 } from "lucide-react";
import { z } from "zod";

const checkoutSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100, "Nome muito longo"),
  cellphone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Telefone inválido. Use o formato (11) 98765-4321"),
  email: z.string().email("Email inválido").max(255, "Email muito longo"),
  taxId: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido. Use o formato 123.456.789-01"),
});

interface PixCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  planName: string;
  planDescription: string;
}

interface QRCodeData {
  id: string;
  amount: number;
  status: string;
  brCode: string;
  brCodeBase64: string;
  expiresAt: string;
}

export function PixCheckoutModal({ isOpen, onClose, amount, planName, planDescription }: PixCheckoutModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<QRCodeData | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    cellphone: "",
    email: "",
    taxId: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Função para formatar CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return value;
  };

  // Função para formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      if (numbers.length <= 10) {
        return numbers
          .replace(/(\d{2})(\d)/, "($1) $2")
          .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
      }
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
    }
    return value;
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;

    if (field === "taxId") {
      formattedValue = formatCPF(value);
    } else if (field === "cellphone") {
      formattedValue = formatPhone(value);
    }

    setFormData((prev) => ({ ...prev, [field]: formattedValue }));
    
    // Limpar erro quando o usuário começar a digitar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleCreateQRCode = async () => {
    try {
      // Validar dados
      const validation = checkoutSchema.safeParse(formData);
      
      if (!validation.success) {
        const newErrors: Record<string, string> = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        
        toast({
          title: "Erro de validação",
          description: "Por favor, corrija os campos destacados",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      setErrors({});

      const { data, error } = await supabase.functions.invoke("create-pix-qrcode", {
        body: {
          amount,
          name: formData.name,
          cellphone: formData.cellphone,
          email: formData.email,
          taxId: formData.taxId,
          description: `${planName} - ${planDescription}`,
        },
      });

      if (error) {
        console.error("Error creating QR code:", error);
        toast({
          title: "Erro ao criar QR code",
          description: error.message || "Tente novamente mais tarde",
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        console.error("AbacatePay error:", data.error);
        toast({
          title: "Erro no pagamento",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      if (data?.success && data?.data) {
        setQrCodeData(data.data);
        toast({
          title: "QR Code gerado!",
          description: "Escaneie o código para realizar o pagamento",
        });
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Erro inesperado",
        description: "Algo deu errado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPixCode = () => {
    if (qrCodeData?.brCode) {
      navigator.clipboard.writeText(qrCodeData.brCode);
      setCopied(true);
      toast({
        title: "Código copiado!",
        description: "Cole no seu app de pagamento",
      });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", cellphone: "", email: "", taxId: "" });
    setQrCodeData(null);
    setErrors({});
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {qrCodeData ? "Pagamento via PIX" : "Finalizar Compra"}
          </DialogTitle>
          <DialogDescription>
            {qrCodeData
              ? "Escaneie o QR Code ou copie o código PIX"
              : `${planName} - R$ ${amount.toFixed(2)}`}
          </DialogDescription>
        </DialogHeader>

        {!qrCodeData ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                placeholder="João da Silva"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cellphone">Telefone *</Label>
              <Input
                id="cellphone"
                placeholder="(11) 98765-4321"
                value={formData.cellphone}
                onChange={(e) => handleInputChange("cellphone", e.target.value)}
                maxLength={15}
                className={errors.cellphone ? "border-red-500" : ""}
              />
              {errors.cellphone && <p className="text-sm text-red-500">{errors.cellphone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@exemplo.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">CPF *</Label>
              <Input
                id="taxId"
                placeholder="123.456.789-01"
                value={formData.taxId}
                onChange={(e) => handleInputChange("taxId", e.target.value)}
                maxLength={14}
                className={errors.taxId ? "border-red-500" : ""}
              />
              {errors.taxId && <p className="text-sm text-red-500">{errors.taxId}</p>}
            </div>

            <Button
              onClick={handleCreateQRCode}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando QR Code...
                </>
              ) : (
                "Criar QR Code"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center space-y-4">
              {/* QR Code Image */}
              <div className="border-4 border-primary rounded-lg p-2 bg-white">
                <img
                  src={qrCodeData.brCodeBase64}
                  alt="QR Code PIX"
                  className="w-64 h-64"
                />
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Status: {qrCodeData.status}</span>
              </div>

              {/* Expiration */}
              <p className="text-sm text-muted-foreground">
                Expira em: {new Date(qrCodeData.expiresAt).toLocaleString("pt-BR")}
              </p>

              {/* Copy PIX Code */}
              <div className="w-full space-y-2">
                <Label>Código PIX</Label>
                <div className="flex gap-2">
                  <Input
                    value={qrCodeData.brCode}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    onClick={handleCopyPixCode}
                    variant="outline"
                    size="icon"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-sm text-center text-muted-foreground">
                Após o pagamento, sua assinatura será ativada automaticamente
              </p>
            </div>

            <Button onClick={handleClose} variant="outline" className="w-full">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
