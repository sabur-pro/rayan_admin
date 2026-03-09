// src/lib/review.ts
import { API_BASE_URL, fetchWithAuth } from '@/lib/http';
import type { ReviewsResponse, ReviewsQueryParams, ReviewStatus } from '../../types/review';

export async function getReviews(params: ReviewsQueryParams): Promise<ReviewsResponse> {
    const searchParams = new URLSearchParams();

    searchParams.set('page', String(params.page));
    searchParams.set('limit', String(params.limit));

    const url = `${API_BASE_URL}/review?${searchParams.toString()}`;

    const response = await fetchWithAuth(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Failed to fetch reviews: ${response.status} ${text}`);
    }

    return response.json();
}

export async function updateReviewStatus(
    reviewId: number,
    status: ReviewStatus
): Promise<void> {
    const url = `${API_BASE_URL}/review/${reviewId}`;

    const response = await fetchWithAuth(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    });

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Failed to update review: ${response.status} ${text}`);
    }
}
