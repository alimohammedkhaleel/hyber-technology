import { Router } from 'express';
import authRoutes from './auth.routes';
import productsRoutes from './products.routes';
import categoriesRoutes from './categories.routes';
import carouselRoutes from './carousel.routes';
import settingsRoutes from './settings.routes';
import exchangeRateRoutes from './exchangeRate.routes';
import ordersRoutes from './orders.routes';
import cartRoutes from './cart.routes';
import customersRoutes from './customers.routes';
import notificationsRoutes from './notifications.routes';
import adminRoutes from './admin.routes';
import healthRoutes from './health.routes';

import uploadRoutes from './upload.routes';

const v1Router = Router();

// Public & Customer Catalog & Orders
v1Router.use('/auth', authRoutes);
v1Router.use('/products', productsRoutes);
v1Router.use('/categories', categoriesRoutes);
v1Router.use('/carousel', carouselRoutes);
v1Router.use('/settings', settingsRoutes);
v1Router.use('/exchange-rate', exchangeRateRoutes);
v1Router.use('/orders', ordersRoutes);
v1Router.use('/cart', cartRoutes);
v1Router.use('/customers', customersRoutes);
v1Router.use('/notifications', notificationsRoutes);
v1Router.use('/upload', uploadRoutes);

// Admin Control Panel
v1Router.use('/admin', adminRoutes);

// System Health
v1Router.use('/health', healthRoutes);

export default v1Router;
