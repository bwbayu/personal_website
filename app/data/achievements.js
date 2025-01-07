export const getAchievementsData = async () => {
    return ([
        {
            event: "Hology 7.0 ",
            organization: "Universitas Brawijaya",
            achievement: "Finalist of Data Mining",
            date: "Sep - Nov 2024",
            description: [
                "Secured a top-8 position out of 196 teams in a national-level competition organized by Universitas Brawijaya.",
                "Preliminary Round: Fine-tuned a Vision Transformer (ViT) model for multi-label classification of T-shirts and hoodies, \
                achieving an Exact Match Ratio (EMR) of 0.982905.",
                "Final Round: Designed a clustering and recommendation system for an e-commerce marketplace, \
                preprocessing noisy product names and grouping over 516 categories using TF-IDF and SentenceTransformer, \
                improving product discoverability and user experience"
            ],
            repository: [
                "https://github.com/Khaairi/Clothing_Multilabel_Classification",
                "https://github.com/bwbayu/product_name_clustering"
            ],
            url: "https://drive.google.com/file/d/1ZKR3dyi-KT5cVQpkSHw_R04uYhVY6r_Q/view?usp=sharing",
        },
        {
            event: "Compfest 16",
            organization: "Universitas Indonesia",
            achievement: "Participant of AI Innovation Challenge",
            date: "Jul - Sep 2024",
            description: ["Developed an AI-driven web platform to streamline the job search process for IT \
            professionals by matching resumes with job descriptions using vector similarity. The system utilizes \
            advanced vector search technology to retrieve the most relevant job descriptions based on candidate skills. \
            Key features include resume upload, real-time job recommendations, and high-quality job-resume matching powered \
            by a fine-tuned SBERT model."],
            repository: ["https://github.com/bwbayu/JobFitte"],
            url: "https://drive.google.com/file/d/1HaUS9mij45Q5snB7iLIIvtnNYt45p5pP/view?usp=sharing",
        },
        {
            event: "DIMAS-TI 2022",
            organization: "Asosiasi MIPA LPTK Indonesia (AMLI)",
            achievement: "3rd place in Competitive Programming",
            date: "Juni 2022",
            url: "https://drive.google.com/file/d/1vVcYB3nYw3RFRit4k-NshFTb_RVhkQRC/view?usp=sharing",
        },
    ]);
};