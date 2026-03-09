// types/review.ts

export type ReviewStatus = 'in_processing' | 'accepted' | 'rejected';

export interface Review {
    id: number;
    user_id: number;
    rating: number;
    description: string;
    status: ReviewStatus;
    created_at: string;
    updated_at: string;
}

export interface ReviewsResponse {
    data: Review[];
    page: number;
    limit: number;
    total_count: number;
}

export interface ReviewsQueryParams {
    page: number;
    limit: number;
}
