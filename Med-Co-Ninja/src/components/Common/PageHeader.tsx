
import React from 'react';
import { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    action?: ReactNode;
    className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    action,
    className = '',
}) => {
    return (
        <div className={`mb-3 flex items-center justify-between gap-3 md:mb-4 ${className}`}>
            <div className="min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-900 dark:text-white">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        {subtitle}
                    </p>
                )}
            </div>
            {action && <div className="flex justify-end shrink-0">{action}</div>}
        </div>
    );
};

export default PageHeader;