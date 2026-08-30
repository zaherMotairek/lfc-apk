export type CmsSection = {
  id?: string;
  type: string;
  title?: string | null;
  subtitle?: string | null;
  content?: Record<string, unknown> | null;
  imageUrl?: string | null;
  sortOrder: number;
  isEnabled: boolean;
};

export type CmsPage = {
  code: string;
  title: string;
  isPublished: boolean;
  sections: CmsSection[];
};

export type PillarItem = {
  icon: string;
  title: string;
  description: string;
};

export type HighlightItem = {
  value: string;
  label: string;
};

export type CommitteeMember = {
  name: string;
  role: string;
  bio: string;
  initials?: string;
  email?: string;
};

export type ContactChannel = {
  icon: string;
  label: string;
  value: string;
  href?: string;
};
