"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    console.error('Please check your .env file');
    process.exit(1);
}
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const group_routes_1 = __importDefault(require("./routes/group.routes"));
const expense_routes_1 = __importDefault(require("./routes/expense.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const invitation_routes_1 = __importDefault(require("./routes/invitation.routes"));
const friends_routes_1 = __importDefault(require("./routes/friends.routes"));
const ai_routes_1 = __importDefault(require("./routes/ai.routes"));
const quickdraw_routes_1 = __importDefault(require("./routes/quickdraw.routes"));
const budget_routes_1 = __importDefault(require("./routes/budget.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
// Database connection
mongoose_1.default
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.error('MongoDB connection error:', error));
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Divido Backend is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});
// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to Divido Backend API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            groups: '/api/groups',
            expenses: '/api/expenses',
            payments: '/api/payments',
            users: '/api/users',
            invitations: '/api/invitations',
            friends: '/api/friends',
            ai: '/api/ai',
            quickdraw: '/api/quickdraw',
            budget: '/api/budget',
            notifications: '/api/notifications',
        },
    });
});
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/groups', group_routes_1.default);
app.use('/api/expenses', expense_routes_1.default);
app.use('/api/payments', payment_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/invitations', invitation_routes_1.default);
app.use('/api/friends', friends_routes_1.default);
app.use('/api/ai', ai_routes_1.default);
app.use('/api/quickdraw', quickdraw_routes_1.default);
app.use('/api/budget', budget_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
