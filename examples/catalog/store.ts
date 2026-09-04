export type Product = { id: string; name: string; price: number; image: string; color: string; category: string; description: string };
export type CartLine = { productId: string; quantity: number; size?: string };
export type ShopState = { cart: CartLine[]; budget: number; lastChangedBy: 'shopper' | 'agent' };

const cdn = 'https://cdn.shopify.com/s/files/1/0748/3002/0662/files/';
export const products: Product[] = [
  { id: 'briskrun', name: 'BriskRun Jacket', price: 157, color: 'Grey', category: 'Outerwear', description: 'A lightweight running shell with a quiet woven finish and packable hood.', image: `${cdn}briskrun-jacket-unisex-88b464-main-grey.png?v=1787661204` },
  { id: 'orbitproof', name: 'OrbitProof Sweatshirt', price: 101, color: 'White', category: 'Sweats', description: 'Midweight loopback cotton built for warm-ups, travel, and everyday layering.', image: `${cdn}orbitproof-sweatshirt-youth-2226d1-main-white.png?v=1787411729` },
  { id: 'framepoint', name: 'FramePoint Tank', price: 45, color: 'Pink', category: 'Tops', description: 'A breathable performance tank with a close, movement-first fit.', image: `${cdn}framepoint-tank-unisex-237435-main-pink.png?v=1787410470` },
  { id: 'climbbeam', name: 'ClimbBeam Hoodie', price: 119, color: 'Orange', category: 'Sweats', description: 'A structured training hoodie with a soft brushed interior and deep hood.', image: `${cdn}climbbeam-hoodie-mens-fc66e1-main-orange.png?v=1787409781` },
  { id: 'vistamesh', name: 'VistaMesh Tee', price: 57, color: 'Black', category: 'Tops', description: 'An airy mesh training tee designed to stay comfortable through long sessions.', image: `${cdn}vistamesh-tee-womens-684491-main-black.png?v=1787408308` },
  { id: 'arcgauge', name: 'ArcGauge Jacket', price: 173, color: 'Yellow', category: 'Outerwear', description: 'Weather-ready outerwear with articulated sleeves and reflective detailing.', image: `${cdn}arcgauge-jacket-mens-0811c3-main-yellow.png?v=1786550621` },
  { id: 'voltcurrent', name: 'VoltCurrent Tank', price: 36, color: 'Grey', category: 'Tops', description: 'A minimal quick-dry tank for high-output training and warm-weather runs.', image: `${cdn}voltcurrent-tank-mens-d86de7-main-grey.png?v=1786483899` },
  { id: 'cadenceshift', name: 'CadenceShift Sweatshirt', price: 101, color: 'Blue', category: 'Sweats', description: 'A relaxed technical sweatshirt that moves easily between training and recovery.', image: `${cdn}cadenceshift-sweatshirt-unisex-244263-main-blue.png?v=1786376303` },
];

export const collections = ['All', 'Outerwear', 'Sweats', 'Tops'];

export function matchesProductQuery(product: Product, query: string) {
  const text = `${product.name} ${product.color} ${product.category}`.toLowerCase();
  return query.toLowerCase().trim().split(/\s+/).filter(Boolean).every((word) => text.includes(word));
}

export const initialState: ShopState = { cart: [], budget: 200, lastChangedBy: 'shopper' };
export const productFor = (id: string) => products.find((product) => product.id === id)!;
export const totalFor = (cart: CartLine[]) => cart.reduce((sum, line) => sum + productFor(line.productId).price * line.quantity, 0);
export const countFor = (cart: CartLine[]) => cart.reduce((sum, line) => sum + line.quantity, 0);
export const money = (value: number) => `$${value.toFixed(2)}`;
