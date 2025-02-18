
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import ProductForm from '@/components/product-form';
import { Button } from '@/components/ui/button';

export default function AdminPanel() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/products'],
    queryFn: () => apiRequest('GET', '/api/products')
  });

  const deleteProduct = async (id: number) => {
    await apiRequest('DELETE', `/api/products/${id}`);
  };

  if (!isLoading && !products) {
    return <div>Not authorized</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      
      <div className="mb-8">
        <h2 className="text-xl mb-4">Add New Product</h2>
        <ProductForm />
      </div>

      <div>
        <h2 className="text-xl mb-4">Manage Products</h2>
        <div className="grid gap-4">
          {products?.data.map((product: any) => (
            <div key={product.id} className="flex items-center justify-between border p-4">
              <div>
                <h3>{product.name}</h3>
                <p>${product.price}</p>
              </div>
              <Button variant="destructive" onClick={() => deleteProduct(product.id)}>
                Delete
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
