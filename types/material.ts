// types/material.ts

export interface MaterialType {
  material_type_id: number;
  lang_code: string;
  name: string;
  description: string;
  status: string;
}

export interface MaterialTypeResponse {
  data: MaterialType[];
  page: number;
  limit: number;
  total_count: number;
}

export interface MaterialTranslation {
  lang_code: string;
  name: string;
  description: string;
  paths: string[];
  status: string;
}

export interface Material {
  id: number;
  course: {
    id: number;
    number: number;
    degree: {
      id: number;
    };
  };
  semester: {
    id: number;
    number: number;
  };
  material_type: {
    id: number;
    lang_code: string;
    name: string;
    description: string;
    status: string;
  };
  created_at: string;
  updated_at: string;
  translations: MaterialTranslation[];
  subjects: Array<{
    id: number;
    translations: Array<{
      lang_code: string;
      name: string;
      description: string;
      status: string;
    }>;
  }>;
}

export interface MaterialResponse {
  data: Material[];
  page: number;
  limit: number;
  total_count: number;
}
