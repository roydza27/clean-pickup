import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  to: string;
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  badge?: string | number;
}

export function ActionCard({ 
  icon: Icon, 
  title, 
  description, 
  to, 
  variant = 'default',
  badge 
}: ActionCardProps) {
  const navigate = useNavigate();

  const variants = {
    default: 'bg-card',
    primary: 'gradient-primary text-primary-foreground',
    secondary: 'gradient-secondary text-secondary-foreground',
    accent: 'bg-accent text-accent-foreground',
  };

  const iconVariants = {
    default: 'bg-primary/10 text-primary',
    primary: 'bg-primary-foreground/20 text-primary-foreground',
    secondary: 'bg-secondary-foreground/20 text-secondary-foreground',
    accent: 'bg-accent-foreground/20 text-accent-foreground',
  };

  return (
    <button
      onClick={() => navigate(to)}
      className={cn(
        "card-interactive w-full text-left flex items-center gap-4",
        variants[variant]
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
        iconVariants[variant]
      )}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={cn(
            "font-semibold",
            variant === 'default' ? 'text-foreground' : ''
          )}>
            {title}
          </h3>
          {badge !== undefined && (
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              variant === 'default' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-primary-foreground/20'
            )}>
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className={cn(
            "text-sm mt-0.5 truncate",
            variant === 'default' ? 'text-muted-foreground' : 'opacity-80'
          )}>
            {description}
          </p>
        )}
      </div>
      <ChevronRight className={cn(
        "w-5 h-5 flex-shrink-0",
        variant === 'default' ? 'text-muted-foreground' : 'opacity-70'
      )} />
    </button>
  );
}
