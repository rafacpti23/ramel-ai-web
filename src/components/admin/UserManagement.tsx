
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserCheck, X, CheckCheck, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserProfile } from "@/context/AuthTypes";

interface ExtendedUserProfile extends UserProfile {
  created_at: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<ExtendedUserProfile[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ExtendedUserProfile | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserPaymentStatus, setEditUserPaymentStatus] = useState("pendente");
  const [editUserWhatsapp, setEditUserWhatsapp] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    fetchUsers();
    countTotalUsers();
  }, []);

  const countTotalUsers = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
        
      if (error) throw error;
      
      setTotalUsers(count || 0);
    } catch (error) {
      console.error('Erro ao contar usuários:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      console.log(`Carregados ${data.length} usuários do banco de dados`);
      setUsers(data as ExtendedUserProfile[]);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const approvePayment = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ payment_status: 'aprovado' })
        .eq('id', userId);
        
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, payment_status: 'aprovado' } : user
      ));
      
      toast({
        title: "Pagamento aprovado",
        description: "O acesso do usuário foi liberado com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao aprovar pagamento:', error);
      toast({
        title: "Erro ao aprovar pagamento",
        description: error.message || "Não foi possível aprovar o pagamento.",
        variant: "destructive",
      });
    }
  };
  
  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);
        
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_admin: !currentStatus } : user
      ));
      
      toast({
        title: currentStatus ? "Permissão de admin removida" : "Permissão de admin concedida",
        description: `O usuário agora ${!currentStatus ? 'é' : 'não é mais'} um administrador.`,
      });
    } catch (error: any) {
      console.error('Erro ao alterar status de admin:', error);
      toast({
        title: "Erro ao alterar permissões",
        description: error.message || "Não foi possível alterar as permissões do usuário.",
        variant: "destructive",
      });
    }
  };
  
  const openEditUserDialog = (userProfile: ExtendedUserProfile) => {
    setEditingUser(userProfile);
    setEditUserName(userProfile.full_name || "");
    setEditUserEmail(userProfile.email || "");
    setEditUserPaymentStatus(userProfile.payment_status);
    setEditUserWhatsapp(userProfile.whatsapp || "");
    setIsEditDialogOpen(true);
  };
  
  const handleSaveUserEdit = async () => {
    if (!editingUser) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: editUserName,
          email: editUserEmail,
          payment_status: editUserPaymentStatus,
          whatsapp: editUserWhatsapp || null
        })
        .eq('id', editingUser.id);
        
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { 
              ...user, 
              full_name: editUserName,
              email: editUserEmail,
              payment_status: editUserPaymentStatus,
              whatsapp: editUserWhatsapp || null
            } 
          : user
      ));
      
      toast({
        title: "Usuário atualizado",
        description: "Os dados do usuário foram atualizados com sucesso.",
      });
      
      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message || "Não foi possível atualizar os dados do usuário.",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = searchTerm 
    ? users.filter(user => 
        (user.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;

  return (
    <>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Gerenciar Usuários</CardTitle>
          <CardDescription>
            Aprovar pagamentos e gerenciar permissões ({users.length} de {totalUsers} usuários carregados)
          </CardDescription>
          <div className="mt-4 flex gap-4">
            <div className="flex-1">
              <Input 
                placeholder="Buscar por nome ou email" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              onClick={fetchUsers}
              disabled={loading}
            >
              Atualizar Lista
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4">Nome</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Data de Cadastro</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Admin</th>
                  <th className="text-right py-3 px-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4">{user.full_name || "Sem nome"}</td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.payment_status === 'aprovado' 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {user.payment_status === 'aprovado' ? 'Aprovado' : 'Pendente'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {user.is_admin ? 'Sim' : 'Não'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openEditUserDialog(user)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          
                          {user.payment_status !== 'aprovado' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => approvePayment(user.id)}
                            >
                              <CheckCheck className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                          )}
                          
                          <Button 
                            size="sm" 
                            variant={user.is_admin ? "destructive" : "outline"}
                            onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                          >
                            {user.is_admin ? (
                              <>
                                <X className="h-4 w-4 mr-1" />
                                Remover Admin
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-1" />
                                Tornar Admin
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      {loading ? "Carregando usuários..." : "Nenhum usuário encontrado"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Nome
              </Label>
              <Input
                id="edit-name"
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-email"
                value={editUserEmail}
                onChange={(e) => setEditUserEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-whatsapp" className="text-right">
                WhatsApp
              </Label>
              <Input
                id="edit-whatsapp"
                value={editUserWhatsapp || ""}
                onChange={(e) => setEditUserWhatsapp(e.target.value)}
                placeholder="Ex: 11999887766"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">
                Status
              </Label>
              <select
                id="edit-status"
                value={editUserPaymentStatus}
                onChange={(e) => setEditUserPaymentStatus(e.target.value)}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="pendente">Pendente</option>
                <option value="aprovado">Aprovado</option>
              </select>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="submit" onClick={handleSaveUserEdit}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserManagement;
