import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

const secretKey = 'your-secret-key';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { token, webhookContext } = req.body;

  try {
    // Verify the JWT using the secret key
    const decodedToken = jwt.verify(token, secretKey);

    // Check if the guild ID in the token matches the one provided in the request
    if (decodedToken.guildId === webhookContext.guildId) {
      res.status(200).json({ valid: true });
    } else {
      res.status(403).json({ valid: false });
    }
  } catch (error) {
    res.status(401).json({ valid: false });
  }
};

export default handler;