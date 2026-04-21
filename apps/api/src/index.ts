import express, { Express, Request, Response } from "express";
import authRouter from "./routes/auth";
import eventsRouter from "./routes/events";
import registrationsRouter from "./routes/registrations";
import teamsRouter from "./routes/teams";

const app: Express = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware (adjust origins as needed)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Health check route
app.get("/", (req: Request, res: Response) => {
    res.json({
        success: true,
        message: "Event Services API",
        status: "Healthy",
        version: "1.0.0",
        endpoints: {
            auth: "/api/auth",
            events: "/api/events",
            registrations: "/api/registrations",
            teams: "/api/teams",
        },
        info: {
            description: "Event management platform with team registration",
            features: [
                "Event creation with credentials",
                "Public registration forms",
                "Team management",
                "Admin authentication"
            ]
        }
    });
});

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/events", eventsRouter);
app.use("/api/registrations", registrationsRouter);
app.use("/api/teams", teamsRouter);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: "Route not found",
    });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: Function) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: "Internal server error",
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

export default app;

