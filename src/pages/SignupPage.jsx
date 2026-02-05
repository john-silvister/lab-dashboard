import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { UserPlus, Microscope } from 'lucide-react';
import { toast } from 'sonner';

const SignupPage = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const onSubmit = async (data) => {
        try {
            const { error } = await signUp(data.email, data.password, {
                full_name: data.fullName,
                role: 'student' // Default to student
            });
            if (error) throw error;
            toast.success('Account created! Please verify your email.');
            navigate('/login');
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
            <div className="w-full max-w-md space-y-4">
                <div className="text-center space-y-2 mb-8">
                    <div className="flex justify-center">
                        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
                            <Microscope className="h-8 w-8" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
                    <p className="text-sm text-muted-foreground">Get started with booking lab equipment</p>
                </div>

                <Card className="border-border/50 shadow-xl backdrop-blur-xl bg-card/80">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name</label>
                                <Input
                                    {...register('fullName', { required: 'Name is required' })}
                                    placeholder="John Doe"
                                />
                                {errors.fullName && <span className="text-xs text-red-500">{errors.fullName.message}</span>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    {...register('email', { required: 'Email is required' })}
                                    type="email"
                                    placeholder="student@university.edu"
                                />
                                {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Password</label>
                                <Input
                                    {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 chars' } })}
                                    type="password"
                                />
                                {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
                            </div>
                            <Button type="submit" className="w-full font-bold">
                                <UserPlus className="mr-2 h-4 w-4" /> Create Account
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center border-t p-4 bg-muted/20">
                        <p className="text-sm text-muted-foreground">
                            Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Log in</Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default SignupPage;
