import { Achievement } from '../../achievements/achievements.type';

export const achievementsSeed: Omit<Achievement, 'id'>[] = [
  {
    event_name:  'Qdrant Vector Database Hackathon 2025',
    org_name:    'Qdrant',
    date:        '2025-09-01',
    descriptions: [
      'Built a multi-modal knowledge assistant that transforms educational videos into searchable knowledge using video, audio, slide, and document understanding.',
      'Integrated Twelve Labs, Qdrant, Neo4j, and Cognee to enable semantic search, slide extraction, and graph reasoning across instructional content.',
    ],
    githubUrl:   ['https://github.com/bwbayu/Qlassroom'],
    resultUrl:   ['https://qdrant.tech/blog/vector-space-hackathon-winners-2025/#twelvelabs-prize-qlassroom-yhha'],
  },
  {
    event_name:  'MAPID WebGIS Competition',
    org_name:    'MAPID',
    date:        '2025-03-01',
    descriptions: [
      'Secured a top-10 position in a national-level geospatial application competition organized by MAPID',
      'As a Machine Learning Engineer, developed a content-based and location-aware recommendation system for rental properties using XGBoost (R² = 0.82), leveraging both textual and geospatial features',
    ],
    githubUrl:   [],
    resultUrl:   ['https://drive.google.com/file/d/11nKa7k7jk6-mCF7Rjg-IDpitjbV2Vpu6/view?usp=sharing'],
  },
  {
    event_name:  'Hology 7.0',
    org_name:    'Universitas Brawijaya',
    date:        '2024-09-01',
    descriptions: [
      'Secured a top-8 position out of 196 teams in a national-level competition organized by Universitas Brawijaya.',
      'Preliminary Round: Fine-tuned a Vision Transformer (ViT) model for multi-label classification of T-shirts and hoodies, achieving an Exact Match Ratio (EMR) of 0.982905.',
      'Final Round: Designed a clustering and recommendation system for an e-commerce marketplace, preprocessing noisy product names and grouping over 516 categories using TF-IDF and SentenceTransformer.',
    ],
    githubUrl:   [
      'https://github.com/Khaairi/Clothing_Multilabel_Classification',
      'https://github.com/bwbayu/product_name_clustering',
    ],
    resultUrl:   ['https://drive.google.com/file/d/1ZKR3dyi-KT5cVQpkSHw_R04uYhVY6r_Q/view?usp=sharing'],
  },
  {
    event_name:  'Compfest 16',
    org_name:    'Universitas Indonesia',
    date:        '2024-07-01',
    descriptions: [
      'Developed an AI-driven web platform to streamline the job search process for IT professionals by matching resumes with job descriptions using vector similarity.',
      'The system utilizes advanced vector search technology to retrieve the most relevant job descriptions based on candidate skills.',
      'Key features include resume upload, real-time job recommendations, and high-quality job-resume matching powered by a fine-tuned SBERT model.',
    ],
    githubUrl:   ['https://github.com/bwbayu/JobFitte'],
    resultUrl:   ['https://drive.google.com/file/d/1HaUS9mij45Q5snB7iLIIvtnNYt45p5pP/view?usp=sharing'],
  },
  {
    event_name:  'DIMAS-TI 2022',
    org_name:    'Asosiasi MIPA LPTK Indonesia (AMLI)',
    date:        '2022-06-01',
    descriptions: [],
    githubUrl:   [],
    resultUrl:   ['https://drive.google.com/file/d/1vVcYB3nYw3RFRit4k-NshFTb_RVhkQRC/view?usp=sharing'],
  },
];
