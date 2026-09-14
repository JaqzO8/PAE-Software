import * as React from "react";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value: number;
}

export const Progress = ({ value }: ProgressProps) => {
    return (
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
                className="h-full bg-orange-500 transition-all duration-300"
                style={{ width: `${value}%` }}
            />
        </div>
    );
};

