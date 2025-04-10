
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

interface LoginFormProps {
  adminEmail: string;
  adminPassword: string;
}

export const LoginForm = ({ adminEmail, adminPassword }: LoginFormProps) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await signIn(email, password);
      // A navegação é feita no useEffect no componente Auth principal
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminLogin = async () => {
    setIsSubmitting(true);
    try {
      console.log("Tentando login como admin");
      await signIn(adminEmail, adminPassword);
      toast({
        title: "Login com usuário admin",
        description: "Usando credenciais de administrador padrão.",
      });
      // A navegação é feita no useEffect no componente Auth principal
    } catch (error) {
      console.error("Erro no login admin:", error);
      toast({
        title: "Usuário admin não encontrado",
        description: "O usuário admin@admin.com ainda não foi criado. Use o botão abaixo para criar.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="seu@email.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
          </div>
          <Input 
            id="password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </Button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-2 text-muted-foreground">
              Acesso rápido para desenvolvedores
            </span>
          </div>
        </div>
        
        <Button 
          type="button" 
          className="w-full" 
          variant="outline"
          onClick={handleAdminLogin}
          disabled={isSubmitting}
        >
          Login como Admin Padrão
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          (Email: {adminEmail}, Senha: {adminPassword})
        </p>
      </div>
    </form>
  );
};
