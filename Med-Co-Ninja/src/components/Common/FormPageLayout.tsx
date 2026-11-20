// components/Common/FormPageLayout.tsx
import React, { ReactNode } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from '@tanstack/react-router';
import GenericButton from '../Forms/Buttons/GenericButton';

interface FormPageLayoutProps {
    title: string;
    children: ReactNode;
    backPath?: string;
    onBack?: () => void;
    className?: string;
    showBack?: boolean;
    isLoading?: boolean;
    loadingText?: string;
    actions?: ReactNode;
}

const FormPageLayout: React.FC<FormPageLayoutProps> = ({
    title,
    children,
    backPath,
    onBack,
    className = '',
    showBack = true,
    isLoading = false,
    loadingText = 'Loading...',
    actions,
}) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else if (backPath) {
            navigate({ to: backPath });
        }
    };

    if (isLoading) {
        return (
            <div className="mx-auto max-w-7xl p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-center rounded-xl bg-pure-white p-4 md:p-8 shadow-lg sm:p-10 md:p-12">
                    <div className="text-center">
                        <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-4 border-primary-navy border-t-transparent sm:h-8 sm:w-8"></div>
                        <p className="text-sm text-text-charcoal sm:text-base">{loadingText}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`mx-auto  p-3 sm:p-4 md:p-6 ${className}`}>
            {/* Header with Back Button and Title - Outside the Card */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 md:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                    {showBack && (backPath || onBack) && (
                        <GenericButton
                            onClick={handleBack}
                            variant="navy"

                            aria-label="Go back"
                        >

                            <span> ← Back</span>
                        </GenericButton>
                    )}
                    <h1 className="text-lg font-bold text-text-charcoal sm:text-xl md:text-2xl">
                        {title}
                    </h1>
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>

            {/* Main Card */}
            <div className="rounded-xl border-l-4 border-primary-navy bg-pure-white p-3 shadow-md sm:p-4 md:p-5">
                {/* Form Content */}
                <div className="space-y-3 md:space-y-4">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default FormPageLayout;