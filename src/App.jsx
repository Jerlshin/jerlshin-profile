import React, { useState, useEffect } from 'react';
import { 
  Github, 
  Linkedin, 
  Mail, 
  MapPin, 
  ExternalLink, 
  BookOpen, 
  Award, 
  Code, 
  Cpu, 
  Brain, 
  GraduationCap, 
  Briefcase, 
  FileText, 
  Menu, 
  X,
  ChevronRight,
  Terminal,
  Sparkles,
  ArrowUpRight,
  Database,
  Network,
  Minus,
  Square,
  Sun,
  Moon,
  X as CloseIcon,
  ArrowUp
} from 'lucide-react';

// --- EMBEDDED DATA ---
const portfolioData = {
  "profile": {
    "name": "Jerlshin J G",
    "title": "AI Researcher | Multimodal Intelligence Specialist",
    "tagline": "Bridging scientific innovation with human well-being through trustworthy, multimodal AI.",
    "location": "Tirupathur, Tamil Nadu, India",
    "email": "jerlshin.official008@gmail.com",
    "phone": "(+91) 6381900869",
    "website": "github.com/Jerlshin",
    "linkedin": "linkedin.com/in/jerlshin-j-g",
    "about": "AI researcher specializing in multimodal and human-centered intelligence, with expertise in deep learning, signal processing, and interpretable model design. Experienced in integrating physiological, visual, and linguistic modalities for healthcare and educational AI applications. Driven to advance trustworthy, transparent, and socially aligned AI."
  },
  "education": [
    {
      "degree": "B.Tech. in Computer Science and Engineering",
      "specialization": "Specialization in Artificial Intelligence and Robotics",
      "institution": "Vellore Institute of Technology",
      "location": "Chennai, India",
      "period": "2021 - 2025",
      "grade": "CGPA: 9.19",
      "thesis": "Hierarchical Deep Learning for Fine-Grained Seed Classification: A Self-Supervised and Mixture-of-Experts Approach"
    }
  ],
  "experience": [
    {
      "role": "Deep Learning Researcher",
      "company": "University of Augsburg",
      "location": "Augsburg, Germany",
      "period": "May 2025 - Oct 2025",
      "description": [
        "Conducted interdisciplinary research on multimodal gait analysis, integrating video-based pose estimation with wearable IMU and ECG data.",
        "Built a hybrid multimodal pipeline with advanced synchronization, ensuring high-fidelity temporal alignment between visual and sensor modalities.",
        "Collaborated with international researchers to refine modeling frameworks, contributing to a forthcoming publication on multimodal AI."
      ]
    },
    {
      "role": "Machine Learning Researcher",
      "company": "Nanyang Technological University (NTU)",
      "location": "Singapore",
      "period": "Oct 2024 - Oct 2025",
      "description": [
        "Pioneered a multimodal physiological signal analysis framework for educational assessment using ECG and GSR data across 73 participants.",
        "Designed robust preprocessing pipelines for signal synchronization, wavelet denoising, and normalization.",
        "Performed cross-subject validation and domain-shift analysis; manuscript currently under preparation."
      ]
    },
    {
      "role": "Artificial Intelligence Developer",
      "company": "Botter Solutions",
      "location": "Bangalore, India",
      "period": "May 2025 - July 2025",
      "description": [
        "Developed an end-to-end transformer-based AI pipeline for intelligent table recognition, improving processing throughput fivefold.",
        "Architected multi-cloud inference pipelines across Google Vertex AI, AWS SageMaker, and Azure ML.",
        "Integrated open-source models like MinerU and domain-specific LLMs within a multimodal document intelligence framework."
      ]
    },
    {
      "role": "AI & Machine Learning Intern",
      "company": "Tekaccel",
      "location": "Hyderabad, India",
      "period": "Aug 2025 - Oct 2025",
      "description": [
        "Engineered a LangGraph-based orchestration framework for dynamic narrative generation and context-aware AI interactions.",
        "Optimized RAG pipelines, reducing latency by 63% through GPU threading, Qdrant indexing, and Neo4j graph reasoning.",
        "Developed a multimodal avatar generation system synchronizing lip movement with speech."
      ]
    }
  ],
  "projects": [
    {
      "title": "Graph-Based Multi-Task Learning for Medical Image Analysis",
      "tech": ["Swin Transformers", "GATs", "GNNExplainer"],
      "description": "Developed an interpretable multi-task learning framework for skin lesion diagnosis using superpixel-based graph representations. Achieved state-of-the-art performance on the PH2 dataset."
    },
    {
      "title": "AI-Powered Adaptive Learning Device",
      "tech": ["LLMs", "LangChain", "Raspberry Pi", "Multimodal"],
      "description": "Led a team in developing a handheld device for adaptive learning. Integrated fine-tuned LLMs for contextual reasoning and deployed on Raspberry Pi clusters for distributed inference."
    },
    {
      "title": "AI-Powered Healthcare Communication Platform",
      "tech": ["LoRA-PEFT", "Multi-Agent", "Audio Understanding"],
      "description": "Built a real-time AI platform connecting patients and doctors. Orchestrated LoRA-PEFT tuning and multi-agent coordination for scalable, context-aware medical interactions."
    }
  ],
  "skills": {
    "Languages & Core": ["Python", "Java", "MATLAB", "SQL", "Bash", "Git", "Docker"],
    "Machine Learning": ["PyTorch", "TensorFlow", "Keras", "scikit-learn", "Hugging Face", "Optuna", "OpenCV"],
    "AI Frameworks": ["LangChain", "LangGraph", "Neo4j", "RAG", "Vertex AI", "AWS SageMaker", "Azure ML"],
    "Research Focus": ["Multimodal Learning", "Self-Supervised Learning", "Explainable AI (XAI)", "GNNs", "GANs", "NLP"]
  },
  "publications": [
    {
      "title": "Hierarchical Deep Learning for Fine-Grained Seed Classification: A Self-Supervised and Mixture-of-Experts Approach",
      "journal": "Expert Systems with Applications (Under Review)",
      "year": "2025",
      "authors": "Jerlshin J. G., et al."
    },
    {
      "title": "Seeing the Skin Deeper: Interpretable Multi-Task Framework for Skin Lesion Diagnosis using Superpixel Graphs",
      "journal": "IEEE Access (Under Review)",
      "year": "2025",
      "authors": "Jerlshin J. G., et al."
    },
    {
      "title": "A Vision Transformer Approach for Domain-based and General Human Action Recognition from Images",
      "journal": "Information Processing and Management (Under Review)",
      "year": "2025",
      "authors": "Sarkar R., Jerlshin J.G., et al."
    }
  ],
  "awards": [
    {
      "title": "Winner - GAVS Technologies Hackathon",
      "organization": "GAVS Technologies",
      "date": "May 2024",
      "desc": "Led team to 1st place developing an intelligent automation solution."
    },
    {
      "title": "Finalist - BITS Pilani Open Challenge",
      "organization": "BITS Pilani",
      "date": "Jan 2025",
      "desc": "5th place nationwide among 2,500+ participants."
    },
    {
      "title": "Program Representative",
      "organization": "VIT Dept of CS",
      "date": "2022",
      "desc": "Elected to coordinate academic activities and student-faculty communication."
    }
  ]
};

