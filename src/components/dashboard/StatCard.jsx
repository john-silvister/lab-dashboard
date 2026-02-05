import React from 'react';
import { Card, CardContent } from '../common/Card';
import { cn } from '../../lib/utils';

const StatCard = ({ title, value, icon: Icon, description, className }) => {
    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                    {Icon && (
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Icon className="h-6 w-6 text-primary" />
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <h3 className="text-2xl font-bold">{value}</h3>
                        {description && (
                            <p className="text-xs text-muted-foreground mt-1">{description}</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default StatCard;
