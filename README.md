
# Jerlshin J G | Professional AI Research Portfolio

A modern, high-performance personal portfolio website built with **React 19**, **Vite**, and **Tailwind CSS 4.0**. This repository showcases the research, publications, and professional journey of Jerlshin J G, an AI Researcher specializing in Multimodal Intelligence and RAG systems.

## 🚀 Key Features

* **Modern Tech Stack**: Leverages the latest React 19 features and Vite 7 for lightning-fast development and optimized production builds.
* **Next-Gen Styling**: Built with Tailwind CSS 4.0 and PostCSS, utilizing modern CSS variables and a utility-first approach.
* **Dynamic Data Management**: All portfolio content (Experience, Education, Projects, Publications) is decoupled from the UI and managed through a central `portfolioData.json` file for easy updates.
* **Interactive Terminal Hero**: Features a custom-built, responsive terminal interface that simulates a developer environment.
* **Smooth UX**: Includes scroll-linked animations, dark/light mode persistence, and a fully responsive layout optimized for all devices.

## 🛠️ Technology Stack

* **Framework**: [React 19](https://react.dev/)
* **Build Tool**: [Vite 7](https://vitejs.dev/)
* **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Code Quality**: [ESLint 9](https://eslint.org/)

## 📂 Project Structure

```text
├── public/                # Static assets (favicon, global icons)
├── src/
│   ├── assets/            # Project-specific images and SVG assets
│   ├── portfolioData.json # CENTRAL SOURCE OF TRUTH: Edit this to update content
│   ├── App.jsx            # Main application logic and section components
│   ├── main.jsx           # Application entry point
│   └── index.css          # Tailwind 4.0 directives and custom animations
├── tailwind.config.js     # Tailwind configuration (selector-based dark mode)
└── vite.config.js         # Vite configuration with React plugin

```

## ⚡ Getting Started

### Prerequisites

* **Node.js**: v20.19.0 or higher
* **npm** or **yarn**

### Installation

1. **Clone the repository:**
```bash
git clone [https://github.com/jerlshin/jerlshin-profile.git](https://github.com/jerlshin/jerlshin-profile.git)
cd jerlshin-profile

```


2. **Install dependencies:**
```bash
npm install

```


3. **Start the development server:**
```bash
npm run dev

```


4. **Build for production:**
```bash
npm run build

```



## 📝 Updating Portfolio Content

To update your profile information, you do not need to touch the component code. Simply edit `src/portfolioData.json`. The application is designed to dynamically render:

* **Profile**: Name, role, social links, and bio.
* **Experience**: Company names, roles, durations, and key achievements.
* **Education**: Degrees, institutions, and CGPA.
* **Publications**: Titles, descriptions, and publication status (e.g., "Under Review").
* **Skills**: Category-wise technical competencies.

## 📄 License

This project is intended for personal portfolio use. All rights reserved by the author.

---


```
