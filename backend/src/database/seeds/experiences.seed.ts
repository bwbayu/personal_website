import { Experience } from '../../experiences/experience.type';

export const experiencesSeed: Omit<Experience, 'id'>[] = [
  {
    company: 'Ottomous AI',
    position: 'AI Software Engineer',
    description: [
      'Built a real-time speech translation backend with streaming architecture and audio pipeline optimization, achieving observed latency of 2–3s within a 4s SLA as monitored via Langfuse.',
      'Optimized ETL pipelines to BigQuery, cutting pipeline runtime by ~60.5% (~38s to ~15s average) and delivering ~2.5× faster throughput across 3 daily runs.',
      'Reduced LLM token consumption by ~36% (~11k → ~7k tokens per call) via structured prompt engineering, cutting per-call inference cost by ~$0.00114 without compromising output quality.',
    ],
    location: 'Remote',
    startDate: '2025-11-10',
    endDate: undefined,
  },
  {
    company: 'PT Bina Bangkit Nusantara (Cakap)',
    position: 'DevOps Engineer Intern',
    description: [
      'Maintained and monitored a microservices-based backend system built in Go (Golang), supporting development and testing environments',
      'Assisted in containerizing services using Docker and orchestrating deployments with Kubernetes (K8s), streamlining local development workflows',
    ],
    location: 'Bandung, West Java, Indonesia',
    startDate: '2025-01-01',
    endDate:   '2025-04-01',
  },
  {
    company: 'PT. Widata Intelligent Solution',
    position: 'Software Engineer',
    description: [
      'Developed and deployed 4 full-stack web applications using Flask, React.js, Laravel, and Tailwind CSS, tailored to diverse client needs.',
      'Integrated 3 pre-trained AI models into production: facial emotion recognition for a student monitoring system, and TTS/STT models for an Indonesian language learning platform.',
      'Fine-tuned a BERT-based model for automatic essay scoring, increasing accuracy by 41.5% on client-provided datasets.',
      'Collaborated with cross-functional teams (4–6 members) to deliver projects on time, ensuring alignment with client requirements through effective communication and teamwork.',
    ],
    location: 'Bandung, West Java, Indonesia',
    startDate: '2024-01-01',
    endDate:   '2024-11-01',
  },
  {
    company: 'Universitas Pendidikan Indonesia',
    position: 'Data Mining and Warehouse Course Practicum Assistant',
    description: [
      'Led practicum sessions for 80+ students in understanding data mining concepts through bi-weekly classes, improving student proficiency and hands-on skills by 20% through personalized guidance.',
      'Collaborated with a team of 5 assistants to organize and deliver class materials, achieving a 90% course completion rate with improved student performance in practical assignments.',
    ],
    location: 'Bandung, West Java, Indonesia',
    startDate: '2023-09-01',
    endDate:   '2024-01-01',
  },
  {
    company: 'Universitas Pendidikan Indonesia',
    position: 'Database System Course Practicum Assistant',
    description: [
      'Led practicum sessions for 80+ students in understanding database concepts and emphasizing SQL techniques through bi-weekly classes, increasing class participation rates to over 92%.',
      'Collaborated with a team of 6 assistants to organize and deliver class materials, achieving a 90% course completion rate with substantial improvement in students understanding of database normalization and SQL techniques.',
    ],
    location: 'Bandung, West Java, Indonesia',
    startDate: '2023-02-01',
    endDate:   '2023-06-01',
  },
];
