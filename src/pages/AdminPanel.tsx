import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Users, 
  ArrowLeft,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface VaultUser {
  id: string;
  user_email: string;
  created_at: string;
  updated_at: string;
}

const AdminPanel = () => {
  const [adminPassword, setAdminPassword] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<VaultUser[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, string>>({});
  const [loadingPassword, setLoadingPassword] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleVerifyAdmin = async () => {
    if (!adminPassword.trim()) {
      toast({
        title: "Error",
        description: "Ingresa la contraseña de administrador",
        variant: "destructive",
      });
      return;
    }

    setVerifying(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin-access', {
        body: { password: adminPassword }
      });

      if (error) throw error;

      if (data?.success) {
        setIsVerified(true);
        toast({
          title: "Acceso Concedido",
          description: "Bienvenido al panel de administración.",
        });
        // Cargar usuarios inmediatamente
        await loadUsers();
      } else {
        toast({
          title: "Acceso Denegado",
          description: "Contraseña de administrador incorrecta.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying admin:', error);
      toast({
        title: "Error",
        description: "No se pudo verificar el acceso.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-password-vault', {
        body: { action: 'list' },
        headers: { 'x-admin-password': adminPassword }
      });

      if (error) throw error;

      if (data?.success) {
        setUsers(data.users || []);
      } else {
        throw new Error(data?.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewPassword = async (email: string) => {
    // Si ya está visible, ocultarla
    if (visiblePasswords[email]) {
      setVisiblePasswords(prev => {
        const updated = { ...prev };
        delete updated[email];
        return updated;
      });
      return;
    }

    setLoadingPassword(email);
    try {
      const { data, error } = await supabase.functions.invoke('admin-password-vault', {
        body: { action: 'get', email },
        headers: { 'x-admin-password': adminPassword }
      });

      if (error) throw error;

      if (data?.success) {
        setVisiblePasswords(prev => ({
          ...prev,
          [email]: data.password
        }));
      } else {
        toast({
          title: "Error",
          description: data?.error || "No se pudo obtener la contraseña.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error getting password:', error);
      toast({
        title: "Error",
        description: "No se pudo obtener la contraseña.",
        variant: "destructive",
      });
    } finally {
      setLoadingPassword(null);
    }
  };

  const handleCopyPassword = async (email: string, password: string) => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedEmail(email);
      toast({
        title: "Copiado",
        description: "Contraseña copiada al portapapeles.",
      });
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar la contraseña.",
        variant: "destructive",
      });
    }
  };

  // Pantalla de verificación de admin
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sierra-teal/10 via-white to-stone-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img 
              src="/logo-sierras.png"
              alt="Grupo Sierras Logo"
              className="h-16 w-auto mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-sierra-teal mb-2">
              Panel de Administración
            </h1>
            <p className="text-sierra-gray">
              Ingresa la contraseña de admin para acceder
            </p>
          </div>

          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl text-center text-sierra-teal">
                <div className="flex items-center justify-center gap-2">
                  <Shield className="h-6 w-6" />
                  Verificación Requerida
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-sierra-gray" />
                <Input
                  type="password"
                  placeholder="Contraseña de administrador"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="pl-10 h-12 border-sierra-teal/20 focus:border-sierra-teal"
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyAdmin()}
                  disabled={verifying}
                />
              </div>

              <Button
                onClick={handleVerifyAdmin}
                disabled={verifying}
                className="w-full h-12 sierra-gradient hover:opacity-90 font-semibold"
              >
                {verifying ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando...
                  </div>
                ) : (
                  'Acceder al Panel'
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="w-full text-sierra-gray hover:text-sierra-teal"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Inicio
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Panel de administración
  return (
    <div className="min-h-screen bg-gradient-to-br from-sierra-teal/10 via-white to-stone-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img 
              src="/logo-sierras.png"
              alt="Grupo Sierras Logo"
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-2xl font-bold text-sierra-teal flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Panel de Administración
              </h1>
              <p className="text-sierra-gray text-sm">
                Gestión de contraseñas de usuarios
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="border-sierra-teal/20 hover:border-sierra-teal"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        {/* Contenido */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-sierra-teal flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuarios Registrados ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-sierra-teal" />
                <span className="ml-3 text-sierra-gray">Cargando usuarios...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-sierra-gray">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No hay usuarios registrados en el vault</p>
                <p className="text-sm mt-2">Las contraseñas se guardarán cuando crees nuevos usuarios desde el formulario de registro.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-sierra-teal font-semibold">Email</TableHead>
                      <TableHead className="text-sierra-teal font-semibold">Creado</TableHead>
                      <TableHead className="text-sierra-teal font-semibold">Contraseña</TableHead>
                      <TableHead className="text-sierra-teal font-semibold w-32">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.user_email}</TableCell>
                        <TableCell className="text-sierra-gray">
                          {format(new Date(user.created_at), 'dd MMM yyyy', { locale: es })}
                        </TableCell>
                        <TableCell>
                          {visiblePasswords[user.user_email] ? (
                            <div className="flex items-center gap-2">
                              <code className="bg-sierra-teal/10 px-3 py-1 rounded text-sierra-teal font-mono">
                                {visiblePasswords[user.user_email]}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCopyPassword(user.user_email, visiblePasswords[user.user_email])}
                                className="h-8 w-8 p-0"
                              >
                                {copiedEmail === user.user_email ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4 text-sierra-gray" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sierra-gray/50">••••••••</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewPassword(user.user_email)}
                            disabled={loadingPassword === user.user_email}
                            className="border-sierra-teal/20 hover:border-sierra-teal"
                          >
                            {loadingPassword === user.user_email ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : visiblePasswords[user.user_email] ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-1" />
                                Ocultar
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-1" />
                                Ver
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-sierra-teal/10">
              <Button
                onClick={loadUsers}
                variant="outline"
                disabled={loading}
                className="border-sierra-teal/20 hover:border-sierra-teal"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Actualizar Lista
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
