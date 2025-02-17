import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart } from "lucide-react";
import ProductGrid from "@/components/product-grid";
import CartSidebar from "@/components/cart-sidebar";
import ProductForm from "@/components/product-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import type { Product } from "@shared/schema";

interface ProductsResponse {
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data: response, isLoading } = useQuery<ProductsResponse>({
    queryKey: ["/api/products", { page }],
  });

  const products = response?.data ?? [];
  const pagination = response?.pagination;

  return (
    <div className="min-h-screen bg-background">
      {/* Skip link target */}
      <span id="main-content" tabIndex={-1} className="sr-only">
        Main content
      </span>

      {/* Header */}
      <header 
        className="border-b bg-gradient-to-r from-background to-primary/5" 
        role="banner"
      >
        <motion.div 
          className="container mx-auto px-4 py-6 flex justify-between items-center"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            E-Commerce Store
          </h1>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setIsCartOpen(true)}
              aria-label={`Open shopping cart`}
              aria-expanded={isCartOpen}
              className="flex items-center gap-2 hover:border-primary hover:text-primary transition-colors duration-300"
            >
              <ShoppingCart className="h-4 w-4" />
              Cart
            </Button>
            <Button
              onClick={() => setIsOpen(true)}
              aria-label="Add new product"
              aria-expanded={isOpen}
              className="hover:scale-105 active:scale-95 transition-transform duration-150"
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Add Product
            </Button>
          </div>
        </motion.div>
      </header>

      {/* Main content */}
      <main
        className="container mx-auto px-4 py-8"
        role="main"
        aria-busy={isLoading}
      >
        <ProductGrid products={products} isLoading={isLoading} />
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="hover:border-primary hover:text-primary transition-colors duration-300"
            >
              Previous
            </Button>
            <span className="flex items-center px-4 font-medium">
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="hover:border-primary hover:text-primary transition-colors duration-300"
            >
              Next
            </Button>
          </div>
        )}
      </main>

      {/* Product Form Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent aria-label="Add new product form">
          <ProductForm onSuccess={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Cart Sidebar */}
      <CartSidebar open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}