// --- STYLES & ANIMATIONS ---
const styles = `
  @keyframes fade-in-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes blob {
    0% { transform: translate(0px, 0px) scale(1); }
    33% { transform: translate(30px, -50px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
    100% { transform: translate(0px, 0px) scale(1); }
  }
  
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-15px); }
    100% { transform: translateY(0px); }
  }

  .animate-fade-in-up {
    animation: fade-in-up 0.8s ease-out forwards;
  }
  
  .animate-blob {
    animation: blob 7s infinite;
    will-change: transform;
  }
  
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }

  .bg-grid-pattern {
    background-image: linear-gradient(to right, rgba(99, 102, 241, 0.05) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(99, 102, 241, 0.05) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  .animate-blink {
    animation: blink 1s step-end infinite;
  }

  /* Scroll Progress Bar */
  .scroll-progress {
    position: fixed;
    top: 0;
    left: 0;
    width: 0%;
    height: 3px;
    background: linear-gradient(to right, #6366f1, #a855f7);
    z-index: 9999;
    transition: width 0.1s;
  }

  .animation-delay-2000 { animation-delay: 2s; }
  .animation-delay-4000 { animation-delay: 4s; }
`;

// --- COMPONENTS ---

const ScrollProgress = () => {
  const [scrollWidth, setScrollWidth] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollWidth(scrolled);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return <div className="scroll-progress" style={{ width: `${scrollWidth}%` }}></div>;
};

