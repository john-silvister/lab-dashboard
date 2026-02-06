import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { UserPlus, Microscope, Eye, EyeOff, GraduationCap, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const DEPARTMENTS = ['CSE', 'ECE', 'Mechanical', 'Civil', 'Chemical', 'Physics', 'Mathematics'];

const SignupPage = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [department, setDepartment] = useState('');
    const [role, setRole] = useState('student');
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        try {
            const { error } = await signUp(email, password, {
                full_name: fullName,
                role,
                department,
            });
            if (error) throw error;
            toast.success('Account created! Please verify your email.');
            navigate('/login');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
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
                    <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
                    <p className="text-sm text-muted-foreground">Get started with booking lab equipment</p>
                </div>

                <Card className="border-border/50 shadow-xl backdrop-blur-xl bg-card/80">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name</label>
                                <Input
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    autoComplete="name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    type="email"
                                    placeholder="your@university.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Department</label>
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    required
                                >
                                    <option value="">Select Department</option>
                                    {DEPARTMENTS.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">I am a</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setRole('student')}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                                            role === 'student'
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-border hover:border-muted-foreground/50'
                                        }`}
                                    >
                                        <GraduationCap className="h-6 w-6" />
                                        <span className="text-sm font-medium">Student</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole('faculty')}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                                            role === 'faculty'
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-border hover:border-muted-foreground/50'
                                        }`}
                                    >
                                        <BookOpen className="h-6 w-6" />
                                        <span className="text-sm font-medium">Faculty</span>
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Password</label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        autoComplete="new-password"
                                        className="pr-10"
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
                                <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
                            </div>
                            <Button type="submit" className="w-full font-bold" disabled={loading}>
                                <UserPlus className="mr-2 h-4 w-4" /> {loading ? 'Creating...' : 'Create Account'}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center border-t p-4 bg-muted/20">
                        <p className="text-sm text-muted-foreground">
                            Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Log in</Link>
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
};

export default SignupPage;
