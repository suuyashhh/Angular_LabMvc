import { FoodItem } from './interfaces';

export const MOCK_FOOD_ITEMS: FoodItem[] = [
  {
    id: 'food_001',
    name: 'Filter Coffee',
    price: 30,
    category: 'Drinks',
    image: '',
    active: true
  },
  {
    id: 'food_002',
    name: 'Aloo Paratha',
    price: 70,
    category: 'Paratha',
    image: '',
    active: true
  },
  {
    id: 'food_003',
    name: 'Puri Bhaji',
    price: 65,
    category: 'Paratha',
    image: '',
    active: true
  },
  {
    id: 'food_004',
    name: 'Vada (2 pcs)',
    price: 40,
    category: 'Idli',
    image: '',
    active: true
  },
  {
    id: 'food_005',
    name: 'Poha',
    price: 50,
    category: 'Snacks',
    image: '',
    active: true
  },
  {
    id: 'food_006',
    name: 'Upma',
    price: 50,
    category: 'Snacks',
    image: '',
    active: true
  },
  {
    id: 'food_007',
    name: 'Masala Chai',
    price: 20,
    category: 'Drinks',
    image: '',
    active: true
  },
  {
    id: 'food_008',
    name: 'Plain Dosa',
    price: 60,
    category: 'Dosa',
    image: '',
    active: true
  },
  {
    id: 'food_009',
    name: 'Idli (2 pcs)',
    price: 40,
    category: 'Idli',
    image: '',
    active: true
  },
  {
    id: 'food_010',
    name: 'Masala Dosa',
    price: 80,
    category: 'Dosa',
    image: '',
    active: true
  }
];

export const CATEGORIES = ['All', 'Drinks', 'Paratha', 'Idli', 'Snacks', 'Dosa'];

export const FOOD_EMOJI_MAP: { [key: string]: string } = {
  'Filter Coffee': '☕',
  'Aloo Paratha': '🫓',
  'Puri Bhaji': '🍛',
  'Vada (2 pcs)': '🍩',
  'Poha': '🍚',
  'Upma': '🍲',
  'Masala Chai': '🍵',
  'Plain Dosa': '🥞',
  'Idli (2 pcs)': '🥟',
  'Masala Dosa': '🥞'
};
