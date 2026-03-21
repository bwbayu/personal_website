export interface Achievement {
    id: string;
    event_name: string;
    org_name: string;
    achievement?: string;
    date: string;
    descriptions: string[];
    githubUrl?: string[];
    resultUrl?: string[];
}