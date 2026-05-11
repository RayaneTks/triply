import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import {VelocityDataPoint} from "../../../types/velocity.ts";

interface VelocityChartProps {
    data: VelocityDataPoint[];
    title: string;
}

export const VelocityChart: React.FC<VelocityChartProps> = ({ data, title }) => {
    const totalCompleted = data.reduce((sum, item) => sum + item.completed, 0);
    const averageVelocity = data.length > 0 ? (totalCompleted / data.length).toFixed(1) : '0.0';

    return (
        <div style={{ width: '100%', height: 450, padding: '20px', border: '1px solid #eee' }}>
            <h3 style={{ textAlign: 'center' }}>{title} (Moyenne: {averageVelocity} pts)</h3>

            <ResponsiveContainer width="100%" height="90%">
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="sprint" />

                    <YAxis label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }} />

                    <Tooltip />
                    <Legend verticalAlign="top" height={36}/>

                    <Bar
                        dataKey="committed"
                        fill="#8884d8"
                        name="Engagé"
                    />

                    <Bar
                        dataKey="completed"
                        fill="#82ca9d"
                        name="Terminé"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};