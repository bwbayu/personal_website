import { Education } from '../../educations/education.type';

export const educationsSeed: Omit<Education, 'id'>[] = [
  {
    institution: 'Universitas Pendidikan Indonesia',
    title:       'Undergraduate Student, Computer Science',
    startDate:   '2021-08-01',
    endDate:     '2025-07-01',
    description: 'Grade: 3.89/4.00 | Thesis: Comparison Of Direct Scoring And Similarity-based Scoring Approaches In Automatic Short Answer Scoring',
  }
];
