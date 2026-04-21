import { Router, Request, Response } from 'express';
import { db } from '../lib/db';
import { teams, events, registrations } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Get all teams for an event
router.get('/event/:eventId', async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId as string);
    
    if (isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event ID',
      });
    }

    const eventTeams = await db.query.teams.findMany({
      where: eq(teams.eventId, eventId),
      with: {
        members: true,
        event: true,
      },
    });

    res.json({
      success: true,
      data: eventTeams,
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch teams',
    });
  }
});

// Get available teams (not full) for an event
router.get('/event/:eventId/available', async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId as string);
    
    if (isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event ID',
      });
    }

    const eventTeams = await db.query.teams.findMany({
      where: eq(teams.eventId, eventId),
      with: {
        members: true,
        event: true,
      },
    });

    // Filter teams that are not full
    const availableTeams = eventTeams.filter(
      (team) => team.members.length < team.event.teamSize
    );

    res.json({
      success: true,
      data: availableTeams,
    });
  } catch (error) {
    console.error('Error fetching available teams:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available teams',
    });
  }
});

// Get single team by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.id as string);
    
    if (isNaN(teamId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid team ID',
      });
    }

    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
      with: {
        members: true,
        event: true,
      },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }

    res.json({
      success: true,
      data: team,
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team',
    });
  }
});

// Create new team
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, eventId } = req.body;

    // Validation
    if (!name || !eventId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, eventId',
      });
    }

    // Check if event exists
    const event = await db.select().from(events).where(eq(events.id, eventId));
    if (event.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    // Check if team name already exists for this event
    const existingTeam = await db.select()
      .from(teams)
      .where(and(
        eq(teams.name, name),
        eq(teams.eventId, eventId)
      ));

    if (existingTeam.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Team name already exists for this event',
      });
    }

    const [newTeam] = await db.insert(teams).values({
      name,
      eventId,
    }).returning();

    // Fetch complete team with event info
    const completeTeam = await db.query.teams.findFirst({
      where: eq(teams.id, newTeam.id),
      with: {
        event: true,
        members: true,
      },
    });

    res.status(201).json({
      success: true,
      data: completeTeam,
      message: 'Team created successfully',
    });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create team',
    });
  }
});

// Update team name
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.id as string);
    
    if (isNaN(teamId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid team ID',
      });
    }

    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Team name is required',
      });
    }

    // Check if team exists
    const existingTeam = await db.select().from(teams).where(eq(teams.id, teamId));
    if (existingTeam.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }

    // Check if new name conflicts with existing team in same event
    const conflictingTeam = await db.select()
      .from(teams)
      .where(and(
        eq(teams.name, name),
        eq(teams.eventId, existingTeam[0].eventId)
      ));

    if (conflictingTeam.length > 0 && conflictingTeam[0].id !== teamId) {
      return res.status(400).json({
        success: false,
        error: 'Team name already exists for this event',
      });
    }

    const [updatedTeam] = await db.update(teams)
      .set({
        name,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, teamId))
      .returning();

    res.json({
      success: true,
      data: updatedTeam,
      message: 'Team updated successfully',
    });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update team',
    });
  }
});

// Delete team
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.id as string);
    
    if (isNaN(teamId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid team ID',
      });
    }

    // Check if team exists
    const existingTeam = await db.select().from(teams).where(eq(teams.id, teamId));
    if (existingTeam.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }

    // Check if team has members
    const teamMembers = await db.select()
      .from(registrations)
      .where(eq(registrations.teamId, teamId));

    if (teamMembers.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete team with existing members. Remove all members first.',
      });
    }

    await db.delete(teams).where(eq(teams.id, teamId));

    res.json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete team',
    });
  }
});

// Get team capacity status
router.get('/:id/capacity', async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.id as string);
    
    if (isNaN(teamId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid team ID',
      });
    }

    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
      with: {
        members: true,
        event: true,
      },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }

    const capacity = {
      currentMembers: team.members.length,
      maxCapacity: team.event.teamSize,
      availableSlots: team.event.teamSize - team.members.length,
      isFull: team.members.length >= team.event.teamSize,
    };

    res.json({
      success: true,
      data: capacity,
    });
  } catch (error) {
    console.error('Error fetching team capacity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team capacity',
    });
  }
});

export default router;

// Made with Bob
