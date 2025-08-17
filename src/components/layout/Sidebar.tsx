import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  BookOpen, 
  Shield, 
  BarChart3, 
  Target,
  GraduationCap 
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

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