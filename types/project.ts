export interface Project {
  id: number;
  title: string;
  description: string;
  images: string[] | null;
  links: string[] | null;
}

export interface ProjectsResponse {
  data: Project[];
  page: number;
  limit: number;
  total_count: number;
}

export interface ProjectInput {
  title: string;
  description: string;
  images: string[];
  links: string[];
}
