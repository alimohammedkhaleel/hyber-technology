import { apiClient } from './client';
import { CarouselSlide } from '../../types';

export const carouselService = {
  async getActiveSlides(): Promise<CarouselSlide[]> {
    const res = await apiClient.get('/carousel');
    return res.data?.data?.slides || [];
  },
};
