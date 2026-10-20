import { membersService } from './members.service.js';

export const membersController = {
  async list(req, res) {
    const members = await membersService.list();
    res.json({ success: true, members });
  },

  async getById(req, res) {
    const member = await membersService.getById(req.params.id);
    res.json({ success: true, member });
  },

  async create(req, res) {
    const member = await membersService.create(req.body);
    res.status(201).json({ success: true, member });
  },

  async update(req, res) {
    const member = await membersService.update(req.params.id, req.body);
    res.json({ success: true, member });
  },

  async remove(req, res) {
    await membersService.remove(req.params.id);
    res.status(204).send();
  },
};
