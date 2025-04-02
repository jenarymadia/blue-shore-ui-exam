export interface Vote {
  id: number;
  album_id: number;
  user_id: number;
  vote: 'up' | 'down';
  created_at: string;
  updated_at: string;
}

export interface Album {
  id: number;
  song_name: string;
  artist_name: string;
  album_cover: string | null;
  created_at: string;
  updated_at: string;
  votes: Vote[];
}

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface PaginatedAlbumResponse {
  current_page: number;
  data: Album[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: PaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export type VoteType = 'up' | 'down';

export interface VoteResponse {
  success: boolean;
  votes: Vote[];
}

export interface AlbumFilters {
  page: number;
  search: string;
}

// Type guard for checking if a user has admin role
export function isAdmin(user: any): boolean {
  return user?.role === 'admin';
}

// Helper function to calculate vote counts
export function calculateVoteCounts(votes: Vote[]): { up: number; down: number } {
  return votes.reduce(
    (acc, vote) => {
      if (vote.vote === 'up') acc.up++
      else if (vote.vote === 'down') acc.down++
      return acc
    },
    { up: 0, down: 0 }
  )
}