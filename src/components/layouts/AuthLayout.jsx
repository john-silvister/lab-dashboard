import React from 'react';

const AuthLayout = ({ children }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
                        Lab Booking System
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        University Research & Engineering Labs
                    </p>
                </div>
                {children}
            </div>
        </div>
    );
};

export default AuthLayout;
