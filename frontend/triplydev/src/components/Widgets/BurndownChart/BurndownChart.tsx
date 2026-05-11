// src/components/BurndownChart.tsx
import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import {BurndownDataPoint} from "../../../types/burndown";

interface BurndownChartProps {
    data: BurndownDataPoint[];
    title: string;
}

export const BurndownChart: React.FC<BurndownChartProps> = ({ data, title }) => {
    return (
        <div style={{ width: '100%', height: 450, padding: '20px', border: '1px solid #eee' }}>
            <h3 style={{ textAlign: 'center' }}>{title}</h3>

            <ResponsiveContainer width="100%" height="90%">
                <LineChart
                    data={data}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="day" />

                    <YAxis label={{ value: 'Travail Restant (Points)', angle: -90, position: 'insideLeft' }} />

                    <Tooltip />
                    <Legend verticalAlign="top" height={36}/>

                    <Line
                        type="monotone"
                        dataKey="ideal"
                        stroke="#008080"
                        strokeDasharray="5 5"
                        name="Ligne Idéale"
                        dot={false}
                    />

                    <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="#0000FF"
                        name="Reste Réel"
                        strokeWidth={2}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};