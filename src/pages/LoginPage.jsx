import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { LogIn, Microscope, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { securityUtils } from '@/lib/security';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prevent double submission
        if (loading) return;

        try {
            // Security: Sanitize inputs
            const sanitizedEmail = securityUtils.sanitizeInput(email).toLowerCase().trim();

            // Security: Validate email format
            if (!securityUtils.validateEmail(sanitizedEmail)) {
                toast.error('Please enter a valid email address');
                return;
            }

            // Security: Basic rate limiting (client-side)
            if (loginAttempts >= 5) {
                toast.error('Too many login attempts. Please wait a few minutes before trying again.');
                return;
            }

            setLoading(true);

            const { error } = await signIn(sanitizedEmail, password);
            if (error) {
                setLoginAttempts(prev => prev + 1);
                throw error;
            }

            // Reset login attempts on successful login
            setLoginAttempts(0);
            toast.success('Successfully logged in');
            navigate('/');
        } catch (error) {
            securityUtils.secureLog('warn', 'Login failed', { email: securityUtils.maskEmail(email), attempts: loginAttempts + 1 });
            toast.error(error.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    // Security: Sanitize input handlers
    const handleEmailChange = (e) => {
        const sanitized = securityUtils.sanitizeInput(e.target.value);
        setEmail(sanitized);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md space-y-4"
            >
                <div className="text-center space-y-2 mb-8">
                    <div className="flex justify-center">
                        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
                            <Microscope className="h-7 w-7" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                    <p className="text-sm text-muted-foreground">Enter your credentials to access your lab dashboard</p>
                </div>

                <Card className="border-border/50 shadow-xl backdrop-blur-xl bg-card/80">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Email</label>
                                <Input
                                    type="email"
                                    placeholder="your@university.edu"
                                    value={email}
                                    onChange={handleEmailChange}
                                    required
                                    autoComplete="email"
                                    maxLength={254}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Password</label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                        className="pr-10"
                                        maxLength={128}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <Button type="submit" className="w-full font-bold" disabled={loading}>
                                <LogIn className="mr-2 h-4 w-4" /> {loading ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center border-t p-4 bg-muted/20">
                        <p className="text-sm text-muted-foreground">
                            Don't have an account? <Link to="/signup" className="text-primary hover:underline font-medium">Sign up</Link>
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
};

export default LoginPage;
