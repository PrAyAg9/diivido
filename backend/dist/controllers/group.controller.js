"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMember = exports.getGroupById = exports.getGroups = exports.createGroup = void 0;
const group_model_1 = require("../models/group.model");
const createGroup = async (req, res) => {
    try {
        console.log('Create group request body:', req.body);
        const { name, description, avatarUrl, members = [] } = req.body;
        // Use userId from token
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const userId = req.user.id;
        console.log('Creating group for user:', userId, req.user);
        // Create group with the current user as admin
        const group = new group_model_1.Group({
            name,
            description,
            avatarUrl,
            createdBy: userId,
            members: [
                {
                    userId,
                    role: 'admin',
                    joinedAt: new Date(),
                },
                // Add additional members if provided
                ...members.map((memberId) => ({
                    userId: memberId,
                    role: 'member',
                    joinedAt: new Date(),
                })),
            ],
        });
        console.log('Saving group:', group);
        await group.save();
        // Return the created group, populated with creator info
        const populatedGroup = await group_model_1.Group.findById(group._id)
            .populate('members.userId', 'fullName email avatarUrl')
            .populate('createdBy', 'fullName email avatarUrl');
        console.log('Group created successfully:', populatedGroup);
        res.status(201).json(populatedGroup);
    }
    catch (error) {
        console.error('Error creating group:', error); // Log the actual error
        res.status(500).json({ message: 'Failed to create group.' });
    }
};
exports.createGroup = createGroup;
const getGroups = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const userId = req.user.id;
        console.log('Getting groups for user:', userId);
        const groups = await group_model_1.Group.find({
            'members.userId': userId,
        })
            .populate('members.userId', 'fullName email avatarUrl')
            .populate('createdBy', 'fullName avatarUrl');
        // Transform the data to match the expected frontend structure
        const transformedGroups = groups.map((group) => {
            const plainGroup = group.toObject();
            return {
                id: plainGroup._id.toString(),
                name: plainGroup.name,
                description: plainGroup.description || null,
                avatarUrl: plainGroup.avatarUrl || null,
                members: plainGroup.members.map((member) => ({
                    userId: member.userId._id
                        ? member.userId._id.toString()
                        : member.userId.toString(),
                    role: member.role,
                    joinedAt: member.joinedAt,
                })),
                balance: 0, // This should be calculated from expenses if needed
                totalExpenses: 0, // This should be calculated from expenses if needed
                lastActivity: plainGroup.updatedAt
                    ? new Date(plainGroup.updatedAt).toISOString().split('T')[0]
                    : 'No activity',
            };
        });
        console.log('Transformed groups:', transformedGroups.length);
        res.status(200).json(transformedGroups); // Use 200 for successful GET
    }
    catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ message: 'Failed to fetch groups.' });
    }
};
exports.getGroups = getGroups;
const getGroupById = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        // Log the request parameters and headers for debugging
        console.log('getGroupById request params:', req.params);
        // Check for invalid or undefined groupId
        if (!groupId || groupId === 'undefined' || groupId === 'null') {
            return res.status(400).json({ message: 'Invalid group ID provided.' });
        }
        // Get userId using the flexible approach
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const userId = req.user.id;
        console.log('Getting group details for user:', userId);
        // Find group and populate required fields
        const group = await group_model_1.Group.findOne({
            _id: groupId,
            'members.userId': userId, // This ensures only members can view the group
        })
            .populate('members.userId', 'fullName email avatarUrl')
            .populate('createdBy', 'fullName avatarUrl');
        if (!group) {
            return res
                .status(404)
                .json({ message: 'Group not found or you are not a member.' });
        }
        // Get the raw JSON data to avoid typing issues with populated fields
        const rawGroup = group.toObject();
        console.log('Raw group data:', JSON.stringify(rawGroup, null, 2));
        // Transform the data to match frontend expected format
        const transformedGroup = {
            id: rawGroup._id.toString(),
            name: rawGroup.name,
            description: rawGroup.description || null,
            avatarUrl: rawGroup.avatarUrl || null,
            createdBy: rawGroup.createdBy,
            members: rawGroup.members.map((member) => ({
                id: member.userId._id
                    ? member.userId._id.toString()
                    : member.userId.toString(),
                fullName: member.userId.fullName || null,
                email: member.userId.email || null,
                avatarUrl: member.userId.avatarUrl || null,
                role: member.role,
                joinedAt: member.joinedAt,
            })),
            createdAt: rawGroup.createdAt,
            updatedAt: rawGroup.updatedAt,
        };
        console.log('Group found and transformed for frontend');
        res.status(200).json(transformedGroup);
    }
    catch (error) {
        console.error(`Error fetching group ${req.params.id}:`, error);
        res.status(500).json({ message: 'Failed to fetch group.' });
    }
};
exports.getGroupById = getGroupById;
const addMember = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const { userId: newMemberId } = req.body; // Renamed to avoid confusion
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const requestingUserId = req.user.id;
        const group = await group_model_1.Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }
        // Check if the user making the request is an admin
        const isAdmin = group.members.some((m) => m.userId.toString() === requestingUserId.toString() &&
            m.role === 'admin');
        if (!isAdmin) {
            return res
                .status(403)
                .json({ message: 'Permission denied. Only admins can add members.' });
        }
        // Check if the user is already a member
        const memberExists = group.members.some((m) => m.userId.toString() === newMemberId.toString());
        if (memberExists) {
            return res
                .status(409)
                .json({ message: 'User is already a member of this group.' }); // 409 Conflict is more semantic
        }
        // Add the new member
        group.members.push({
            userId: newMemberId,
            role: 'member',
            // FIX: Add the required 'joinedAt' field
            joinedAt: new Date(),
        });
        await group.save();
        const updatedGroup = await group.populate('members.userId', 'fullName email avatarUrl');
        res.status(200).json(updatedGroup);
    }
    catch (error) {
        console.error(`Error adding member to group ${req.params.id}:`, error);
        res.status(500).json({ message: 'Failed to add member.' });
    }
};
exports.addMember = addMember;
