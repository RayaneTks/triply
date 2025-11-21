import {
    BurndownChart,
    type BurndownDataPoint,
    KpiCard,
    type KpiCardData,
    type PieChartDataPoint,
    PieChartWidget,
    ProgressBar,
    type ProgressBarData,
    StackedWorkloadChart,
    VelocityChart,
    type VelocityDataPoint,
    type WorkloadDataPoint
} from "triply-docs-lib";

const mockKpi: KpiCardData = {
    title: "Vélocité",
    value: "15.5 pts",
    trendType: 'positive',
    trendValue: '+2.1',
    icon: '🚀'
};
const mockProgress: ProgressBarData = {label: "Avancement Sprint", percentage: 75};
const mockPieData: PieChartDataPoint[] = [
    {name: 'Fini', value: 150},
    {name: 'En cours', value: 90}
];
const mockBurndown: BurndownDataPoint[] = [
    {day: 'J1', actual: 50, ideal: 50},
    {day: 'J10', actual: 5, ideal: 0}
];
const mockVelocity: VelocityDataPoint[] = [{sprint: 'S1', committed: 20, completed: 18}];
const mockWorkload: WorkloadDataPoint[] = [{assignee: 'C', inProgress: 8, inReview: 6, blocked: 0, toDo: 1}];

const dashboardContainerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    padding: '20px',
    backgroundColor: '#000000',
};

const kpiGridStyle: React.CSSProperties = {
    minHeight: '120px',
};

const largeWidgetStyle: React.CSSProperties = {
    gridColumn: 'span 2',
};

export default function Dashboard() {
    return (
        <div style={dashboardContainerStyle}>
            <div style={kpiGridStyle}>
                <KpiCard {...mockKpi} />
            </div>
            <div style={kpiGridStyle}>
                <KpiCard {...mockKpi} title="Bugs Ouverts" value={12} trendType='negative' icon='🐞'
                         accentColor='#dc3545'/>
            </div>
            <div style={kpiGridStyle}>
                <KpiCard {...mockKpi} title="Tickets En Revue" value={6} trendType='neutral' icon='🧐'
                         accentColor='#ffc107'/>
            </div>
            <div style={kpiGridStyle}>
                <ProgressBar {...mockProgress} />
            </div>

            <div style={largeWidgetStyle}>
                <BurndownChart data={mockBurndown} title="Sprint Burndown"/>
            </div>

            <div style={largeWidgetStyle}>
                <VelocityChart data={mockVelocity} title="Vélocité des 5 Sprints"/>
            </div>

            <div style={largeWidgetStyle}>
                <StackedWorkloadChart data={mockWorkload} title="Charge de Travail par Assigné"/>
            </div>

            <div style={largeWidgetStyle}>
                <PieChartWidget data={mockPieData} title="Distribution Globale des Tickets"/>
            </div>

        </div>
    );
}