import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, UserPlus, LogIn, Settings, Shield, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Admin access states
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [verifyingAdmin, setVerifyingAdmin] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Reset admin verification when switching to login mode
  useEffect(() => {
    if (isLogin) {
      setIsAdminVerified(false);
    }
  }, [isLogin]);

  const handleAdminVerify = async () => {
    if (!adminPassword.trim()) {
      toast({
        title: "Error",
        description: "Ingresa la contraseña de administrador",
        variant: "destructive",
      });
      return;
    }

    setVerifyingAdmin(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin-access', {
        body: { password: adminPassword }
      });

      if (error) throw error;

      if (data?.success) {
        // PASO 1: Cerrar el dialog PRIMERO
        setShowAdminDialog(false);
        setAdminPassword('');
        
        // PASO 2: Esperar a que la animación del Dialog termine (300ms)
        setTimeout(() => {
          setIsAdminVerified(true);
          setIsLogin(false);
          toast({
            title: "Acceso Concedido",
            description: "Ahora puedes crear una nueva cuenta.",
          });
        }, 300);
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
        description: "No se pudo verificar el acceso. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setVerifyingAdmin(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Error de Inicio de Sesión",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "¡Bienvenido!",
            description: "Has iniciado sesión correctamente.",
          });
        }
      } else {
        // Only allow registration if admin verified
        if (!isAdminVerified) {
          toast({
            title: "Acceso No Autorizado",
            description: "Necesitas verificar acceso de administrador para crear cuentas.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          toast({
            title: "Error",
            description: "Las contraseñas no coinciden",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password);
        if (error) {
          toast({
            title: "Error de Registro",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "¡Registro Exitoso!",
            description: "La cuenta ha sido creada correctamente.",
          });
          // Reset to login after successful registration
          setIsLogin(true);
          setIsAdminVerified(false);
          setEmail('');
          setPassword('');
          setConfirmPassword('');
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sierra-teal/10 via-white to-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y Header */}
        <div className="text-center mb-8">
          <img 
            src="/logo-sierras.png"
            alt="Grupo Sierras Logo"
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-sierra-teal mb-2">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h1>
          <p className="text-sierra-gray">
            {isLogin 
              ? 'Accede a tu procesador de archivos IA' 
              : 'Crear nueva cuenta de usuario'
            }
          </p>
          {!isLogin && isAdminVerified && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <Shield className="h-3 w-3" />
              Modo Administrador
            </div>
          )}
        </div>

        {/* Formulario */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center text-sierra-teal">
              {isLogin ? (
                <div className="flex items-center justify-center gap-2">
                  <LogIn className="h-6 w-6" />
                  Iniciar Sesión
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <UserPlus className="h-6 w-6" />
                  Crear Cuenta
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sierra-teal font-medium">
                  Correo Electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-sierra-gray" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-sierra-teal/20 focus:border-sierra-teal focus:ring-sierra-teal/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sierra-teal font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-sierra-gray" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 border-sierra-teal/20 focus:border-sierra-teal focus:ring-sierra-teal/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-sierra-gray hover:text-sierra-teal"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sierra-teal font-medium">
                    Confirmar Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-sierra-gray" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-12 border-sierra-teal/20 focus:border-sierra-teal focus:ring-sierra-teal/20"
                      required
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 sierra-gradient hover:opacity-90 transition-all duration-200 font-semibold text-lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isLogin ? 'Iniciando...' : 'Registrando...'}
                  </div>
                ) : (
                  isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              {isLogin ? (
                <button
                  onClick={() => setShowAdminDialog(true)}
                  className="text-sm text-sierra-gray/60 hover:text-sierra-teal transition-colors flex items-center justify-center gap-1.5 mx-auto"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Opciones de Admin
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsLogin(true);
                    setIsAdminVerified(false);
                    setEmail('');
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  className="text-sierra-teal hover:underline font-medium flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a Iniciar Sesión
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Acceso Admin */}
      <Dialog 
        open={showAdminDialog} 
        onOpenChange={(open) => {
          if (!open && !verifyingAdmin) {
            setShowAdminDialog(false);
            setAdminPassword('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sierra-teal">
              <Shield className="h-5 w-5" />
              Acceso de Administrador
            </DialogTitle>
            <DialogDescription>
              Ingresa la contraseña de administrador para crear nuevas cuentas de usuario.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-sierra-gray" />
              <Input
                type="password"
                placeholder="Contraseña de admin"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="pl-10 h-12 border-sierra-teal/20 focus:border-sierra-teal"
                onKeyDown={(e) => e.key === 'Enter' && handleAdminVerify()}
                disabled={verifyingAdmin}
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowAdminDialog(false)}
              disabled={verifyingAdmin}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAdminVerify} 
              className="sierra-gradient"
              disabled={verifyingAdmin}
            >
              {verifyingAdmin ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Verificando...
                </div>
              ) : (
                'Verificar Acceso'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
