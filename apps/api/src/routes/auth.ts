import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { db } from '../lib/db';
import { credentials, events } from '../db/schema';
import { eq } from 'drizzle-orm';

const router: ExpressRouter = Router();

// Login endpoint for admins (expects hashed password from external app)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, hashedPassword } = req.body;

    if (!username || !hashedPassword) {
      return res.status(400).json({
        success: false,
        error: 'Username and hashedPassword are required',
      });
    }

    // Find user
    const [user] = await db.select()
      .from(credentials)
      .where(eq(credentials.username, username));

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Verify hashed password
    if (hashedPassword !== user.password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
});

// Get events by credential owner (for admin dashboard)
// Admin must authenticate with username and hashedPassword
router.post('/my-events', async (req: Request, res: Response) => {
  try {
    const { username, hashedPassword } = req.body;

    if (!username || !hashedPassword) {
      return res.status(400).json({
        success: false,
        error: 'Username and hashedPassword are required for authentication',
      });
    }

    // Verify credentials
    const [user] = await db.select()
      .from(credentials)
      .where(eq(credentials.username, username));

    if (!user || user.password !== hashedPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Get events owned by this admin with all registrations
    const userEvents = await db.query.events.findMany({
      where: eq(events.owner, username),
      with: {
        teams: {
          with: {
            members: true,
          },
        },
        registrations: true,
      },
    });

    res.json({
      success: true,
      data: userEvents,
      count: userEvents.length,
      message: `Found ${userEvents.length} events for ${username}`,
    });
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events',
    });
  }
});

export default router;

// Made with Bob
