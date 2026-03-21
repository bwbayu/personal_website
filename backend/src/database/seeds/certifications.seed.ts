import { Certification } from '../../certifications/certification.type';

export const certificationsSeed: Omit<Certification, 'id'>[] = [
  {
    company_name: 'Amazon Web Services (AWS)',
    title:        'AWS Certified Cloud Practitioner',
    issued:       '2025-01-01',
    expires:      '2028-01-01',
    url:          'https://www.credly.com/badges/337798f5-2607-4a8d-93a4-278d6b4f5bd1',
  },
  {
    company_name: 'Universitas Pendidikan Indonesia',
    title:        'BNSP - Database Administrator',
    issued:       '2024-11-01',
    expires:      '2027-11-01',
    url:          'https://drive.google.com/file/d/1e8sQcyXPfR-V751O5V_om3ZvjYNoaAak/view',
  },
];
