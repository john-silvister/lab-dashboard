import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { toast } from 'sonner';

const SignupForm = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        department: '',
        role: 'student', // default
    });
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await signUp(formData.email, formData.password, {
                full_name: formData.fullName,
                department: formData.department,
                role: formData.role,
            });
            if (error) throw error;
            toast.success('Account created! Please sign in.');
            navigate('/login');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <Input
                    name="fullName"
                    label="Full Name"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                />
                <Input
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="your@university.edu"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
                <Input
                    name="department"
                    label="Department"
                    placeholder="Computer Science"
                    value={formData.department}
                    onChange={handleChange}
                    required
                />

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">I am a:</label>
                    <div className="flex gap-4">
                        <label className="flex items-center space-x-2 border rounded-md p-3 w-full cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                            <input
                                type="radio"
                                name="role"
                                value="student"
                                checked={formData.role === 'student'}
                                onChange={handleChange}
                                className="text-primary focus:ring-primary"
                            />
                            <span className="text-sm font-medium">Student</span>
                        </label>
                        <label className="flex items-center space-x-2 border rounded-md p-3 w-full cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                            <input
                                type="radio"
                                name="role"
                                value="faculty"
                                checked={formData.role === 'faculty'}
                                onChange={handleChange}
                                className="text-primary focus:ring-primary"
                            />
                            <span className="text-sm font-medium">Faculty</span>
                        </label>
                    </div>
                </div>

                <Input
                    name="password"
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
            </div>

            <Button type="submit" className="w-full" loading={loading}>
                Create Account
            </Button>

            <div className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-primary hover:text-primary/90">
                    Sign in
                </Link>
            </div>
        </form>
    );
};

export default SignupForm;
