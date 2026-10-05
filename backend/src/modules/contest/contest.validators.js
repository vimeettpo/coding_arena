const { z } = require('zod');

const createContestSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(''),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  negativeMarking: z.boolean().optional().default(false),
  problemIds: z.array(z.string()).min(1),
});

module.exports = { createContestSchema };
