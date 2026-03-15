import express, { Request, Response } from 'express';
import axios from 'axios';

const ICECAT_USERNAME = 'openIcecat-live';

const router = express.Router();

router.get('/product', async (req: Request, res: Response) => {
  let { gtin = undefined } = req.query;

  if (!gtin) {
    gtin = '0711719709695';
  }

  try {
    const icecatUrl = `https://live.icecat.biz/api?shopname=${ICECAT_USERNAME}&GTIN=${gtin}&lang=EN&content=`;

    const response = await axios.get(icecatUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    return res.json(response.data);
  } catch (error: any) {
    console.error('Icecat Fehler:', error.message);

    return res.status(500).json({
      error: 'Fehler beim Abrufen der Produktdaten',
      details: error.message,
    });
  }
});

export default router;