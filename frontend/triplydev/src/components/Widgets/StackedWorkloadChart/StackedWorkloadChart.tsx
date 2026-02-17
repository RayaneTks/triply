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
import {WorkloadDataPoint} from "../../../types/workload";

interface StackedWorkloadChartProps {
    data: WorkloadDataPoint[];
    title: string;
}

export const StackedWorkloadChart: React.FC<StackedWorkloadChartProps> = ({ data, title }) => {
    return (
        <div style={{ width: '100%', height: 450, padding: '20px', border: '1px solid #eee' }}>
            <h3 style={{ textAlign: 'center' }}>{title}</h3>

            <ResponsiveContainer width="100%" height="90%">
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="assignee" />

                    <YAxis label={{ value: 'Nombre de Tickets', angle: -90, position: 'insideLeft' }} />

                    <Tooltip />
                    <Legend verticalAlign="top" height={36}/>


                    <Bar dataKey="blocked" fill="#dc3545" stackId="a" name="Bloqué" />

                    <Bar dataKey="inReview" fill="#ffc107" stackId="a" name="En Revue" />

                    <Bar dataKey="inProgress" fill="#007bff" stackId="a" name="En Cours" />

                    <Bar dataKey="toDo" fill="#6c757d" stackId="a" name="À Faire" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};