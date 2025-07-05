
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LogOut, 
  User, 
  FileText, 
  Upload, 
  Menu, 
  X,
  BarChart3 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const navigation = [
    {
      name: 'Procesar Archivos',
      href: '/',
      icon: Upload,
      current: location.pathname === '/'
    },
    {
      name: 'Archivos Guardados',
      href: '/saved-files',
      icon: FileText,
      current: location.pathname === '/saved-files'
    }
  ];

  return (
    <header className="sierra-gradient text-white shadow-2xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo y Titulo */}
          <div className="flex items-center space-x-4">
            <img 
              src="https://jbunbmphadxmzjokwgkw.supabase.co/storage/v1/object/sign/fotos/logo%20sierras%20(1).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGY4MzVlOS03N2Y3LTRiMWQtOWE0MS03NTVhYzYxNTM3NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJmb3Rvcy9sb2dvIHNpZXJyYXMgKDEpLnBuZyIsImlhdCI6MTc1MTY4NDM4NSwiZXhwIjoxNzgzMjIwMzg1fQ.XwugQX71wgOioRTdXdEB7LEFguocbub7FRI62qvzmFs"
              alt="Grupo Sierras Logo"
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-2xl font-bold">GRUPO SIERRAS</h1>
              <p className="text-sm opacity-90">Procesador de Archivos IA</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.name}
                  variant={item.current ? "secondary" : "ghost"}
                  onClick={() => navigate(item.href)}
                  className={`flex items-center gap-2 transition-all duration-200 ${
                    item.current 
                      ? 'bg-white/20 text-white hover:bg-white/30' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Button>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Desktop User Menu */}
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 text-white hover:bg-white/10">
                        <User className="h-5 w-5" />
                        <span className="max-w-32 truncate">{user.email}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">Mi Cuenta</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar Sesión
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden text-white hover:bg-white/10"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate('/auth')}
                variant="secondary"
                className="bg-white/20 text-white hover:bg-white/30"
              >
                Iniciar Sesión
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && user && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/20">
            <nav className="space-y-2 mt-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.name}
                    variant="ghost"
                    onClick={() => {
                      navigate(item.href);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full justify-start gap-2 transition-all duration-200 ${
                      item.current 
                        ? 'bg-white/20 text-white' 
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                );
              })}
              <div className="pt-2 border-t border-white/20">
                <div className="px-3 py-2">
                  <p className="text-sm text-white/60">Conectado como:</p>
                  <p className="text-sm text-white font-medium truncate">{user.email}</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full justify-start gap-2 text-red-200 hover:text-red-100 hover:bg-red-500/20"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesión
                </Button>
              </div>
            </nav>
          </div>
        )}

        {/* Stats Section */}
        <div className="mt-6 hidden md:block">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 opacity-80" />
              <span className="text-sm opacity-90">Sistema Optimizado con IA</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm opacity-90">Sistema Online</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
