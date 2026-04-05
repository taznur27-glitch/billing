import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, DollarSign,
  Users, RotateCcw, List, Bell, Menu, X, Smartphone, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInventory, getOldStockFlag } from '@/hooks/useData';
import ThemeToggle from '@/components/ThemeToggle';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Inventory', icon: Package, path: '/inventory' },
  { label: 'Sales', icon: DollarSign, path: '/sales' },
  { label: 'Returns', icon: RotateCcw, path: '/returns' },
  { label: 'Parties', icon: Users, path: '/parties' },
  { label: 'Transactions', icon: List, path: '/transactions' },
  { label: 'Admin', icon: Shield, path: '/admin' },
];

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/inventory': 'Inventory',
  '/inventory/add': 'Add Phone',
  '/sales': 'Sales',
  '/returns': 'Returns',
  '/parties': 'Parties',
  '/transactions': 'Transactions',
  '/admin': 'Admin Panel',
};

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentPath = location.pathname;
  const { data: inventory = [] } = useInventory();
  const pageTitle = pageTitles[currentPath] || 'MobileShop Manager';

  const oldStockCount = inventory.filter(i => getOldStockFlag(i).type === 'old').length;

  useEffect(() => {
    setSidebarOpen(false);
  }, [currentPath]);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 bg-card border-r border-border fixed h-full z-30">
        <div className="p-5 border-b border-border flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground text-sm">MobileShop Manager</span>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const active = currentPath === item.path || (item.path === '/inventory' && currentPath.startsWith('/inventory'));
            return (
            <Link key={item.path} to={item.path} className={`flex min-h-11 items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-foreground/35" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[82vw] max-w-xs bg-card border-r border-border flex flex-col">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-sm">MobileShop</span>
              </div>
              <Button variant="ghost" size="icon" className="min-h-11 min-w-11" onClick={() => setSidebarOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => {
                const active = currentPath === item.path || (item.path === '/inventory' && currentPath.startsWith('/inventory'));
                return (
                  <Link key={item.path} to={item.path} className={`flex min-h-11 items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-card/90 backdrop-blur-md border-b border-border px-3 lg:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="lg:hidden min-h-11 min-w-11" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
             <h1 className="text-sm sm:text-base font-semibold text-foreground truncate">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <div className="relative">
              <Button variant="ghost" size="icon" className="min-h-11 min-w-11">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </Button>
              {oldStockCount > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {oldStockCount}
                </span>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 p-3 sm:p-4 lg:p-6 pb-24 lg:pb-6">{children}</main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur border-t border-border grid grid-cols-5 px-1 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
        {navItems.slice(0, 5).map((item) => {
          const active = currentPath === item.path || currentPath.startsWith(`${item.path}/`) || (item.path === '/dashboard' && currentPath === '/');
          return (
            <Link key={item.path} to={item.path} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md text-[10px] font-medium transition-colors ${active ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
              <item.icon className="w-5 h-5" />
              <span>{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
