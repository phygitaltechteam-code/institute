import { useAuthContext } from '@/context/AuthContext';
import { useCustomerLogin } from '@/lib/react-query/Auth/auth';
import { signInSchema } from '@/lib/validation/signInSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiEye, FiMail, FiLock, FiUser, FiArrowRight } from 'react-icons/fi';
import { LuEyeOff } from 'react-icons/lu';
import { z } from 'zod';

type SignInFormValues = z.infer<typeof signInSchema>;

const SignIn: React.FC = () => {
    const navigate = useNavigate();
    const { mutateAsync: signIn, isError, isPending, isSuccess } = useCustomerLogin();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<SignInFormValues>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            identifier: '',
            password: '',
        },
    });

    const { login, isAuthenticated } = useAuthContext();
    const [showPassword, setShowPassword] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    // Triggers the entrance animation once the component is mounted
    useEffect(() => {
        setMounted(true);
    }, []);

    // If user is already authenticated, redirect
    useEffect(() => {
        if (isAuthenticated && !isNavigating) {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            if (userData.role === 'SUPERADMIN') {
                navigate({ to: '/superadmin/admins' });
            } else if (userData.role === 'ADMIN') {
                navigate({ to: '/admin/dashboard' });
            } else if (userData.role === 'TEACHER') {
                navigate({ to: '/faculty/batchtable' });
            } else if (userData.role === 'STUDENT') {
                navigate({ to: '/student/studentdahboard' });
            }
        }
    }, [isAuthenticated, navigate]);

    const onSubmit = async (values: SignInFormValues) => {
        // Prevent multiple submissions
        if (isNavigating || isSubmitting) return;
        
        setIsNavigating(true);
        
        try {
            const res = await signIn({
                username: values.identifier,
                password: values.password,
            });

            const { accessToken, user: userData, refreshToken } = res.data;

            // Store user data in localStorage first
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            // Update auth context
            login(accessToken, userData, refreshToken);

            // Navigate based on role after a small delay to ensure context updates
            setTimeout(() => {
                if (userData.role === 'SUPERADMIN') {
                    navigate({ to: '/superadmin/admins' });
                } else if (userData.role === 'ADMIN') {
                    navigate({ to: '/admin/dashboard' });
                } else if (userData.role === 'TEACHER') {
                    navigate({ to: '/faculty/batchtable' });
                } else if (userData.role === 'STUDENT') {
                    navigate({ to: '/student/studentdahboard' });
                }
                setIsNavigating(false);
            }, 100);

        } catch (error: any) {
            console.error('Sign in error:', error);
            setIsNavigating(false);
            
            // Set specific error messages based on response
            if (error?.response?.data?.message) {
                setError('root', {
                    message: error.response.data.message,
                });
            } else {
                setError('root', {
                    message: 'Invalid User ID or password. Please try again.',
                });
            }
        }
    };

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-bg-light-mint via-pure-white to-bg-light-mint dark:from-boxdark-2 dark:to-boxdark text-text-charcoal dark:text-pure-white transition-colors duration-300 overflow-hidden">
            {/* Decorative Background Blobs */}
            <div className="absolute top-0 left-0 w-72 h-72 bg-accent-teal/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-navy/5 rounded-full blur-3xl pointer-events-none translate-x-1/4 translate-y-1/4" />

            <div className="mx-auto w-full max-w-md px-4 py-5 md:py-8 relative z-10">
                <div
                    className={`w-full transform transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
                        }`}
                >
                    {/* Logo and Header */}
                    <div className="mb-4 md:mb-8 text-center">
                        <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-primary-navy dark:text-pure-white">
                            Welcome Back
                        </h2>
                        <p className="text-sm font-medium text-text-charcoal/60 dark:text-bodydark">
                            Sign in to continue your journey
                        </p>
                    </div>

                    {/* Main Card */}
                    <div className="rounded-2xl border border-stroke bg-pure-white p-4 md:p-8 shadow-default dark:border-strokedark dark:bg-boxdark md:p-10">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {/* User ID */}
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-charcoal/80 dark:text-pure-white/80">
                                    <FiUser className="text-accent-teal" />
                                    User ID
                                </label>
                                <div className="group/input relative">
                                    <input
                                        type="text"
                                        placeholder="Enter your user Id"
                                        {...register('identifier')}
                                        className={`w-full rounded-xl border bg-bg-light-mint/50 dark:bg-boxdark-2 px-4 py-3.5 text-text-charcoal dark:text-pure-white placeholder-text-charcoal/40 dark:placeholder-bodydark/40 outline-none transition-all duration-200 ${errors.identifier
                                            ? 'border-danger focus:border-danger focus:ring-4 focus:ring-danger/10'
                                            : 'border-stroke dark:border-strokedark focus:border-accent-teal focus:ring-4 focus:ring-accent-teal/10 dark:focus:border-accent-teal'
                                            } pr-12`}
                                    />
                                    <FiMail
                                        className={`absolute right-4 top-1/2 -translate-y-1/2 text-lg transition-colors duration-200 ${errors.identifier ? 'text-danger' : 'text-text-charcoal/40 dark:text-bodydark/40'
                                            }`}
                                    />
                                </div>
                                {errors.identifier && (
                                    <p className="animate-shake flex items-center gap-1 text-xs font-medium text-danger">
                                        <span>•</span> {errors.identifier.message}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-charcoal/80 dark:text-pure-white/80">
                                    <FiLock className="text-accent-teal" />
                                    Password
                                </label>
                                <div className="group/input relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        {...register('password')}
                                        className={`w-full rounded-xl border bg-bg-light-mint/50 dark:bg-boxdark-2 px-4 py-3.5 text-text-charcoal dark:text-pure-white placeholder-text-charcoal/40 dark:placeholder-bodydark/40 outline-none transition-all duration-200 ${errors.password
                                            ? 'border-danger focus:border-danger focus:ring-4 focus:ring-danger/10'
                                            : 'border-stroke dark:border-strokedark focus:border-accent-teal focus:ring-4 focus:ring-accent-teal/10 dark:focus:border-accent-teal'
                                            } pr-12`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-charcoal/40 dark:text-bodydark/40 transition-colors duration-200 hover:text-accent-teal"
                                    >
                                        {showPassword ? (
                                            <LuEyeOff size={18} />
                                        ) : (
                                            <FiEye size={18} />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="animate-shake flex items-center gap-1 text-xs font-medium text-danger">
                                        <span>•</span> {errors.password.message}
                                    </p>
                                )}
                            </div>

                            {/* Error Message */}
                            {(isError || errors.root) && (
                                <div className="animate-slideIn rounded-xl border border-danger/20 bg-danger/5 p-3.5">
                                    <p className="text-center text-sm font-medium text-danger">
                                        {errors.root?.message || 'Invalid User ID or password. Please try again.'}
                                    </p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting || isNavigating}
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                                className="relative w-full transform overflow-hidden rounded-xl bg-primary-navy px-6 py-3.5 font-bold text-pure-white shadow-lg shadow-primary-navy/10 hover:shadow-primary-navy/20 transition-all duration-300 hover:bg-opacity-95 active:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    {isPending || isSubmitting || isNavigating ? (
                                        <>
                                            <svg
                                                className="h-5 w-5 animate-spin text-pure-white"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            <span>Signing in...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Sign In</span>
                                            <FiArrowRight
                                                className={`transform transition-transform duration-200 ${isHovered ? 'translate-x-0.5' : ''
                                                    }`}
                                            />
                                        </>
                                    )}
                                </span>
                            </button>

                            {/* Sign Up Link */}
                            <p className="mt-4 text-center text-sm font-medium text-text-charcoal/60 dark:text-bodydark">
                                Don't have an account?{' '}
                                <Link
                                    to="/"
                                    className="group/link relative inline-flex items-center gap-0.5 font-bold text-accent-teal transition-colors duration-200 hover:text-accent-teal/80"
                                >
                                    Sign up
                                    <FiArrowRight className="-translate-x-1 transform opacity-0 transition-all duration-200 group-hover/link:translate-x-0 group-hover/link:opacity-100" />
                                </Link>
                            </p>
                        </form>
                    </div>

                    {/* Footer */}
                    <p className="mt-4 md:mt-8 text-center text-xs font-medium text-text-charcoal/40 dark:text-bodydark/40">
                        © 2026 MedCode Ninja. All rights reserved.
                    </p>
                </div>
            </div>

            <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.25s ease-out;
        }
      `}</style>
        </div>
    );
};

export default SignIn;