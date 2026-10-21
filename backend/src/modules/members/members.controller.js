import { membersService } from './members.service.js';
import { actionsService } from '../actions/actions.service.js';

export const membersController = {
  async list(req, res) {
    const { page, limit, q, status } = req.query;
    const result = await membersService.list({
      page: page != null ? Number(page) : undefined,
      limit: limit != null ? Number(limit) : undefined,
      q,
      status,
    });
    res.json({ success: true, ...result });
  },

  async getById(req, res) {
    const member = await membersService.getById(req.params.id);
    res.json({ success: true, member });
  },

  async create(req, res) {
    const member = await membersService.create(req.body, req.admin);
    await actionsService.record({
      admin: req.admin,
      type: 'create_member',
      summary: `${member.name} নামে নতুন সদস্য তৈরি করেছেন`,
      meta: {
        memberId: member.id,
        memberCode: member.code,
        memberName: member.name,
        phone: member.phone,
        plan: member.plan,
        amount: member.amount,
      },
    });
    res.status(201).json({ success: true, member });
  },

  async update(req, res) {
    const member = await membersService.update(req.params.id, req.body);
    await actionsService.record({
      admin: req.admin,
      type: 'update_member',
      summary: `${member.name}-এর তথ্য আপডেট করেছেন`,
      meta: {
        memberId: member.id,
        memberCode: member.code,
        memberName: member.name,
        phone: member.phone,
      },
    });
    res.json({ success: true, member });
  },

  async remove(req, res) {
    const member = await membersService.remove(req.params.id);
    await actionsService.record({
      admin: req.admin,
      type: 'delete_member',
      summary: `${member.name} নামের সদস্য মুছেছেন`,
      meta: {
        memberId: member.id,
        memberCode: member.code,
        memberName: member.name,
        phone: member.phone,
      },
    });
    res.status(204).send();
  },

  async acceptPayment(req, res) {
    const { member, method, amount } = await membersService.acceptPayment(
      req.params.id,
      req.body,
      req.admin
    );
    await actionsService.record({
      admin: req.admin,
      type: 'accept_payment',
      summary: `${member.name}-এর পেমেন্ট গ্রহণ করেছেন (৳${amount})`,
      meta: {
        memberId: member.id,
        memberCode: member.code,
        memberName: member.name,
        phone: member.phone,
        plan: member.plan,
        amount,
        method,
        expiry: member.expiry,
      },
    });
    res.json({ success: true, member, method, amount });
  },
};
