import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  BookOpen, 
  Shield, 
  BarChart3, 
  Target,
  Settings,
  FlaskConical,
  AlertTriangle
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Courses',
    href: '/courses',
    icon: BookOpen,
  },
  {
    title: 'Phishing Simulator',
    href: '/phishing-simulator',
    icon: Target,
  },
  {
    title: 'My Progress',
    href: '/progress',
    icon: BarChart3,
  },
  {
    title: 'Security Guide',
    href: '/guide',
    icon: Shield,
  },
];

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;

    console.log('Checking admin status for user:', user.id);
    const { data, error } = await supabase
      .from('admin_roles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('Admin check result:', { data, error, isAdmin: !!data });
    setIsAdmin(!!data);
  };

const navigationItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    {
      title: 'Courses',
      href: '/courses',
      icon: BookOpen,
    },
    {
      title: 'Phishing Simulator',
      href: '/phishing-simulator',
      icon: Target,
    },
    {
      title: 'Security Playground',
      href: '/security-playground',
      icon: FlaskConical,
    },
    {
      title: 'My Progress',
      href: '/progress',
      icon: BarChart3,
    },
    {
      title: 'Security Guide',
      href: '/guide',
      icon: Shield,
    },
    ...(isAdmin ? [
      {
        title: 'Admin: Courses',
        href: '/admin/courses',
        icon: Settings,
      },
      {
        title: 'Admin: Phishing Tests',
        href: '/admin/phishing-test',
        icon: Target,
      },
      {
        title: 'Admin: Incidents',
        href: '/admin/incidents',
        icon: AlertTriangle,
      }
    ] : []),
  ];

  return (
    <div className="w-64 bg-card border-r h-screen p-4">
      <div className="space-y-2">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link key={item.href} to={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-primary text-primary-foreground"
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}