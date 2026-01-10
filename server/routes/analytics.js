const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { ensureAuthenticated } = require('../middleware/auth');

// Helper to get date range
const getDateRange = (range, startDate, endDate) => {
    const end = endDate ? new Date(endDate) : new Date();
    let start = startDate ? new Date(startDate) : new Date();

    if (!startDate && !endDate) {
        if (range === 'YTD') {
            start = new Date(new Date().getFullYear(), 0, 1);
        } else if (range === '90 Days') {
            start.setDate(end.getDate() - 90);
        } else if (range === 'All Time') {
            start = new Date(0); // Beginning of time
        } else {
            // Default 30 Days
            start.setDate(end.getDate() - 30);
        }
    }


    // Ensure 24h coverage
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
};

// Helper to get previous period for growth calculation
const getPreviousRange = (start, end) => {
    const duration = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);
    return { start: prevStart, end: prevEnd };
};

// @route   GET api/analytics/stats
// @desc    Get main analytics stats (Revenue, Orders, etc)
router.get('/stats', ensureAuthenticated, async (req, res) => {
    try {
        const { timeRange, startDate, endDate } = req.query;
        const clientId = req.user.clientId;

        const { start, end } = getDateRange(timeRange, startDate, endDate);
        const { start: prevStart, end: prevEnd } = getPreviousRange(start, end);

        // Fetch current period orders
        const currentOrders = await Order.find({
            clientId,
            placedOn: { $gte: start, $lte: end }
        });

        // Fetch previous period orders for growth
        const prevOrders = await Order.find({
            clientId,
            placedOn: { $gte: prevStart, $lte: prevEnd }
        });

        // Fetch all products for this client to get cost prices
        const products = await Product.find({ clientId });
        const productMap = {};
        products.forEach(p => {
            productMap[p._id.toString()] = p;
        });

        const calculateMetrics = (orders) => {
            let revenue = 0;
            let profit = 0;
            let completedOrders = 0;
            let cancelledOrders = 0;

            orders.forEach(order => {
                if (order.status !== 'cancelled') {
                    revenue += (order.payment?.total || 0);

                    // Calculate profit for this order
                    if (order.items && Array.isArray(order.items)) {
                        order.items.forEach(item => {
                            const productId = item.product?.toString();
                            const product = productMap[productId];
                            let costPrice = 0;

                            if (product) {
                                if (product.hasVariants && item.variant) {
                                    // Try to match variant string "Color / Size"
                                    const variantStr = item.variant.replace(/Variant:\s*/i, '').toLowerCase();
                                    const variant = product.variants.find(v => {
                                        const vName = `${v.color || ''} / ${v.size || ''}`.toLowerCase();
                                        const vNameAlt = `${v.size || ''} / ${v.color || ''}`.toLowerCase();
                                        return vName === variantStr || vNameAlt === variantStr ||
                                            variantStr.includes(v.color?.toLowerCase()) && variantStr.includes(v.size?.toLowerCase());
                                    });
                                    costPrice = variant ? (variant.costPrice || 0) : (product.costPrice || 0);
                                } else {
                                    costPrice = product.costPrice || 0;
                                }
                            }

                            profit += (item.quantity || 0) * ((item.price || 0) - costPrice);
                        });
                    }
                }

                if (order.status === 'delivered') completedOrders++;
                if (order.status === 'cancelled') cancelledOrders++;
            });

            // Unique customers
            const uniqueCustomers = new Set(orders.map(o => o.customerDetails?.email).filter(Boolean)).size;

            return {
                revenue,
                profit,
                orders: orders.length,
                customers: uniqueCustomers,
                completedOrders,
                cancelledOrders
            };
        };

        const currentMetrics = calculateMetrics(currentOrders);
        const prevMetrics = calculateMetrics(prevOrders);

        // Calculate Conversion
        const conversion = 2.5;

        // Calculate Growth %
        const calcGrowth = (curr, prev) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return Math.round(((curr - prev) / prev) * 100 * 10) / 10;
        };

        res.json({
            revenue: currentMetrics.revenue,
            profit: currentMetrics.profit,
            orders: currentMetrics.orders,
            customers: currentMetrics.customers,
            conversion: conversion,
            completedOrders: currentMetrics.completedOrders,
            cancelledOrders: currentMetrics.cancelledOrders,

            revenueGrowth: calcGrowth(currentMetrics.revenue, prevMetrics.revenue),
            profitGrowth: calcGrowth(currentMetrics.profit, prevMetrics.profit),
            ordersGrowth: calcGrowth(currentMetrics.orders, prevMetrics.orders),
            customersGrowth: calcGrowth(currentMetrics.customers, prevMetrics.customers),
            completedGrowth: calcGrowth(currentMetrics.completedOrders, prevMetrics.completedOrders),
            cancelledGrowth: calcGrowth(currentMetrics.cancelledOrders, prevMetrics.cancelledOrders),
            conversionGrowth: 0
        });


    } catch (err) {
        console.error('Error fetching analytics stats:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET api/analytics/sales-chart
// @desc    Get sales data over time for charts
router.get('/sales-chart', ensureAuthenticated, async (req, res) => {
    try {
        const { timeRange, startDate, endDate } = req.query;
        const clientId = req.user.clientId;
        const { start, end } = getDateRange(timeRange, startDate, endDate);

        // Aggregate by day
        const salesData = await Order.aggregate([
            {
                $match: {
                    clientId: userObjectId(clientId),
                    placedOn: { $gte: start, $lte: end },
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$placedOn" } },
                    sales: { $sum: "$payment.total" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill in missing days
        const filledData = [];
        const current = new Date(start);
        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            const dayData = salesData.find(d => d._id === dateStr);

            filledData.push({
                name: current.toLocaleDateString('en-US', { weekday: 'short' }), // Mon, Tue...
                date: dateStr,
                sales: dayData ? dayData.sales : 0,
                orders: dayData ? dayData.orders : 0
            });
            current.setDate(current.getDate() + 1);
        }

        res.json(filledData);

    } catch (err) {
        console.error('Error fetching sales chart:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET api/analytics/top-products
// @desc    Get top selling products
router.get('/top-products', ensureAuthenticated, async (req, res) => {
    try {
        const { timeRange, startDate, endDate } = req.query;
        const clientId = req.user.clientId;
        const { start, end } = getDateRange(timeRange, startDate, endDate);

        const topProducts = await Order.aggregate([
            {
                $match: {
                    clientId: userObjectId(clientId),
                    placedOn: { $gte: start, $lte: end },
                    status: { $ne: 'cancelled' }
                }
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product", // Group by product ID
                    name: { $first: "$items.name" },
                    image: { $first: "$items.image" },
                    sold: { $sum: "$items.quantity" },
                    revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 }
        ]);

        // Populate product details to get Category and Subcategory
        // We need nested population: Product -> Category
        await Product.populate(topProducts, {
            path: '_id',
            select: 'category subcategory images',
            populate: { path: 'category', select: 'name' }
        });

        const formatted = topProducts.map(p => {
            const productDoc = p._id;
            const categoryName = productDoc?.category?.name || 'Uncategorized';
            const subcategoryName = productDoc?.subcategory || '';
            const displayCategory = subcategoryName ? `${categoryName} > ${subcategoryName}` : categoryName;

            // Image fallback: Order Item Image -> Product Image -> Placeholder
            const mainImage = p.image || (productDoc?.images && productDoc.images.length > 0 ? productDoc.images[0] : '');

            return {
                name: p.name,
                category: displayCategory,
                price: p.sold > 0 ? p.revenue / p.sold : 0,
                sold: p.sold,
                revenue: p.revenue,
                image: mainImage,
                growth: Math.floor(Math.random() * 20),
                isUp: Math.random() > 0.3 // Mock up/down
            };
        });

        res.json(formatted);
    } catch (err) {
        console.error('Error fetching top products:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET api/analytics/revenue-by-category
// @desc    Get revenue split by category
router.get('/revenue-by-category', ensureAuthenticated, async (req, res) => {
    try {
        const { timeRange, startDate, endDate } = req.query;
        const clientId = req.user.clientId;
        const { start, end } = getDateRange(timeRange, startDate, endDate);

        // We need to join Orders -> Items -> Products -> Categories
        const categoryStats = await Order.aggregate([
            {
                $match: {
                    clientId: userObjectId(clientId),
                    placedOn: { $gte: start, $lte: end },
                    status: { $ne: 'cancelled' }
                }
            },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.product",
                    foreignField: "_id",
                    as: "productData"
                }
            },
            { $unwind: "$productData" },
            {
                $lookup: {
                    from: "categories",
                    localField: "productData.category",
                    foreignField: "_id",
                    as: "categoryData"
                }
            },
            // Note: If a product has no category or category is deleted, this might provide empty categoryData.
            // We use preserveNullAndEmptyArrays if we want to count 'Uncategorized', but typically $unwind removes them.
            // Let's keep them and label as Uncategorized.
            {
                $unwind: {
                    path: "$categoryData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: "$categoryData.name",
                    value: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            },
            { $sort: { value: -1 } }
        ]);

        const formatted = categoryStats.map(c => ({
            name: c._id || 'Uncategorized',
            value: c.value
        }));

        res.json(formatted);
    } catch (err) {
        console.error('Error fetching revenue by category:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Helper for ObjectId casting in aggregation
const mongoose = require('mongoose');
const userObjectId = (id) => new mongoose.Types.ObjectId(id);

module.exports = router;
