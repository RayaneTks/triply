import { TeamChar } from 'triply-docs-lib';
import type { TeamCharNode } from 'triply-docs-lib';

const teamData: TeamCharNode = {
    id: '1',
    label: 'Rayane BOUDAOUD',
    sousTitre: 'Chef de projet',
    enfants: [
        {
            id: '2',
            label: 'Elias SAADI',
            sousTitre: 'Lead Tech',
            enfants: [
                { id: '4', label: 'Florent', sousTitre: 'Dev Front' },
                { id: '5', label: 'Kévin', sousTitre: 'Dev Back' },
            ],
        },
        {
            id: '3',
            label: 'Amir SAID',
            sousTitre: 'Scrum Master',
            enfants: [
                { id: '6', label: 'Cissé ABDOU', sousTitre: 'UX Designer' },
            ]
        },
        {
            id: '7',
            label: 'Duncan GAUBERT',
            sousTitre: 'Product Owner',
        },
    ],
};


export default function TeamCharPage() {
    return (
        <div className="p-8">
            <TeamChar data={teamData} />
        </div>
    );
}