export interface Project {
  id: string;
  name: string;
  repoName: string;
  title: string;
  shortDesc: string;
  description: string;
  primaryLanguage: 'Rust' | 'Python' | 'JavaScript' | 'TypeScript' | 'Shell';
  category: 'systems' | 'android' | 'ai' | 'tools';
  stars: number;
  featured: boolean;
  githubUrl: string;
  liveUrl?: string;
  tags: string[];
  highlights: string[];
  stats?: { label: string; value: string }[];
}

export interface SkillCategory {
  title: string;
  skills: {
    name: string;
    level: string;
    description: string;
    icon?: string;
  }[];
}

export interface GithubProfile {
  username: string;
  name: string;
  avatarUrl: string;
  htmlUrl: string;
  publicRepos: number;
  followers: number;
  following: number;
  bio: string;
}
