/**
 * Fixtures de produtos/estoque — usados APENAS enquanto o módulo
 * `packages/api/inventory` não está plugado. Gated por
 * `NEXT_PUBLIC_USE_MOCKS`. Deletar quando pronto.
 */

export interface ProductFixture {
  id: string
  name: string
  sku: string
  price: number
  cost: number
  stock: number
  minStock: number
  category: string
}

export const MOCK_PRODUCTS: ProductFixture[] = [
  { id: '1', name: 'Pomada modeladora',    sku: 'PM001', price: 35, cost: 18, stock: 12, minStock: 5, category: 'Finalizador' },
  { id: '2', name: 'Shampoo profissional', sku: 'SH002', price: 45, cost: 22, stock: 3,  minStock: 5, category: 'Lavagem'     },
  { id: '3', name: 'Óleo de barba',        sku: 'OB003', price: 55, cost: 28, stock: 8,  minStock: 3, category: 'Barba'       },
  { id: '4', name: 'Condicionador',        sku: 'CD004', price: 38, cost: 19, stock: 15, minStock: 5, category: 'Lavagem'     },
  { id: '5', name: 'Cera de cabelo',       sku: 'CE005', price: 30, cost: 14, stock: 2,  minStock: 5, category: 'Finalizador' },
]

export function getInitialProducts(): ProductFixture[] {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'false') return []
  return MOCK_PRODUCTS
}
