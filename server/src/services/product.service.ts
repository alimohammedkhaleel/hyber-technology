import { productRepository, ProductEntity, CategoryEntity } from '../repositories/product.repository';

export class ProductService {
  async getProducts(filters: {
    categoryId?: string;
    categorySlug?: string;
    brandId?: string;
    search?: string;
    featuredOnly?: boolean;
    availableOnly?: boolean;
    limit?: number;
    offset?: number;
  }) {
    return productRepository.findProducts(filters);
  }

  async getProductById(id: string): Promise<ProductEntity | null> {
    return productRepository.findById(id);
  }

  async getCategories(activeOnly: boolean = true): Promise<CategoryEntity[]> {
    return productRepository.getCategories(activeOnly);
  }

  async createProduct(data: Partial<ProductEntity>, adminUserId?: string) {
    return productRepository.createProduct(data, adminUserId);
  }

  async updateProduct(id: string, data: Partial<ProductEntity>, adminUserId?: string) {
    return productRepository.updateProduct(id, data, adminUserId);
  }

  async deleteProduct(id: string, adminUserId?: string) {
    return productRepository.deleteProduct(id, adminUserId);
  }

  async createCategory(data: Partial<CategoryEntity>) {
    return productRepository.createCategory(data);
  }

  async updateCategory(id: string, data: Partial<CategoryEntity>) {
    return productRepository.updateCategory(id, data);
  }

  async deleteCategory(id: string) {
    return productRepository.deleteCategory(id);
  }
}

export const productService = new ProductService();
