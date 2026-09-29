import aeroglideImage from '../assets/images/aeroglide.jpg';
import classicCourtImage from '../assets/images/classic-court.jpg';
import elevateHighTopImage from '../assets/images/elevate-high-top.jpg';
import urbanSuedeImage from '../assets/images/urban-suede.jpg';

export const users = [
  { username: 'admin', password: 'password', role: 'administrator' },
  { username: 'client', password: 'password', role: 'client' }
];

export const initialShoes = [
  {
    id: 's1',
    name: 'AeroGlide Pro Runner',
    brand: 'Finish Line',
    price: 150.00,
    category: 'Running',
    image: aeroglideImage,
    description: 'Ultra-lightweight mesh and responsive foam make this the ultimate racing shoe.',
    sizes: [8, 9, 10, 11, 12],
    stock: 24,
    colors: ['Red', 'Black']
  },
  {
    id: 's2',
    name: 'Classic Court Leather',
    brand: 'Finish Line',
    price: 110.00,
    category: 'Casual',
    image: classicCourtImage,
    description: 'Premium white leather and classic styling for everyday comfort.',
    sizes: [7, 8, 9, 10, 11, 12],
    stock: 45,
    colors: ['White', 'Off-White']
  },
  {
    id: 's3',
    name: 'Elevate High-Top X',
    brand: 'Finish Line',
    price: 185.00,
    category: 'Basketball',
    image: elevateHighTopImage,
    description: 'Ankle support and high-grip rubber for explosive court performance.',
    sizes: [9, 10, 10.5, 11, 11.5, 12, 13],
    stock: 12,
    colors: ['Black/Green', 'White/Blue']
  },
  {
    id: 's4',
    name: 'Urban Suede Retro',
    brand: 'Finish Line',
    price: 130.00,
    category: 'Lifestyle',
    image: urbanSuedeImage,
    description: 'Navy blue suede with a chunky retro sole for maximum style.',
    sizes: [8, 8.5, 9, 9.5, 10, 11],
    stock: 30,
    colors: ['Navy Blue', 'Tan']
  }
];

export const storeLocations = [
  { id: 'l1', name: 'Downtown Main', address: '123 Market St, City Center' },
  { id: 'l2', name: 'Westside Mall', address: '456 Fashion Ave, Westside' },
  { id: 'l3', name: 'Northgate Plaza', address: '789 Retail Rd, Northgate' }
];
