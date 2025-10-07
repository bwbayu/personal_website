export const getProjectsData = async () => {
  return [
    {
      name: "StopJudol Youtube Bot",
      date: "Sep - Oct 2025",
      description:
        "StopJudol is a web dashboard, similar to YouTube Studio, that integrates the YouTube Data API with a fine‑tuned BERT model (~99% accuracy) to automatically detect online‑gambling promotions in YouTube comments. It empowers content creators to clean up their comment sections effortlessly in just two steps: run the detection and bulk-delete flagged comments. That's it.",
      repository: "https://github.com/bwbayu/youtube-bot",
      web_url: "",
      role: ["Full-Stack Developer", "Machine Learning Engineer"],
      tech: [
        {
          name: "Python",
          iconClass: "devicon-python-plain colored text-3xl",
        },
        {
          name: "TypeScript",
          iconClass: "devicon-typescript-plain colored text-3xl",
        },
        {
          name: "FastAPI",
          iconClass: "devicon-fastapi-plain colored text-3xl",
        },
        {
          name: "React",
          iconClass: "devicon-react-original colored text-3xl",
        },
        {
          name: "PostgreSQL",
          iconClass: "devicon-postgresql-plain colored text-3xl",
        },
        {
          name: "Redis",
          iconClass: "devicon-redis-plain colored text-3xl",
        },
        {
          name: "PyTorch",
          iconClass: "devicon-pytorch-original colored text-3xl",
        },
        {
          name: "Pandas",
          iconClass: "devicon-pandas-plain colored text-3xl",
        },
      ],
      category: ["Web", "ML"],
    },
    {
      name: "Qlassroom",
      date: "Sep 2025",
      description:
        "A multi-modal classroom assistant that captures speech, video, slides, images, and documents together into a searchable knowledge memory. Awarded in Qdrant Hackathon 2025 Project by YHHA (Best in Category TwelveLabs)",
      repository: "https://github.com/bwbayu/Qlassroom",
      web_url: "",
      role: ["AI Engineer"],
      tech: [
        {
          name: "Python",
          iconClass: "devicon-python-plain colored text-3xl",
        },
        {
          name: "Google Cloud Platform (GCP)",
          iconClass: "devicon-googlecloud-plain colored text-3xl",
        },
        {
          name: "Cognee",
          iconClass: "devicon-python-plain text-3xl",
        },
        {
          name: "Qdrant",
          iconClass: "devicon-python-plain text-3xl",
        },
        {
          name: "TwelveLabs",
          iconClass: "devicon-python-plain text-3xl",
        },
        {
          name: "CrewAI",
          iconClass: "devicon-python-plain text-3xl",
        },
        {
          name: "Gradio",
          iconClass: "devicon-python-plain text-3xl",
        },
      ],
      category: ["Web", "ML"],
    },
    {
      name: "RAG Chatbot CSE UPI",
      date: "Aug 2025",
      description:
        "A lightweight RAG-based chatbot built with FastAPI and Streamlit to answer questions about the Faculty of Computer Science Education at UPI, using content sourced from the official website.",
      repository: "https://github.com/bwbayu/RAG_Chatbot",
      web_url: "https://chatbot-upi.bwbayu.space/",
      role: ["Full-Stack Developer", "Machine Learning Engineer"],
      tech: [
        {
          name: "FastAPI",
          iconClass: "devicon-fastapi-plain colored text-3xl",
        },
        {
          name: "Python",
          iconClass: "devicon-python-plain colored text-3xl",
        },
        {
          name: "Docker",
          iconClass: "devicon-docker-plain colored text-3xl",
        },
        {
          name: "Google Cloud Platform (GCP)",
          iconClass: "devicon-googlecloud-plain colored text-3xl",
        },
        {
          name: "LangChain",
          iconClass: "devicon-python-plain text-3xl",
        },
        {
          name: "Pinecone",
          iconClass: "devicon-python-plain text-3xl",
        },
        {
          name: "Streamlit",
          iconClass: "devicon-streamlit-plain colored text-3xl",
        },
      ],
      category: ["Web", "ML"],
    },
    {
      name: "Thesis Code - ASAS Model Development & Demo Web",
      date: "Jan - July 2025",
      description:
        "A full-stack project for developing and deploying an Automatic Short Answer Scoring (ASAS) system using BERT-based models, \
      combining machine learning experimentation with a web-based demo interface.",
      repository: "https://github.com/bwbayu/thesis-code",
      web_url: "https://asas-demo.web.app/",
      role: ["Full-Stack Developer", "Machine Learning Engineer"],
      tech: [
        {
          name: "PyTorch",
          iconClass: "devicon-pytorch-original colored text-3xl",
        },
        {
          name: "Python",
          iconClass: "devicon-python-plain colored text-3xl",
        },
        {
          name: "Numpy",
          iconClass: "devicon-numpy-plain colored text-3xl",
        },
        {
          name: "Pandas",
          iconClass: "devicon-pandas-plain colored text-3xl",
        },
        {
          name: "React",
          iconClass: "devicon-react-original colored text-3xl",
        },
        {
          name: "Docker",
          iconClass: "devicon-docker-plain colored text-3xl",
        },
        {
          name: "Flask",
          iconClass: "devicon-flask-original colored text-3xl",
        },
        {
          name: "Google Cloud Platform (GCP)",
          iconClass: "devicon-googlecloud-plain colored text-3xl",
        },
      ],
      category: ["Web", "ML"],
    },
    {
      name: "KostHub",
      date: "Feb - April 2025",
      description:
        "Participated as Machine Learning Engineer in Mapid WebGIS Competition 2025. Built a price prediction model (XGBoost, R² = 0.82) \
            and a boarding house recommender system (KNN). Deployed models into the system using FastAPI.",
      repository: "",
      web_url: "",
      role: ["Machine Learning Engineer"],
      tech: [
        {
          name: "FastAPI",
          iconClass: "devicon-fastapi-plain colored text-3xl",
        },
        {
          name: "Python",
          iconClass: "devicon-python-plain colored text-3xl",
        },
        {
          name: "Numpy",
          iconClass: "devicon-numpy-plain colored text-3xl",
        },
        {
          name: "Pandas",
          iconClass: "devicon-pandas-plain colored text-3xl",
        },
        {
          name: "Scikit-Learn",
          iconClass: "devicon-scikitlearn-plain colored text-3xl",
        },
      ],
      category: ["Data/ML"],
    },
    {
      name: "Jenkins Pipeline",
      date: "Jan 2025",
      description:
        "Part of the Dicoding IDCamp DevOps Engineer scholarship, where I implemented a CI/CD pipeline using Jenkins, \
            Docker, and AWS EC2 to automate the build, test, and deployment process for a React and Python app. Additionally, integrated Prometheus \
            and Grafana for real-time monitoring and visualization of metrics, enhancing system reliability and performance insights.",
      repository: "https://github.com/bwbayu/jenkins-pipeline",
      web_url: "",
      role: ["DevOps Engineer"],
      tech: [
        {
          name: "Amazon Web Services (AWS)",
          iconClass:
            "devicon-amazonwebservices-plain-wordmark colored text-3xl",
        },
        {
          name: "Docker",
          iconClass: "devicon-docker-plain colored text-3xl",
        },
        {
          name: "Jenkins",
          iconClass: "devicon-jenkins-plain colored text-3xl",
        },
        {
          name: "Prometheus",
          iconClass: "devicon-prometheus-original colored text-3xl",
        },
        {
          name: "Grafana",
          iconClass: "devicon-grafana-plain colored text-3xl",
        },
      ],
      category: ["Web"],
    },
    {
      name: "Forum API",
      date: "Okt - Dec 2024",
      description:
        "Part of Dicoding AWS Back-End Developer Academy scholarship, this API was designed for a discussion platform using \
            Clean Architecture and TDD. It features unit, integration, and functional testing, CI/CD with GitHub Actions, and secure deployment on \
            AWS. Also implementing HTTPS, rate limiting via NGINX, and Hapi Swagger documentation were implemented to ensure security.",
      repository: "https://github.com/bwbayu/forum-api",
      web_url: "",
      role: ["Back-End Developer"],
      tech: [
        {
          name: "Amazon Web Services (AWS)",
          iconClass:
            "devicon-amazonwebservices-plain-wordmark colored text-3xl",
        },
        {
          name: "PostgreSQL",
          iconClass: "devicon-postgresql-plain colored text-3xl",
        },
        {
          name: "Node.js",
          iconClass: "devicon-nodejs-plain-wordmark colored text-3xl",
        },
        {
          name: "JavaScript",
          iconClass: "devicon-javascript-plain colored text-3xl",
        },
      ],
      category: ["Web"],
    },
    {
      name: "Product Clustering and Recommendation System",
      date: "Nov - Dec 2024",
      description:
        "Developed for the Hology Data Mining 2024 Final, this system addressed product categorization issues in an e-commerce \
            marketplace. Using TF-IDF, SentenceTransformer, and POS tagging, the project improved product discoverability by clustering over \
            516 categories and building a recommendation system to enhance user experience.",
      repository: "https://github.com/bwbayu/product_name_clustering",
      web_url: "",
      role: ["Data Scientist"],
      tech: [
        {
          name: "Python",
          iconClass: "devicon-python-plain colored text-3xl",
        },
        {
          name: "Numpy",
          iconClass: "devicon-numpy-plain colored text-3xl",
        },
        {
          name: "Pandas",
          iconClass: "devicon-pandas-plain colored text-3xl",
        },
        {
          name: "Scikit-Learn",
          iconClass: "devicon-scikitlearn-plain colored text-3xl",
        },
      ],
      category: ["Data/ML"],
    },
    {
      name: "Clothing Multi-Label Classification",
      date: "Oct - Oct 2024",
      description:
        "Developed for the Hology Data Mining 2024 Preliminary, this project fine-tuned a Vision Transformer (ViT) for multi-label \
            classification to predict clothing type and color. Achieving an Exact Match Ratio (EMR) of 0.9829, the project secured a \
            top-8 position out of 196 teams, showcasing its high accuracy and innovative approach.",
      repository:
        "https://github.com/Khaairi/Clothing_Multilabel_Classification",
      web_url: "",
      role: ["Machine Learning Engineer"],
      tech: [
        {
          name: "PyTorch",
          iconClass: "devicon-pytorch-original colored text-3xl",
        },
        {
          name: "Python",
          iconClass: "devicon-python-plain colored text-3xl",
        },
        {
          name: "Numpy",
          iconClass: "devicon-numpy-plain colored text-3xl",
        },
        {
          name: "Pandas",
          iconClass: "devicon-pandas-plain colored text-3xl",
        },
        {
          name: "Scikit-Learn",
          iconClass: "devicon-scikitlearn-plain colored text-3xl",
        },
      ],
      banner: "",
      category: ["Data/ML"],
    },
    {
      name: "AI-Powered Job Matching Platform with Vector Search",
      date: "Jul 2024 - Sep 2024",
      description:
        "Developed for the Compfest AI Innovation Challenges 2024 Preliminary, this AI-driven platform simplifies job matching \
            for IT professionals by leveraging vector search and a fine-tuned SBERT model. It features resume upload, real-time job recommendations, \
            and advanced similarity matching, powered by Zilliz Milvus and custom datasets of 85,000 entries.",
      repository: "https://github.com/bwbayu/JobFitte",
      web_url: "",
      role: ["Full-Stack Developer", "Machine Learning Engineer"],
      tech: [
        {
          name: "React",
          iconClass: "devicon-react-original colored text-3xl",
        },
        {
          name: "Docker",
          iconClass: "devicon-docker-plain colored text-3xl",
        },
        {
          name: "Flask",
          iconClass: "devicon-flask-original colored text-3xl",
        },
        {
          name: "Google Cloud Platform (GCP)",
          iconClass: "devicon-googlecloud-plain colored text-3xl",
        },
        {
          name: "Python",
          iconClass: "devicon-python-plain colored text-3xl",
        },
        {
          name: "Numpy",
          iconClass: "devicon-numpy-plain colored text-3xl",
        },
        {
          name: "Pandas",
          iconClass: "devicon-pandas-plain colored text-3xl",
        },
        {
          name: "Scikit-Learn",
          iconClass: "devicon-scikitlearn-plain colored text-3xl",
        },
      ],
      banner: "",
      category: ["Web", "Data/ML"],
    },
    {
      name: "Open Music API",
      date: "Jul - Sep 2024",
      description:
        "As part of Dicoding AWS Back-End Developer Academy scholarship, this API manages music and playlists using Node.js \
            and AWS. Key features include user authentication with JWT, data export via RabbitMQ, file storage on Amazon S3, and caching with \
            Redis for optimal performance.",
      repository: "https://github.com/bwbayu/openmusic-api",
      web_url: "",
      role: ["Back-End Developer"],
      tech: [
        {
          name: "Node.js",
          iconClass: "devicon-nodejs-plain-wordmark colored text-3xl",
        },
        {
          name: "JavaScript",
          iconClass: "devicon-javascript-plain colored text-3xl",
        },
        {
          name: "PostgreSQL",
          iconClass: "devicon-postgresql-plain colored text-3xl",
        },
        {
          name: "Amazon Web Services (AWS)",
          iconClass:
            "devicon-amazonwebservices-plain-wordmark colored text-3xl",
        },
      ],
      banner: "",
      category: ["Web"],
    },
    {
      name: "Online Gambling Advertisement Classification",
      date: "Sep 2023 - Jan 2024",
      description:
        "This project utilized ResNet-50V2 to classify online gambling advertisements with 98.36% accuracy. \
            By applying data augmentation and fine-tuning, it effectively addressed the growing issue of gambling-related content in digital marketing.",
      repository:
        "https://github.com/bwbayu/Deep-Learning-Projects/tree/main/Image-Classification/Classification%20of%20online%20gambling%20advertisements",
      web_url: "",
      role: ["Machine Learning Engineer"],
      tech: [
        {
          name: "Python",
          iconClass: "devicon-python-plain colored text-3xl",
        },
        {
          name: "Numpy",
          iconClass: "devicon-numpy-plain colored text-3xl",
        },
        {
          name: "Pandas",
          iconClass: "devicon-pandas-plain colored text-3xl",
        },
        {
          name: "Scikit-Learn",
          iconClass: "devicon-scikitlearn-plain colored text-3xl",
        },
      ],
      banner: "",
      category: ["Data/ML"],
    },
    {
      name: "Peer-to-Peer Lending Application",
      date: "Feb - Jun 2023",
      description:
        "Developed a mobile app using Flutter and FastAPI to connect UMKM with investors. The app features registration, \
            loan tracking, payment systems, and fund management, simplifying access to financial resources and promoting business growth.",
      repository: "https://github.com/bwbayu/P2P_Lending_App_Flutter",
      web_url: "",
      role: ["Full-Stack Developer"],
      tech: [
        {
          name: "FastAPI",
          iconClass: "devicon-fastapi-plain colored text-3xl",
        },
        {
          name: "SQLite",
          iconClass: "devicon-sqlite-plain colored text-3xl",
        },
        {
          name: "Flutter",
          iconClass: "devicon-flutter-plain colored text-3xl",
        },
      ],
      banner: "",
      category: ["Mobile"],
    },
    {
      name: "Web Based Inventory System",
      date: "Feb 2023 - Jun 2023",
      description:
        "Developed for PT. Husker Anugerah Jaya, this Laravel-based inventory system tracks daily material usage, \
            production output, and sales. It integrates Laravel features like Seeder, Migration, and Eloquent ORM for efficient database \
            management and a user-friendly interface.",
      repository: "https://github.com/bwbayu/Web_Inventaris",
      web_url: "",
      role: ["Full-Stack Developer"],
      tech: [
        {
          name: "PHP",
          iconClass: "devicon-php-plain colored text-3xl",
        },
        {
          name: "Laravel",
          iconClass: "devicon-laravel-original colored text-3xl",
        },
        {
          name: "MySQL",
          iconClass: "devicon-mysql-original colored text-3xl",
        },
      ],
      banner: "",
      category: ["Web"],
    },
  ];
};