const SectionTitle = ({ icon: Icon, title, subtitle }) => (
  <div className="mb-8 md:mb-12 animate-fade-in-up px-2 sm:px-0">
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-800/50">
        <Icon size={24} />
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
    </div>
    {subtitle && (
      <p className="text-slate-500 dark:text-slate-400 ml-12 md:ml-14 text-base md:text-lg max-w-2xl font-light leading-relaxed">
        {subtitle}
      </p>
    )}
  </div>
);

const TechBadge = ({ children }) => (
  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 whitespace-nowrap">
    {children}
  </span>
);

const ExperienceCard = ({ role, company, location, period, description }) => (
  <div className="relative pl-6 md:pl-8 pb-12 border-l-2 border-indigo-100 dark:border-slate-800 last:pb-0 last:border-l-0 group">
    {/* Node */}
    <div className="absolute -left-[9px] top-0 w-[18px] h-[18px] rounded-full bg-white dark:bg-slate-900 border-4 border-indigo-500 transition-all duration-300 group-hover:scale-125 group-hover:border-indigo-400 shadow-sm z-10"></div>
    
    <div className="group-hover:translate-x-1 transition-transform duration-300 ease-out">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mb-3">
        <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {role}
        </h3>
        <span className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full w-fit mt-2 sm:mt-0 border border-slate-200 dark:border-slate-700">
          {period}
        </span>
      </div>
      
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4 text-sm text-slate-600 dark:text-slate-400 font-medium">
        <div className="flex items-center gap-1.5">
          <Briefcase size={14} className="text-indigo-500" />
          <span>{company}</span>
        </div>
        <span className="hidden sm:inline text-slate-300">•</span>
        <div className="w-full sm:w-auto flex items-center gap-1.5 text-slate-500">
          <MapPin size={12} className="inline sm:hidden" />
          <span>{location}</span>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800/40 backdrop-blur-sm p-5 md:p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-lg transition-all duration-300">
        <ul className="space-y-3">
          {description.map((item, idx) => (
            <li key={idx} className="flex gap-3 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              <span className="mt-2 min-w-[6px] h-[6px] rounded-full bg-indigo-400/80 shrink-0"></span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

const ProjectCard = ({ title, tech, description }) => (
  <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-500/30 dark:hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col overflow-hidden active:scale-[0.98] md:active:scale-100">
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
    
    <div className="relative p-6 flex flex-col h-full z-10">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-100 dark:ring-indigo-500/20">
          <Code size={24} />
        </div>
        <ExternalLink size={18} className="text-slate-400 hover:text-indigo-500 cursor-pointer transition-colors p-1" />
      </div>
      
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {title}
      </h3>
      
      <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed flex-grow">
        {description}
      </p>
      
      <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-slate-700/50">
        {tech.map((t, i) => (
          <TechBadge key={i}>{t}</TechBadge>
        ))}
      </div>
    </div>
  </div>
);

const PublicationItem = ({ title, journal, year, authors }) => (
  <div className="group flex flex-col sm:flex-row gap-5 p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg transition-all duration-300 relative overflow-hidden active:scale-[0.99] md:active:scale-100">
    <div className="absolute inset-0 bg-slate-50 dark:bg-slate-700/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    
    <div className="mt-1 w-12 h-12 shrink-0 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform relative z-10">
      <FileText size={24} />
    </div>
    <div className="relative z-10 flex-1">
      <h4 className="font-bold text-slate-900 dark:text-white leading-snug text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {title}
      </h4>
      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-600 dark:text-slate-400">
        <span className="font-semibold px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 rounded text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 text-xs">
          {year}
        </span>
        <span className="font-medium text-slate-800 dark:text-slate-200 border-b border-dotted border-slate-400">
          {journal}
        </span>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-500 mt-2 italic font-serif">
        {authors}
      </p>
    </div>
  </div>
);

// --- MAIN APP ---

const App = () => {
  const [activeSection, setActiveSection] = useState('about');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  // FORCE LIGHT MODE BY DEFAULT
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  // Handle scroll for navbar glass effect and Back to Top
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const navLinks = [
    { id: 'about', label: 'About' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Projects' },
    { id: 'research', label: 'Research' },
    { id: 'skills', label: 'Skills' },
  ];

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(id);
      setIsMenuOpen(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900/50 overflow-x-hidden relative transition-colors duration-300">
      <style>{styles}</style>
      <ScrollProgress />
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-40 dark:opacity-[0.03]"></div>
        <div className="absolute top-0 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-indigo-500/20 rounded-full mix-blend-multiply filter blur-[80px] md:blur-[100px] opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-purple-500/20 rounded-full mix-blend-multiply filter blur-[80px] md:blur-[100px] opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-blue-500/20 rounded-full mix-blend-multiply filter blur-[80px] md:blur-[100px] opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating Navbar */}
      <nav className={`fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] sm:w-[90%] max-w-5xl transition-all duration-300 rounded-full ${
        scrolled ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 py-2.5 px-4 md:px-6' : 'bg-transparent py-4 px-2 sm:px-0'
      }`}>
        <div className="flex items-center justify-between">
          <div 
            className="font-bold text-xl tracking-tight text-slate-900 dark:text-white cursor-pointer flex items-center gap-2 group select-none" 
            onClick={() => window.scrollTo(0,0)}
          >
            <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Terminal size={16} strokeWidth={2.5} className="md:w-[18px] md:h-[18px]" />
            </div>
            <span className="hidden xs:inline">Jerlshin<span className="text-indigo-600 dark:text-indigo-400">.ai</span></span>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-1 bg-white/60 dark:bg-slate-800/60 rounded-full p-1 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                    activeSection === link.id 
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 transition-all active:scale-95 hover:scale-105 shadow-sm"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon size={18} className="fill-slate-600/10 dark:fill-none" />
                ) : (
                  <Sun size={18} className="fill-slate-400/10 text-amber-400" />
                )}
              </button>

              <div className="hidden sm:flex">
                 <a href={`mailto:${portfolioData.profile.email}`} className="p-2.5 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 transition-all active:scale-95 shadow-sm">
                   <Mail size={18} />
                 </a>
              </div>

              {/* Mobile Menu Toggle */}
              <button 
                className="md:hidden p-2.5 text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 rounded-full backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm active:scale-95 transition-transform"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle Menu"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-[calc(100%+12px)] left-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-2xl flex flex-col gap-1 md:hidden animate-fade-in-up origin-top z-50">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="w-full text-left px-5 py-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-medium transition-colors active:bg-indigo-50 dark:active:bg-indigo-900/20 active:text-indigo-600"
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 md:pt-48 pb-16 md:pb-24 px-6 max-w-7xl mx-auto z-10">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 lg:items-center">
          <div className="flex-1 space-y-6 md:space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 md:px-5 md:py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-indigo-700 dark:text-indigo-300 text-xs md:text-sm font-semibold border border-indigo-100 dark:border-indigo-500/30 shadow-sm">
              <span className="relative flex h-2 md:h-2.5 w-2 md:w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 md:h-2.5 w-2 md:w-2.5 bg-indigo-500"></span>
              </span>
              Open to Research Collaborations
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] md:leading-[1.1]">
              Hello, I'm <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 bg-[length:200%_auto] animate-gradient pb-2 inline-block">
                {portfolioData.profile.name}
              </span>
            </h1>
            
            <p className="text-lg md:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed font-light">
              {portfolioData.profile.title}
            </p>
            
            <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl border-l-4 border-indigo-200 dark:border-slate-700 pl-4 md:pl-6">
              {portfolioData.profile.tagline}
            </p>

            <div className="flex flex-wrap gap-3 md:gap-4 pt-4">
              <a href={`mailto:${portfolioData.profile.email}`} className="w-full sm:w-auto text-center group flex justify-center items-center gap-3 px-6 py-3.5 md:px-8 md:py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all duration-300 ring-4 ring-transparent hover:ring-indigo-500/20 dark:hover:ring-white/20 active:scale-95">
                Contact Me
                <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </a>
              <a href={`https://${portfolioData.profile.linkedin}`} target="_blank" rel="noreferrer" className="w-full sm:w-auto text-center flex justify-center items-center gap-3 px-6 py-3.5 md:px-8 md:py-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-full font-bold hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 shadow-sm hover:shadow-lg active:scale-95">
                <Linkedin size={18} />
                LinkedIn
              </a>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 text-sm text-slate-500 dark:text-slate-500 pt-6 border-t border-slate-200/60 dark:border-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
                   <MapPin size={14} />
                </div>
                {portfolioData.profile.location}
              </div>
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
                   <Github size={14} />
                </div>
                <a href={`https://${portfolioData.profile.website}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">github.com/Jerlshin</a>
              </div>
            </div>
          </div>
          
          {/* Hero Visual - Responsive Terminal */}
          <div className="w-full lg:w-[45%] relative animate-fade-in-up animation-delay-2000 perspective-1000 mt-8 lg:mt-0">
             <div className="absolute -top-12 -right-8 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xl animate-float z-20 border border-slate-100 dark:border-slate-700 hidden xl:block">
                <Brain size={32} className="text-purple-500" />
             </div>
             <div className="absolute -bottom-8 -left-8 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xl animate-float-delayed z-20 border border-slate-100 dark:border-slate-700 hidden xl:block">
                <Database size={32} className="text-blue-500" />
             </div>

             <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-lg opacity-30 dark:opacity-50"></div>
             
             <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden border border-white/50 dark:border-slate-700/50 font-mono text-sm transform transition-transform hover:scale-[1.01] duration-500">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200/60 dark:border-slate-700/60 backdrop-blur-md">
                   <div className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-medium select-none flex items-center gap-2">
                     <Terminal size={12} className="text-slate-400" />
                     jerlshin@portfolio: ~/research
                   </div>
                   <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
                   </div>
                </div>
                
                <div className="p-3 sm:p-4 text-slate-700 dark:text-slate-300 min-h-[260px] sm:min-h-[340px] flex flex-col bg-white/40 dark:bg-slate-900/40">
                   <div className="flex flex-wrap gap-2 mb-4 text-[11px] sm:text-[13px]">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">jerlshin@portfolio</span>:<span className="text-blue-600 dark:text-blue-400 font-bold">~/research</span>$ vim profile.py
                   </div>

                   <div className="flex-grow font-mono text-[11px] sm:text-[13px] leading-6 font-medium overflow-x-auto">
                     {[
                       { num: 1, content: null },
                       { num: 2, content: <div className="flex"><span className="text-rose-600 dark:text-rose-400 font-bold mr-2">class</span><span className="text-amber-600 dark:text-amber-400 font-bold">Researcher</span>:</div> },
                       { num: 3, content: <div className="pl-4 flex"><span className="text-rose-600 dark:text-rose-400 font-bold mr-2">def</span><span className="text-teal-600 dark:text-teal-400 font-bold">__init__</span><span className="text-slate-700 dark:text-slate-300">(self):</span></div> },
                       { num: 4, content: <div className="pl-8 text-slate-700 dark:text-slate-300">self.name = <span className="text-emerald-600 dark:text-emerald-400">"{portfolioData.profile.name}"</span></div> },
                       { num: 5, content: <div className="pl-8 text-slate-700 dark:text-slate-300">self.focus = [<span className="text-emerald-600 dark:text-emerald-400">"Multimodal AI"</span>, <span className="text-emerald-600 dark:text-emerald-400">"Healthcare"</span>]</div> },
                       { num: 6, content: <div className="pl-8 text-slate-700 dark:text-slate-300">self.passion = <span className="text-emerald-600 dark:text-emerald-400">"Human-Centered Intelligence"</span></div> },
                       { num: 7, content: null },
                       { num: 8, content: <div className="pl-4 mt-1 flex"><span className="text-rose-600 dark:text-rose-400 font-bold mr-2">async def</span><span className="text-teal-600 dark:text-teal-400 font-bold">innovate</span><span className="text-slate-700 dark:text-slate-300">(self):</span></div> },
                       { num: 9, content: <div className="pl-8 text-slate-700 dark:text-slate-300"><span className="text-rose-600 dark:text-rose-400 mr-2">while</span><span className="text-indigo-600 dark:text-indigo-400">True</span>:</div> },
                       { num: 10, content: <div className="pl-12 text-slate-700 dark:text-slate-300"><span className="text-rose-600 dark:text-rose-400 mr-2">await</span>self.research(<span className="text-emerald-600 dark:text-emerald-400">"New Frontiers"</span>)</div> },
                       { num: 11, content: <div className="pl-12 text-slate-400 dark:text-slate-500 italic mt-1 flex items-center gap-2"># Always learning...<span className="w-2 h-4 bg-slate-400/50 animate-blink"></span></div> },
                       { num: 12, content: null }
                     ].map((line, idx) => (
                       <div key={idx} className="flex">
                         <div className="w-6 sm:w-8 border-r border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 text-right pr-2 sm:pr-3 select-none text-[10px] sm:text-xs leading-6">
                           {line.num}
                         </div>
                         <div className="pl-2 sm:pl-4 flex-1 whitespace-nowrap">
                           {line.content || <div className="h-6"></div>}
                         </div>
                       </div>
                     ))}
                   </div>
                </div>

                <div className="bg-slate-200/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 px-3 py-1.5 text-[10px] sm:text-xs flex justify-between font-bold border-t border-slate-300/50 dark:border-slate-700/50 backdrop-blur-md">
                  <div className="flex gap-4">
                      <span className="bg-indigo-500 text-white px-2 rounded-sm shadow-sm hidden sm:inline">NORMAL</span>
                      <span className="flex items-center gap-1"><FileText size={10} /> profile.py</span>
                  </div>
                  <div className="flex gap-2 sm:gap-4 text-slate-500 dark:text-slate-500">
                      <span>utf-8</span>
                      <span>python</span>
                      <span>100%</span>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 space-y-20 md:space-y-32 pb-20 md:pb-32 z-10 relative">
        <section id="about" className="scroll-mt-28 md:scroll-mt-32">
          <SectionTitle 
            icon={Brain} 
            title="About Me" 
            subtitle="I sit at the intersection of complex algorithms and real-world human needs."
          />
          <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 md:p-12 shadow-xl border border-white/20 dark:border-slate-700/50 relative overflow-hidden group hover:border-indigo-500/30 transition-colors duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-500"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors duration-500"></div>
            <p className="text-base md:text-xl leading-loose text-slate-700 dark:text-slate-200 relative z-10 font-light text-justify">
              {portfolioData.profile.about}
            </p>
          </div>
        </section>

        <section id="experience" className="scroll-mt-28 md:scroll-mt-32">
          <SectionTitle 
            icon={Briefcase} 
            title="Research & Experience"
            subtitle="A timeline of my contributions to academic and industrial AI labs."
          />
          <div className="space-y-0 max-w-5xl">
            {portfolioData.experience.map((job, index) => (
              <ExperienceCard key={index} {...job} />
            ))}
          </div>
        </section>

        <section id="projects" className="scroll-mt-28 md:scroll-mt-32">
          <SectionTitle 
            icon={Code} 
            title="Selected Projects" 
            subtitle="Showcasing innovation in multimodal learning and orchestrating AI pipelines."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {portfolioData.projects.map((project, index) => (
              <ProjectCard key={index} {...project} />
            ))}
          </div>
        </section>

        <section id="research" className="scroll-mt-28 md:scroll-mt-32">
          <SectionTitle 
            icon={BookOpen} 
            title="Publications" 
            subtitle="Peer-reviewed contributions to the scientific community."
          />
          <div className="grid gap-4 md:gap-6 max-w-5xl">
            {portfolioData.publications.map((pub, index) => (
              <PublicationItem key={index} {...pub} />
            ))}
          </div>
        </section>

        <section id="skills" className="scroll-mt-28 md:scroll-mt-32">
          <SectionTitle icon={Cpu} title="Technical Arsenal" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
            {Object.entries(portfolioData.skills).map(([category, skills]) => (
              <div key={category} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 bg-indigo-500 rounded-full group-hover:scale-y-125 transition-transform"></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{category}</h3>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {skills.map((skill) => (
                    <span 
                      key={skill} 
                      className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-indigo-200 transition-colors cursor-default"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 scroll-mt-28 md:scroll-mt-32">
          <div>
             <div className="flex items-center gap-3 mb-6 md:mb-8">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800/50">
                  <GraduationCap size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Education</h2>
             </div>
             
             {portfolioData.education.map((edu, index) => (
               <div key={index} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors"></div>
                 <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-2">{edu.degree}</h3>
                 <p className="text-emerald-600 dark:text-emerald-400 font-medium mb-1 text-sm md:text-base">{edu.institution}</p>
                 <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                    {edu.period} 
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                    {edu.grade}
                 </p>
                 
                 <div className="p-4 md:p-5 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                    <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                      <span className="font-semibold not-italic text-emerald-700 dark:text-emerald-400 block mb-1">Thesis Topic:</span>
                      "{edu.thesis}"
                    </p>
                 </div>
               </div>
             ))}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800/50">
                <Award size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Honors & Awards</h2>
            </div>
            
            <div className="space-y-4 md:space-y-6">
              {portfolioData.awards.map((award, index) => (
                <div key={index} className="flex gap-4 md:gap-5 items-start p-5 md:p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
                   <div className="mt-1 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-full text-amber-500 group-hover:scale-110 transition-transform shrink-0">
                      <Sparkles size={16} />
                   </div>
                   <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base md:text-lg leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{award.title}</h4>
                      <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 mt-1">{award.organization} • {award.date}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{award.desc}</p>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* Back to Top Button */}
      <button 
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 p-3 bg-indigo-600 text-white rounded-full shadow-lg transition-all duration-300 z-50 hover:bg-indigo-700 active:scale-95 ${showBackToTop ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}
        aria-label="Back to top"
      >
        <ArrowUp size={20} />
      </button>

      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-12 md:py-16 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left space-y-2">
              <h3 className="font-bold text-2xl tracking-tight text-slate-900 dark:text-white">Jerlshin J G</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs leading-relaxed">
                Building the future of AI with transparency, ethics, and human-centric design.
              </p>
            </div>
            
            <div className="flex gap-4">
               {[
                 { icon: Mail, href: `mailto:${portfolioData.profile.email}` },
                 { icon: Linkedin, href: `https://${portfolioData.profile.linkedin}` },
                 { icon: Github, href: `https://${portfolioData.profile.website}` }
               ].map((item, i) => (
                 <a 
                    key={i}
                    href={item.href} 
                    className="p-3.5 rounded-full bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all border border-slate-200 dark:border-slate-800 hover:border-indigo-200 active:scale-95"
                  >
                   <item.icon size={20} />
                 </a>
               ))}
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
            <p>© {new Date().getFullYear()} Jerlshin J G. All Rights Reserved.</p>
            <p className="flex items-center gap-2">
              Designed with <span className="text-red-500">♥</span> and React
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;